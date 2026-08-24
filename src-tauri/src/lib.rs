mod sounds;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            storage::read_store,
            storage::write_store,
            storage::delete_store,
            storage::store_location,
            sounds::list_custom_sounds,
            sounds::import_custom_sound,
            sounds::delete_custom_sound,
            sounds::read_custom_sound,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
