//! Markdown notes.
//!
//! Each note is a real `.md` file in `<app_data_dir>/notes/`, named after its
//! title — the Obsidian model, so the folder stays useful outside Fokus and a
//! `[[Wiki Link]]` is just a file name. Rust owns the folder so the frontend
//! never needs filesystem scope, and so search and backlinks can grep on disk
//! instead of holding every note in memory.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NoteMeta {
    pub title: String,
    /// Milliseconds since the epoch, for sorting by recency.
    pub modified: f64,
    /// First non-empty line that isn't the title heading, for the list.
    pub excerpt: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct NoteHit {
    pub title: String,
    /// 1-based line number of the match.
    pub line: usize,
    pub snippet: String,
}

/// Characters Windows forbids in a file name, plus the path separators.
const ILLEGAL: &[char] = &['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

fn validate_title(title: &str) -> Result<&str, String> {
    let trimmed = title.trim();
    if trimmed.is_empty() {
        return Err("a note needs a name".into());
    }
    if trimmed.len() > 120 {
        return Err("that name is too long".into());
    }
    if trimmed.chars().any(|c| ILLEGAL.contains(&c) || c.is_control()) {
        return Err(format!("a note name can't contain any of {}", ILLEGAL.iter().collect::<String>()));
    }
    // ".." alone would escape the folder even without a separator.
    if trimmed.chars().all(|c| c == '.') {
        return Err("that name isn't allowed".into());
    }
    Ok(trimmed)
}

fn notes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data dir: {e}"))?
        .join("notes");
    fs::create_dir_all(&dir).map_err(|e| format!("could not create {}: {e}", dir.display()))?;
    Ok(dir)
}

fn note_path(app: &AppHandle, title: &str) -> Result<PathBuf, String> {
    let name = validate_title(title)?;
    Ok(notes_dir(app)?.join(format!("{name}.md")))
}

fn modified_ms(path: &Path) -> f64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as f64)
        .unwrap_or(0.0)
}

fn excerpt_of(contents: &str) -> String {
    let line = contents
        .lines()
        .map(str::trim)
        .find(|l| !l.is_empty() && !l.starts_with('#'))
        .unwrap_or("");
    let mut out: String = line.chars().take(120).collect();
    if line.chars().count() > 120 {
        out.push('…');
    }
    out
}

#[tauri::command]
pub fn list_notes(app: AppHandle) -> Result<Vec<NoteMeta>, String> {
    let dir = notes_dir(&app)?;
    let mut notes = Vec::new();

    for entry in fs::read_dir(&dir).map_err(|e| format!("could not read {}: {e}", dir.display()))? {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        let Some(title) = path.file_stem().and_then(|s| s.to_str()) else {
            continue;
        };
        let contents = fs::read_to_string(&path).unwrap_or_default();
        notes.push(NoteMeta {
            title: title.to_string(),
            modified: modified_ms(&path),
            excerpt: excerpt_of(&contents),
        });
    }

    // Most recently touched first — the list doubles as a "what was I doing".
    notes.sort_by(|a, b| b.modified.partial_cmp(&a.modified).unwrap_or(std::cmp::Ordering::Equal));
    Ok(notes)
}

#[tauri::command]
pub fn read_note(app: AppHandle, title: String) -> Result<String, String> {
    let path = note_path(&app, &title)?;
    match fs::read_to_string(&path) {
        Ok(text) => Ok(text),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(format!("could not read {}: {e}", path.display())),
    }
}

#[tauri::command]
pub fn write_note(app: AppHandle, title: String, contents: String) -> Result<(), String> {
    let path = note_path(&app, &title)?;
    let tmp = path.with_extension("md.tmp");
    fs::write(&tmp, contents).map_err(|e| format!("could not write {}: {e}", tmp.display()))?;
    fs::rename(&tmp, &path).map_err(|e| format!("could not commit {}: {e}", path.display()))
}

/// Creates an empty note, adding " 2", " 3" … if the name is taken.
#[tauri::command]
pub fn create_note(app: AppHandle, title: String) -> Result<NoteMeta, String> {
    let base = validate_title(&title)?.to_string();
    let dir = notes_dir(&app)?;

    let mut name = base.clone();
    let mut n = 2;
    while dir.join(format!("{name}.md")).exists() {
        name = format!("{base} {n}");
        n += 1;
    }

    let path = dir.join(format!("{name}.md"));
    fs::write(&path, "").map_err(|e| format!("could not create {}: {e}", path.display()))?;
    Ok(NoteMeta { title: name, modified: modified_ms(&path), excerpt: String::new() })
}

#[tauri::command]
pub fn rename_note(app: AppHandle, from: String, to: String) -> Result<String, String> {
    let source = note_path(&app, &from)?;
    let target_name = validate_title(&to)?.to_string();
    let dir = notes_dir(&app)?;
    let target = dir.join(format!("{target_name}.md"));

    if target.exists() && source != target {
        return Err(format!("a note called \"{target_name}\" already exists"));
    }
    fs::rename(&source, &target).map_err(|e| format!("could not rename: {e}"))?;
    Ok(target_name)
}

#[tauri::command]
pub fn delete_note(app: AppHandle, title: String) -> Result<(), String> {
    let path = note_path(&app, &title)?;
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("could not delete {}: {e}", path.display())),
    }
}

/// Reads every note once and hands the closure each line with its number.
fn scan<F>(app: &AppHandle, mut visit: F) -> Result<(), String>
where
    F: FnMut(&str, usize, &str),
{
    let dir = notes_dir(app)?;
    for entry in fs::read_dir(&dir).map_err(|e| format!("could not read {}: {e}", dir.display()))? {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        let Some(title) = path.file_stem().and_then(|s| s.to_str()) else {
            continue;
        };
        let Ok(contents) = fs::read_to_string(&path) else {
            continue;
        };
        for (i, line) in contents.lines().enumerate() {
            visit(title, i + 1, line);
        }
    }
    Ok(())
}

fn snippet(line: &str, at: usize) -> String {
    // A window around the match, so a hit deep in a long line is still readable.
    let start = line[..at].char_indices().rev().nth(40).map(|(i, _)| i).unwrap_or(0);
    let text: String = line[start..].chars().take(140).collect();
    let mut out = String::new();
    if start > 0 {
        out.push('…');
    }
    out.push_str(text.trim_end());
    out
}

#[tauri::command]
pub fn search_notes(app: AppHandle, query: String) -> Result<Vec<NoteHit>, String> {
    let needle = query.trim().to_lowercase();
    if needle.is_empty() {
        return Ok(Vec::new());
    }

    let mut hits = Vec::new();
    scan(&app, |title, line_no, line| {
        // Cap the result set: past a couple of hundred hits nobody is reading.
        if hits.len() >= 200 {
            return;
        }
        let haystack = line.to_lowercase();
        if let Some(at) = haystack.find(&needle) {
            hits.push(NoteHit { title: title.to_string(), line: line_no, snippet: snippet(line, at) });
        } else if title.to_lowercase().contains(&needle) && line_no == 1 {
            hits.push(NoteHit { title: title.to_string(), line: 1, snippet: snippet(line, 0) });
        }
    })?;
    Ok(hits)
}

/// Every note containing a `[[title]]` link to the given note.
#[tauri::command]
pub fn note_backlinks(app: AppHandle, title: String) -> Result<Vec<NoteHit>, String> {
    let target = format!("[[{}]]", title.trim().to_lowercase());
    let self_title = title.trim().to_lowercase();

    let mut hits = Vec::new();
    scan(&app, |source, line_no, line| {
        if source.to_lowercase() == self_title {
            return;
        }
        if line.to_lowercase().contains(&target) {
            hits.push(NoteHit { title: source.to_string(), line: line_no, snippet: snippet(line, 0) });
        }
    })?;
    Ok(hits)
}

/// Where the notes live, for the settings page.
#[tauri::command]
pub fn notes_location(app: AppHandle) -> Result<String, String> {
    Ok(notes_dir(&app)?.display().to_string())
}
