//! Custom alarm sounds.
//!
//! Imported files are copied into `<app_data_dir>/sounds/` so the alarm keeps
//! working after the original is moved, renamed or deleted. A small sidecar
//! index keeps the display names, since ids are sanitised for the filesystem.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// Formats WebView2/WKWebView can decode. Anything else is rejected at import
/// so the failure surfaces in the file picker rather than at alarm time.
const ALLOWED_EXTENSIONS: &[&str] = &["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus", "webm"];

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomSound {
    pub id: String,
    /// The original filename, shown in the picker.
    pub name: String,
    pub extension: String,
}

fn sounds_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data dir: {e}"))?
        .join("sounds");
    fs::create_dir_all(&dir).map_err(|e| format!("could not create {}: {e}", dir.display()))?;
    Ok(dir)
}

fn index_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(sounds_dir(app)?.join("index.json"))
}

fn read_index(app: &AppHandle) -> Result<Vec<CustomSound>, String> {
    let path = index_path(app)?;
    match fs::read_to_string(&path) {
        Ok(text) => Ok(serde_json::from_str(&text).unwrap_or_default()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(e) => Err(format!("could not read {}: {e}", path.display())),
    }
}

fn write_index(app: &AppHandle, sounds: &[CustomSound]) -> Result<(), String> {
    let path = index_path(app)?;
    let text = serde_json::to_string_pretty(sounds).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| format!("could not write {}: {e}", path.display()))
}

fn slugify(input: &str) -> String {
    let mut out = String::new();
    let mut last_dash = true;
    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }
    let trimmed = out.trim_matches('-');
    let slug: String = trimmed.chars().take(40).collect();
    if slug.is_empty() {
        "sound".to_string()
    } else {
        slug
    }
}

fn file_name_of(sound: &CustomSound) -> String {
    format!("{}.{}", sound.id, sound.extension)
}

#[tauri::command]
pub fn list_custom_sounds(app: AppHandle) -> Result<Vec<CustomSound>, String> {
    let dir = sounds_dir(&app)?;
    // The index is only a name lookup; the files on disk decide what exists.
    let sounds = read_index(&app)?
        .into_iter()
        .filter(|s| dir.join(file_name_of(s)).is_file())
        .collect();
    Ok(sounds)
}

#[tauri::command]
pub fn import_custom_sound(app: AppHandle, path: String) -> Result<CustomSound, String> {
    let source = Path::new(&path);

    let extension = source
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .ok_or_else(|| "that file has no extension".to_string())?;

    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Err(format!("{extension} files can't be played as an alarm"));
    }

    let name = source
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("sound")
        .to_string();

    let mut sounds = read_index(&app)?;
    let dir = sounds_dir(&app)?;

    // Keep ids readable, but never let a second import clobber the first.
    let base = slugify(source.file_stem().and_then(|s| s.to_str()).unwrap_or("sound"));
    let mut id = base.clone();
    let mut n = 2;
    while sounds.iter().any(|s| s.id == id) || dir.join(format!("{id}.{extension}")).exists() {
        id = format!("{base}-{n}");
        n += 1;
    }

    let sound = CustomSound { id, name, extension };
    fs::copy(source, dir.join(file_name_of(&sound)))
        .map_err(|e| format!("could not copy that file: {e}"))?;

    sounds.push(sound.clone());
    write_index(&app, &sounds)?;
    Ok(sound)
}

#[tauri::command]
pub fn delete_custom_sound(app: AppHandle, id: String) -> Result<(), String> {
    let dir = sounds_dir(&app)?;
    let mut sounds = read_index(&app)?;

    if let Some(pos) = sounds.iter().position(|s| s.id == id) {
        let sound = sounds.remove(pos);
        let file = dir.join(file_name_of(&sound));
        if let Err(e) = fs::remove_file(&file) {
            if e.kind() != std::io::ErrorKind::NotFound {
                return Err(format!("could not delete {}: {e}", file.display()));
            }
        }
        write_index(&app, &sounds)?;
    }
    Ok(())
}

/// The raw audio bytes, handed to the frontend to wrap in a blob URL.
#[tauri::command]
pub fn read_custom_sound(app: AppHandle, id: String) -> Result<tauri::ipc::Response, String> {
    let dir = sounds_dir(&app)?;
    let sound = read_index(&app)?
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| format!("no imported sound called {id}"))?;

    let file = dir.join(file_name_of(&sound));
    let bytes = fs::read(&file).map_err(|e| format!("could not read {}: {e}", file.display()))?;
    Ok(tauri::ipc::Response::new(bytes))
}
