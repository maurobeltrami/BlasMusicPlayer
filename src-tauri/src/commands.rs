// commands.rs - Comandi IPC Tauri per navigazione filesystem e riproduzione audio
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;
use crate::metadata;

/// DTO per una singola traccia audio con metadati
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrackDto {
    pub title: String,
    pub artist: Option<String>,
    pub path: String,
    pub extension: String,
    pub cover: Option<String>,
}

/// DTO per il risultato della selezione di una cartella musicale
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FolderResultDto {
    pub folder_path: String,
    pub tracks: Vec<TrackDto>,
}

/// DTO per un elemento del filesystem (file audio o cartella)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileItemDto {
    pub name: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub path: String,
    pub is_dir: bool,
    pub cover: Option<String>,
}

/// Restituisce la cartella Musica predefinita del sistema operativo.
/// Su Android usa il resolver di percorsi nativo di Tauri.
#[tauri::command]
pub fn get_music_dir(app: tauri::AppHandle) -> String {
    app.path().audio_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "/storage/emulated/0/Music".to_string())
}

/// Scansiona una cartella e restituisce la lista di file audio e sottocartelle.
/// Filtra i file nascosti (che iniziano con '.') e ordina: cartelle prima, poi file.
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
                    name, title: None, artist: None,
                    path: p.to_string_lossy().to_string(),
                    is_dir: true, cover: None,
                });
            } else if let Some(ext) = p.extension() {
                if metadata::is_audio(&ext.to_string_lossy()) {
                    let meta = metadata::extract_metadata(&p);
                    items.push(FileItemDto {
                        name, title: Some(meta.title), artist: meta.artist,
                        path: p.to_string_lossy().to_string(),
                        is_dir: false, cover: cover.clone(),
                    });
                }
            }
        }
    }
    // Ordinamento: cartelle prima dei file, poi ordine alfabetico
    items.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    items
}

/// Scansione ricorsiva di una cartella e di tutte le sottocartelle.
/// Raccoglie tutti i file audio con i relativi metadati ID3/Vorbis.
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
                            title: meta.title, artist: meta.artist,
                            path: p.to_string_lossy().to_string(),
                            extension: ext_str, cover: dir_cover.clone(),
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

/// Apre il dialog nativo per selezionare una cartella musicale.
/// Su desktop usa tauri-plugin-dialog; su Android naviga dalla cartella Music.
#[tauri::command]
pub fn pick_audio_folder(app: tauri::AppHandle) -> Option<FolderResultDto> {
    #[cfg(not(target_os = "android"))]
    {
        use tauri_plugin_dialog::DialogExt;
        if let Some(folder) = app.dialog().file()
            .set_title("Seleziona cartella musicale")
            .blocking_pick_folder() {
            let path_str = folder.to_string();
            let tracks = scan_folder_recursive(path_str.clone());
            return Some(FolderResultDto { folder_path: path_str, tracks });
        }
        None
    }
    #[cfg(target_os = "android")]
    {
        // Su Android il dialog cartelle non è supportato nativamente.
        // Naviga direttamente dalla cartella Music predefinita del dispositivo.
        let music = get_music_dir(app);
        let tracks = scan_folder_recursive(music.clone());
        Some(FolderResultDto { folder_path: music, tracks })
    }
}
