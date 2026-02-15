#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn health_check() -> String {
  "ok".to_string()
}

#[tauri::command]
fn desktop_capabilities() -> Vec<&'static str> {
  vec![
    "filesystem",
    "notifications",
    "clipboard",
    "deep-linking",
    "autoupdate",
    "window-controls",
  ]
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![health_check, desktop_capabilities])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

