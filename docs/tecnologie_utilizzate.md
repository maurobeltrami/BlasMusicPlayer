# 🛠️ Tecnologie Utilizzate in BlasMusicPlayer

Questo documento censisce, illustra e spiega tutte le tecnologie, librerie, framework e linguaggi impiegati nel progetto **BlasMusicPlayer**, nel pieno rispetto delle regole didattiche della Costituzione di BlasOpen.

---

## 1. Architettura Desktop Attuale (Tauri 2.0 + Rust + Web Audio)

Il nucleo di **BlasMusicPlayer v1.0** adotta un'architettura ibrida ad altissime prestazioni:

### 🦀 Backend Nativo: Rust & Tauri 2.0
* **Tauri 2.0:** Framework desktop leggero che utilizza il motore WebKit nativo del sistema operativo (WKWebView su macOS) senza impacchettare Chromium. Garantisce consumi di RAM minimi (30-50 MB) ed eseguibili nativi compatti.
* **Rust 2021 Edition:** Gestione deterministica e sicura della memoria, scansione multithread del filesystem ad altissima velocità e comunicazione IPC tipizzata.
* **Lofty Crate:** Libreria Rust ad alte prestazioni per il parsing binario a basso livello dei metadati audio (ID3v1, ID3v2, Vorbis Comments, FLAC metadata, cover art APIC).
* **Base64 Crate:** Serializzazione delle copertine binarie in URI Base64 sicuri confinati in memoria RAM.
* **Tauri Plugin Dialog:** Interazione nativa con i selettori di cartelle e file del sistema operativo.

### 🌐 Frontend Modulare: HTML5, CSS3, Vanilla JS & Web Audio API
* **Web Audio API:**
  * `AudioContext` & `MediaElementAudioSourceNode` per il routing del segnale audio senza latenza percepibile.
  * `BiquadFilterNode` per l'equalizzatore a 3 bande (Bassi, Medi, Alti) ed elaborazione del suono in tempo reale.
  * `DynamicsCompressorNode` per la prevenzione di clipping e saturazione acustica.
  * `AnalyserNode` con FFT a 128 bande per il campionamento dello spettro di frequenza e delle forme d'onda.
  * **Ciclo di Vita & Standby Recovery (`ensureAudioRunning`):** Gestione resiliente degli stati `'suspended'` e `'interrupted'` con riattivazione istantanea del grafo audio allo sblocco del sistema operativo o cambio periferica.
* **HTML5 Canvas a 60 FPS:** Rendering hardware accelerato dei visualizzatori (spettro a barre, oscilloscopio, anelli reattivi, disco in vinile rotante).
* **CSS Moderno & Design System Modulare:**
  * **Tema Modern Dark:** Ispirato a Spotify con tonalità `#121212` e accenti verdi `#1DB954`.
  * **Tema Punk:** Ispirato all'estetica acid/punk con pattern leopardato (`.leopard-bg`) incorporato e accenti al neon `#CCFF00` e `#FF00FF`.
* **Local-First Data Persistence & CRUD Playlist:**
  * Utilizzo di `window.localStorage` combinato alla persistenza su file atomico JSON (`state.rs`).
  * Compositore unificato `playlistComposer.js` con algoritmo di riordino swap $O(1)$, rinomina e deduplicazione.
  * Modale rapida `playlistModal.js` per aggiungere/rimuovere al volo brani della coda alle playlist con spunte istantanee.

### 📱 Sottosistema Mobile Android Nativo (Kotlin + Foreground Service)
* **AudioService.kt:** Servizio Foreground Android con `ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` e notifica persistente in `NotificationChannel` dedicato. Impedisce il deep sleep (Doze Mode) della CPU a schermo spento.
* **Wakelock & Webview Retention:** Acquisizione preventiva di `PowerManager.PARTIAL_WAKE_LOCK` e mantenimento attivo del motore WebKit tramite `webViewRef?.onResume()` in `MainActivity.kt`.
* **Asset Mipmap Adaptive:** Generazione automatica di icone multi-risoluzione (`mipmap-mdpi` fino a `xxxhdpi`) per supporto nativo ad Android 8.0+.

---

## 2. Architettura Storica C++17 & Raylib 6.0 (`legacy_cpp/`)

Durante la fase iniziale del progetto è stato sviluppato un prototipo interamente in **C++17** e **Raylib 6.0**, conservato a scopo didattico nella directory `legacy_cpp/`:

* **Linguaggio C++17:** Gestione della memoria RAII, puntatori intelligenti e filesystem standard (`std::filesystem`).
* **Raylib 6.0 & miniaudio:** Rendering grafico a pixel diretti basato su OpenGL e decodifica audio interna a basso livello per MP3, WAV, FLAC e OGG.
* **Compilazione Nativa:** Gestita tramite `Makefile` e compilatore `clang++` con collegamento ai framework Cocoa, OpenGL e IOKit.
