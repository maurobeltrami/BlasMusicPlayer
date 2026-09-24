mod commands;
mod dto;
mod metadata;
mod server;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    server::start_audio_server();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_music_dir,
            commands::get_common_dirs,
            commands::get_stream_url,
            commands::get_cover_url,
            commands::scan_directory,
            commands::scan_folder_recursive,
            commands::pick_audio_folder,
            state::load_app_state,
            state::save_app_state,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
