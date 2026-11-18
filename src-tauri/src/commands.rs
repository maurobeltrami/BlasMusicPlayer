// commands.rs - Comandi IPC Tauri per navigazione filesystem e riproduzione audio
use std::fs;
use std::path::Path;
#[cfg(not(target_os = "android"))]
use tauri::Manager;
use crate::dto::{CommonDirDto, FileItemDto, FolderResultDto, TrackDto};
use crate::metadata;

/// Restituisce la cartella audio predefinita del sistema (Download o Music su Android).
#[tauri::command]
pub fn get_music_dir(_app: tauri::AppHandle) -> String {
    #[cfg(target_os = "android")]
    {
        for dir in ["/storage/emulated/0/Download", "/storage/emulated/0/Music", "/storage/emulated/0"] {
            if Path::new(dir).exists() { return dir.to_string(); }
        }
        return "/storage/emulated/0/Download".to_string();
    }
    #[cfg(not(target_os = "android"))]
    {
        _app.path().audio_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| "/".to_string())
    }
}

/// Restituisce la lista di scorciatoie rapide alle cartelle multimediali del sistema.
#[tauri::command]
pub fn get_common_dirs(_app: tauri::AppHandle) -> Vec<CommonDirDto> {
    let mut list = Vec::new();
    #[cfg(target_os = "android")]
    {
        list.push(CommonDirDto { name: "Download".into(), path: "/storage/emulated/0/Download".into(), icon: "fa-download".into() });
        list.push(CommonDirDto { name: "Musica".into(), path: "/storage/emulated/0/Music".into(), icon: "fa-music".into() });
        list.push(CommonDirDto { name: "Memoria".into(), path: "/storage/emulated/0".into(), icon: "fa-hdd".into() });
        list.push(CommonDirDto { name: "Documenti".into(), path: "/storage/emulated/0/Documents".into(), icon: "fa-folder".into() });
    }
    #[cfg(not(target_os = "android"))]
    {
        let dirs = [
            ("Musica", _app.path().audio_dir(), "fa-music"),
            ("Documenti", _app.path().document_dir(), "fa-folder"),
            ("Download", _app.path().download_dir(), "fa-download"),
            ("Home", _app.path().home_dir(), "fa-home"),
        ];
        for (name, res, icon) in dirs {
            if let Ok(p) = res {
                list.push(CommonDirDto { name: name.into(), path: p.to_string_lossy().into(), icon: icon.into() });
            }
        }
    }
    list
}

/// Restituisce l'URL di streaming HTTP per un file audio locale (supporta Range HTTP 206)
#[tauri::command]
pub fn get_stream_url(path: String) -> String {
    let p = crate::server::get_server_port();
    if p > 0 { format!("http://127.0.0.1:{}/audio?path={}", p, path) } else { path }
}

/// Restituisce l'URL HTTP per una copertina immagine
#[tauri::command]
pub fn get_cover_url(path: String) -> String {
    let p = crate::server::get_server_port();
    if p > 0 { format!("http://127.0.0.1:{}/cover?path={}", p, path) } else { path }
}

/// Scansiona una cartella e restituisce la lista di file audio e sottocartelle.
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
                items.push(FileItemDto { name, title: None, artist: None, album: None, path: p.to_string_lossy().to_string(), is_dir: true, cover: None });
            } else if let Some(ext) = p.extension() {
                if metadata::is_audio(&ext.to_string_lossy()) {
                    let meta = metadata::extract_metadata(&p);
                    let c = if meta.has_cover { Some(p.to_string_lossy().to_string()) } else { cover.clone() };
                    items.push(FileItemDto { name, title: Some(meta.title), artist: meta.artist, album: meta.album, path: p.to_string_lossy().to_string(), is_dir: false, cover: c });
                }
            }
        }
    }
    items.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    items
}

/// Scansione ricorsiva di una cartella e di tutte le relative sottocartelle.
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
                        let c = if meta.has_cover { Some(p.to_string_lossy().to_string()) } else { dir_cover.clone() };
                        tracks.push(TrackDto { title: meta.title, artist: meta.artist, album: meta.album, path: p.to_string_lossy().to_string(), extension: ext_str, cover: c });
                    }
                }
            }
        }
    }
    visit(Path::new(&dir_path), &mut tracks);
    tracks.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    tracks
}

/// Seleziona una cartella tramite dialogo nativo asincrono o cartella predefinita su Android.
#[tauri::command]
pub async fn pick_audio_folder(app: tauri::AppHandle) -> Option<FolderResultDto> {
    #[cfg(not(target_os = "android"))]
    {
        use tauri_plugin_dialog::DialogExt;
        let (tx, rx) = tokio::sync::oneshot::channel();
        app.dialog().file().set_title("Seleziona cartella musicale").pick_folder(move |folder| {
            let _ = tx.send(folder);
        });
        if let Ok(Some(file_path)) = rx.await {
            let path_str = match file_path {
                tauri_plugin_dialog::FilePath::Path(p) => p.to_string_lossy().to_string(),
                tauri_plugin_dialog::FilePath::Url(u) => u.to_file_path().unwrap_or_default().to_string_lossy().to_string(),
            };
            return Some(FolderResultDto { folder_path: path_str, tracks: Vec::new() });
        }
        None
    }
    #[cfg(target_os = "android")]
    {
        let music = get_music_dir(app);
        let tracks = scan_folder_recursive(music.clone());
        Some(FolderResultDto { folder_path: music, tracks })
    }
}
