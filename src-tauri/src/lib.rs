use tauri::webview::NewWindowResponse;
use tauri::{WebviewUrl, WebviewWindowBuilder};

// The default OIDC clients of openEO back-ends allow http://localhost:1410/ as redirect URL,
// so the app is served from there instead of the tauri:// origin.
const PORT: u16 = 1410;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init());

    // In development the dev server already runs on the port
    if !tauri::is_dev() {
        builder = builder.plugin(tauri_plugin_localhost::Builder::new(PORT).build());
    }

    builder
        .setup(|app| {
            let url = if tauri::is_dev() {
                WebviewUrl::App("index.html".into())
            } else {
                WebviewUrl::External(format!("http://localhost:{PORT}").parse().unwrap())
            };
            WebviewWindowBuilder::new(app, "main", url)
                .title("openEO Web Editor")
                .inner_size(1440.0, 900.0)
                .min_inner_size(800.0, 500.0)
                // Let the web app handle dropped files and folders itself
                .disable_drag_drop_handler()
                // The OIDC login popup must keep window.opener to hand the tokens back to the app
                .on_new_window(|_url, _features| NewWindowResponse::Allow)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the openEO Web Editor");
}
