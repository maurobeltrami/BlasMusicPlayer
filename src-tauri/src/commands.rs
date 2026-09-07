use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use crate::metadata;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrackDto {
    pub title: String,
    pub artist: Option<String>,
    pub path: String,
    pub extension: String,
    pub cover: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FolderResultDto {
    pub folder_path: String,
    pub tracks: Vec<TrackDto>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileItemDto {
    pub name: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub path: String,
    pub is_dir: bool,
    pub cover: Option<String>,
}

#[tauri::command]
pub fn get_music_dir() -> String {
    dirs::audio_dir()
        .or_else(dirs::home_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "/".to_string())
}

#[tauri::command]
pub fn scan_directory(dir_path: String) -> Vec<FileItemDto> {
    let mut items = Vec::new();
    let path = Path::new(&dir_path);
    let cover = metadata::find_cover_art(path);
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            let name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
            if name.starts_with('.') { continue; }

            if p.is_dir() {
                items.push(FileItemDto {
                    name,
                    title: None,
                    artist: None,
                    path: p.to_string_lossy().to_string(),
                    is_dir: true,
                    cover: None,
                });
            } else if let Some(ext) = p.extension() {
                if metadata::is_audio(&ext.to_string_lossy()) {
                    let meta = metadata::extract_metadata(&p);
                    items.push(FileItemDto {
                        name,
                        title: Some(meta.title),
                        artist: meta.artist,
                        path: p.to_string_lossy().to_string(),
                        is_dir: false,
                        cover: cover.clone(),
                    });
                }
            }
        }
    }
    items.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    items
}

#[tauri::command]
pub fn scan_folder_recursive(dir_path: String) -> Vec<TrackDto> {
    let mut tracks = Vec::new();
    fn visit(dir: &Path, tracks: &mut Vec<TrackDto>) {
        let dir_cover = metadata::find_cover_art(dir);
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                let name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                if name.starts_with('.') { continue; }
                if p.is_dir() {
                    visit(&p, tracks);
                } else if let Some(ext) = p.extension() {
                    let ext_str = ext.to_string_lossy().to_string();
                    if metadata::is_audio(&ext_str) {
                        let meta = metadata::extract_metadata(&p);
                        tracks.push(TrackDto {
                            title: meta.title,
                            artist: meta.artist,
                            path: p.to_string_lossy().to_string(),
                            extension: ext_str,
                            cover: dir_cover.clone(),
                        });
                    }
                }
            }
        }
    }
    visit(Path::new(&dir_path), &mut tracks);
    tracks.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    tracks
}

#[tauri::command]
pub fn pick_audio_folder() -> Option<FolderResultDto> {
    if let Some(folder) = rfd::FileDialog::new().set_title("Seleziona cartella musicale").pick_folder() {
        let path_str = folder.to_string_lossy().to_string();
        let tracks = scan_folder_recursive(path_str.clone());
        return Some(FolderResultDto {
            folder_path: path_str,
            tracks,
        });
    }
    None
}
