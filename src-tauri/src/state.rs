// state.rs - Persistenza stato applicativo Local-First (cross-platform desktop/mobile)
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// DTO dello stato applicativo persistente
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppStateDto {
    pub last_folder: Option<String>,
    pub saved_playlists: Vec<serde_json::Value>,
    pub current_queue: Vec<serde_json::Value>,
    pub current_track_index: Option<usize>,
}

/// Calcola il percorso del file di stato usando il resolver nativo di Tauri.
/// Su desktop punta a ~/.config/BlasMusicPlayer/app_state.json
/// Su Android punta alla cartella interna sandboxed dell'app.
fn get_state_file(app: &tauri::AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    let _ = fs::create_dir_all(&dir);
    Some(dir.join("app_state.json"))
}

/// Carica lo stato applicativo salvato dal disco locale.
#[tauri::command]
pub fn load_app_state(app: tauri::AppHandle) -> Option<AppStateDto> {
    let path = get_state_file(&app)?;
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

/// Salva lo stato applicativo corrente su disco locale in formato JSON.
#[tauri::command]
pub fn save_app_state(app: tauri::AppHandle, state: AppStateDto) -> bool {
    if let Some(path) = get_state_file(&app) {
        if let Ok(content) = serde_json::to_string_pretty(&state) {
            return fs::write(path, content).is_ok();
        }
    }
    false
}
