//! Local-only JSON storage.
//!
//! Every store is a single JSON file under `<app_data_dir>/data/<key>.json`.
//! Keys are restricted to `[a-z0-9_-]` so a key can never escape that folder.
//! Writes go to a temp file first and are then renamed over the target, so a
//! crash mid-write cannot leave a half-written store behind.

use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

fn sanitize(key: &str) -> Result<&str, String> {
    let ok = !key.is_empty()
        && key.len() <= 64
        && key
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-');
    if ok {
        Ok(key)
    } else {
        Err(format!("invalid store key: {key}"))
    }
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data dir: {e}"))?
        .join("data");
    fs::create_dir_all(&dir).map_err(|e| format!("could not create {}: {e}", dir.display()))?;
    Ok(dir)
}

fn store_path(app: &AppHandle, key: &str) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join(format!("{}.json", sanitize(key)?)))
}

/// Returns the raw JSON text of a store, or `None` if it has never been written.
#[tauri::command]
pub fn read_store(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let path = store_path(&app, &key)?;
    match fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("could not read {}: {e}", path.display())),
    }
}

#[tauri::command]
pub fn write_store(app: AppHandle, key: String, contents: String) -> Result<(), String> {
    let path = store_path(&app, &key)?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, contents).map_err(|e| format!("could not write {}: {e}", tmp.display()))?;
    fs::rename(&tmp, &path).map_err(|e| format!("could not commit {}: {e}", path.display()))
}

#[tauri::command]
pub fn delete_store(app: AppHandle, key: String) -> Result<(), String> {
    let path = store_path(&app, &key)?;
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("could not delete {}: {e}", path.display())),
    }
}

/// Where the data lives, so the settings page can show it to the user.
#[tauri::command]
pub fn store_location(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.display().to_string())
}
