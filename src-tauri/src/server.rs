// server.rs - Server HTTP locale per streaming audio e copertine ID3/APIC
use std::fs::File;
use std::io::{Cursor, Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::atomic::{AtomicU16, Ordering};
use std::thread;
use tiny_http::{Header, Response, Server, StatusCode};

static SERVER_PORT: AtomicU16 = AtomicU16::new(0);

pub fn start_audio_server() {
    let Ok(server) = Server::http("127.0.0.1:0") else { return; };
    SERVER_PORT.store(server.server_addr().to_ip().map(|a| a.port()).unwrap_or(0), Ordering::SeqCst);
    thread::spawn(move || for r in server.incoming_requests() { thread::spawn(move || handle_request(r)); });
}

pub fn get_server_port() -> u16 {
    SERVER_PORT.load(Ordering::SeqCst)
}

fn percent_decode(s: &str) -> String {
    let mut bytes = Vec::new();
    let mut it = s.bytes();
    while let Some(b) = it.next() {
        if b == b'%' {
            if let (Some(h1), Some(h2)) = (it.next(), it.next()) {
                if let Ok(v) = u8::from_str_radix(&format!("{}{}", h1 as char, h2 as char), 16) {
                    bytes.push(v); continue;
                }
            }
        }
        bytes.push(if b == b'+' { b' ' } else { b });
    }
    String::from_utf8_lossy(&bytes).into_owned()
}

fn serve_cover(request: tiny_http::Request, path_str: &str) {
    let path = Path::new(path_str);
    if let Ok(tag) = audiotags::Tag::new().read_from_path(path) {
        if let Some(pic) = tag.album_cover() {
            let mime = if pic.mime_type == audiotags::MimeType::Png { "image/png" } else { "image/jpeg" };
            let data = pic.data.to_vec();
            let _ = request.respond(Response::new(
                StatusCode(200),
                vec![Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap(),
                     Header::from_bytes(&b"Content-Length"[..], data.len().to_string().as_bytes()).unwrap(),
                     Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap()],
                Cursor::new(data.clone()), Some(data.len()), None,
            ));
            return;
        }
    }
    let img_path = if path.is_file() && !crate::metadata::is_audio(&path.extension().and_then(|e| e.to_str()).unwrap_or("")) {
        Some(path.to_path_buf())
    } else {
        path.parent().and_then(crate::metadata::find_cover_art).map(std::path::PathBuf::from)
    };

    if let Some(ip) = img_path {
        if let Ok(file) = File::open(&ip) {
            let mime = if ip.extension().and_then(|e| e.to_str()).unwrap_or("").eq_ignore_ascii_case("png") { "image/png" } else { "image/jpeg" };
            let len = file.metadata().map(|m| m.len()).unwrap_or(0);
            let _ = request.respond(Response::new(
                StatusCode(200),
                vec![Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap(),
                     Header::from_bytes(&b"Content-Length"[..], len.to_string().as_bytes()).unwrap(),
                     Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap()],
                file, Some(len as usize), None,
            ));
            return;
        }
    }
    let _ = request.respond(Response::empty(404));
}

fn handle_request(request: tiny_http::Request) {
    let url = request.url().to_string();
    if url.starts_with("/cover?path=") {
        serve_cover(request, &percent_decode(&url["/cover?path=".len()..]));
        return;
    }
    if !url.starts_with("/audio?path=") {
        let _ = request.respond(Response::empty(404));
        return;
    }

    let file_path = percent_decode(&url["/audio?path=".len()..]);
    let path = Path::new(&file_path);
    let Ok(mut file) = File::open(path) else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let file_len = file.metadata().map(|m| m.len()).unwrap_or(0);
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let mime = match ext.as_str() {
        "wav" => "audio/wav", "ogg" => "audio/ogg", "flac" => "audio/flac",
        "m4a" | "aac" => "audio/mp4", _ => "audio/mpeg",
    };

    if let Some(hdr) = request.headers().iter().find(|h| h.field.equiv("Range")) {
        if let Some(r) = hdr.value.as_str().strip_prefix("bytes=") {
            let mut parts = r.split('-');
            let start: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
            let end: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(file_len.saturating_sub(1)).min(file_len.saturating_sub(1));
            let len = if end >= start { end - start + 1 } else { 0 };
            let _ = file.seek(SeekFrom::Start(start));
            let _ = request.respond(Response::new(
                StatusCode(206),
                vec![
                    Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap(),
                    Header::from_bytes(&b"Content-Range"[..], format!("bytes {}-{}/{}", start, end, file_len).as_bytes()).unwrap(),
                    Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]).unwrap(),
                    Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                ],
                file.take(len), Some(len as usize), None,
            ));
            return;
        }
    }

    let _ = request.respond(Response::new(
        StatusCode(200),
        vec![
            Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap(),
            Header::from_bytes(&b"Content-Length"[..], file_len.to_string().as_bytes()).unwrap(),
            Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
        ],
        file, Some(file_len as usize), None,
    ));
}
