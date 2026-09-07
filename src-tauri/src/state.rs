use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppStateDto {
    pub last_folder: Option<String>,
    pub saved_playlists: Vec<serde_json::Value>,
    pub current_queue: Vec<serde_json::Value>,
    pub current_track_index: Option<usize>,
}

fn get_state_file() -> Option<PathBuf> {
    let base = dirs::config_dir().or_else(dirs::home_dir)?;
    let dir = base.join("BlasMusicPlayer");
    let _ = fs::create_dir_all(&dir);
    Some(dir.join("app_state.json"))
}

#[tauri::command]
pub fn load_app_state() -> Option<AppStateDto> {
    let path = get_state_file()?;
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

#[tauri::command]
pub fn save_app_state(state: AppStateDto) -> bool {
    if let Some(path) = get_state_file() {
        if let Ok(content) = serde_json::to_string_pretty(&state) {
            return fs::write(path, content).is_ok();
        }
    }
    false
}
