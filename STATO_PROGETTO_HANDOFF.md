# 📋 Documento di Handoff & Stato del Progetto — BlasMusicPlayer

> **Data:** 25 Settembre 2026 (Sessione 6)
> **Repository:** https://github.com/maurobeltrami/BlasMusicPlayer.git
> **Versione Attuale:** `1.0.1`
> **Ultimo Aggiornamento:** Fix contrasto tema punk, architettura temi dinamica, release desktop & mobile
> **Bundle Desktop Pronto:** `./BlasMusicPlayer.dmg` (5.0 MB) e `./BlasMusicPlayer.app` (compilati in release e firmati)
> **Pacchetto Android Pronto:** `./BlasMusicPlayer-release.apk` (15 MB, v1.0.1 firmato con `blas-release.keystore`)
> **Guide Disponibili:** `docs/manuali/guida_aggiornamento_android.md` e `docs/manuali/guida_creazione_temi.md`

---

## 🎯 Panoramica del Progetto
**BlasMusicPlayer** è un riproduttore musicale offline, Local-First, ad alte prestazioni per piattaforme **Desktop (macOS, Windows, Linux)** e **Mobile (Android)**, basato su:
- **Tauri 2.0** (Rust backend)
- **Frontend Web Nativo** (HTML5, Tailwind CSS, Vanilla ES6 JavaScript modulare, Web Audio API, Canvas per visualizzatore a 60 FPS)
- **Componenti Android Nativi Kotlin** per il supporto al background continuo.

Tutto il codice rispetta rigorosamente le regole architetturali definite in `AGENTS.md`.

---

## 📐 Vincoli e Regole di Sviluppo (AGENTS.md)
Tutti i futuri interventi di codice devono obbligatoriamente rispettare queste regole:
1. **Regola delle <= 150 Righe:** Nessun file sorgente proprietario (`.rs`, `.js`, `.css`, `.kt`, `.cpp`, `.h`) può superare le **150 righe di codice** (esclusi solo file generati da tool, `.json`, `.html`, asset).
2. **Commenti in Italiano:** Tutti i commenti nel codice devono essere scritti esclusivamente in lingua italiana.
3. **Approccio Zero-Terminal:** L'applicazione deve funzionare in autonomia per l'utente finale.
4. **Local-First & Privacy:** Nessuna chiamata a server remoti; tutto l'audio, i metadati e le playlist sono archiviati localmente sul dispositivo.

---

## 🏗️ Architettura Attuale del Sistema

### 1. Backend Rust (`src-tauri/src/`)
- `lib.rs`: Inizializzazione Tauri 2.0, registrazione comandi IPC e plugin (`tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-log`), avvio server streaming locale.
- `server.rs` (131 righe): Server HTTP locale multithread su porta casuale (`127.0.0.1:<PORT>`). Gestisce:
  - Streaming audio con supporto Range HTTP 206 (`/audio?path=...`).
  - Estrazione al volo e streaming delle **copertine ID3/APIC incorporate nei file MP3/FLAC** o fallback su immagini di cartella (`/cover?path=...`).
- `metadata.rs` (82 righe): Lettura tag ID3/Vorbis (titolo, artista, presenza di copertina incorporata con `audiotags`).
- `commands.rs` (147 righe): Scansione cartelle (`scan_directory`, `scan_folder_recursive`), navigazione cartelle comuni con aggiunta Documenti (`get_common_dirs`), selezione cartelle asincrona tramite `tauri-plugin-dialog` (`pick_audio_folder`).
- `Info.plist`: Dichiarazione permessi macOS TCC per accesso sicuro a Documenti, Download, Musica e volumi esterni.
- `state.rs` (42 righe): Persistenza atomica dello stato applicativo (`app_state.json`) tramite percorsi nativi Tauri (su desktop `~/.config/BlasMusicPlayer`, su Android cartella interna sandboxed).
- `dto.rs` (38 righe): Strutture dati scambiate tra Rust e frontend.

### 2. Sottosistema Android Nativo (`src-tauri/gen/android/app/src/main/`)
- `AudioService.kt` (88 righe): Servizio Foreground Android con `ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` e notifica persistente in `NotificationChannel` dedicato. Impedisce che la CPU vada in deep sleep (Doze Mode) o che il sistema chiuda il processo quando lo schermo si spegne.
- `MainActivity.kt` (79 righe):
  - Avvio automatico di `AudioService` in `onCreate()`.
  - Override di `onPause()` e `onStop()` con `webViewRef?.onResume()` per mantenere attivo il motore JavaScript e gli eventi audio anche a telefono bloccato.
  - Richiesta permessi a runtime (`READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `POST_NOTIFICATIONS`).
  - Acquisizione preventiva di `PowerManager.PARTIAL_WAKE_LOCK`.
- `AndroidManifest.xml`: Configurato con `usesCleartextTraffic="true"`, registrazione di `AudioService` come servizio foreground di tipo `mediaPlayback`.

### 3. Frontend Web (`src/`)
- `index.html`: Struttura SPA a 3 schermate (`view-home`, `view-playlists`, `view-equalizer`) + Player Sticky in basso (`bottom-player`).
  - Header sticky con safe area padding per notch e status bar.
  - Accordion a scomparsa per la libreria cartelle (`libraryContent`).
  - Visualizzatore Canvas centrale (`visualizer`) con supporto copertina, oscilloscopio e barre.
- `src/css/style.css` (40 righe): Box-sizing globale, prevenzione overflow orizzontale, utility `.pt-safe` e `.pb-safe`, stile per range verticali.
- `src/js/app.js` (131 righe): Entry point principale, router, drag & drop, gestione eventi di risveglio AudioContext e loop visualizzatore 60 FPS.
- `src/js/core/`:
  - `mediaLoader.js` (113 righe): Risoluzione URL streaming e copertina, aggiornamento `MediaMetadata`, risveglio preventivo AudioContext in autoPlay.
  - `audioEngine.js` (140 righe): DSP Web Audio API (filtri EQ 3 bande, compressore dinamico, gain master, analizzatore FFT), `ensureAudioRunning()` e listener di risveglio standby (`setupWakeupListeners`).
  - `stateManager.js` (117 righe): Sincronizzazione stato tra LocalStorage e persistenza nativa JSON.
- `src/js/data/playlist.js` (77 righe): Gestione coda di riproduzione attiva, cronologia e shuffle.
- `src/js/events/`:
  - `navigation.js` (145 righe): Navigazione del filesystem e accodamento tracce.
  - `playlistsManager.js` (125 righe): Gestione caricamento ed eliminazione playlist salvate, avvio modifica nel compositore.
  - `playlistComposer.js` (143 righe): Compositore unificato per creazione e modifica in-place delle playlist con riordino ▲▼, rinomina, rimozione brani e pulsante annulla.
  - `playlistFolderBrowser.js` (131 righe): Browser cartelle per selezione tracce da aggiungere alle playlist.
  - `playlistModal.js` (110 righe): Modale per aggiungere e rimuovere brani dalle playlist tramite spunte/checkbox.
  - `playback.js` (111 righe): Controlli play/pause con risveglio asincrono AudioContext, gestione errori, comandi multimediali e scorciatoia `Space`.
  - `audio.js` (72 righe): Avanzamento continuo traccia (`onended`), barra di avanzamento e recupero audio su `onplaying`.
  - `equalizer.js` (67 righe): Slider equalizzatore e compressore.

---

### 🚀 Funzionalità Risolte e Verificate
1. **Layout 100% Responsive e Fullscreen Lock** ✅
2. **Libreria Comprimibile ad Accordion** ✅
3. **Riproduzione Continua in Background & Standby (AudioService.kt)** ✅
4. **Correzione Avanzamento Coda** ✅
5. **Equalizzatore Verticale Perfetto** ✅
6. **Copertine Incorporate nei file MP3/FLAC** ✅
7. **CRUD Completo delle Playlist** ✅
8. **Icone App Aggiornate** ✅
9. **Resilienza Standby & AudioContext Wakeup** ✅
   - Risolto il blocco in cui la traccia avanzava ma l'audio restava muto dopo lo sblocco del computer.
   - Gestiti gli stati WebKit/CoreAudio `'suspended'` e `'interrupted'` tramite `ensureAudioRunning()`.
   - Aggiunti listener preventivi su `visibilitychange`, `focus`, `pointerdown` e `keydown`.
   - Aggiunta scorciatoia da tastiera `Space` per Play/Pause globale su desktop.
10. **Risoluzione Accesso Cartelle macOS & Permessi TCC** ✅
   - Sostituito `rfd` con `tauri_plugin_dialog::DialogExt` asincrono su canale oneshot.
   - Aggiunta la directory "Documenti" (`document_dir()`) nelle scorciatoie desktop.
   - Creato `src-tauri/Info.plist` con permessi TCC macOS (`NSDocumentsFolderUsageDescription`, ecc.).
   - Risolto il blocco dell'avvio con firma bundle `codesign --force --deep -s -`.
11. **Risoluzione SyntaxError `audioEngine.js`** ✅
   - Rimossa la parentesi graffa superflua che chiudeva anticipatamente `initAudio` mandando in crash l'import di `app.js`.
12. **Compositore Playlist Unificato** ✅
   - La modifica riapre la playlist direttamente nel riquadro di composizione/creazione a destra (con riordino ▲▼, rinomina e rimozione ✕), eliminando il vecchio modulo separato.
13. **Modale Rapida Aggiunta Playlist da Coda (Home)** ✅
   - Tasto `+` sui brani della coda attiva con modale a caselle di spunta (checkbox) per associare o rimuovere il brano dalle playlist in un click.
14. **Compilazione & Packaging APK Android Sincronizzato** ✅
   - Compilato con successo l'APK universale contenente tutte le novità del compositore e della modale.
15. **Risoluzione Layout Responsive Mobile Playlist & Bump Release v1.0.1** ✅
   - Risolto il difetto visivo su schermi mobile: la lista delle playlist salvate ora sfrutta una riga intera per il titolo e una riga per i bottoni, garantendo la lettura completa del titolo e touch ergonomico.
   - Incrementata la versione di progetto a `1.0.1` (`package.json`, `tauri.conf.json`, `Cargo.toml`, `tauri.properties`).
   - Compilato, verificato e rilasciato l'APK release v1.0.1 (`./BlasMusicPlayer-release.apk`, 15 MB).
16. **Risoluzione Contrasto Tema Punk & Architettura Temi Modulare** ✅
   - Risolti i difetti di leggibilità su mobile e desktop: navbar, titolo BLASMUSIC, tab libreria, display tempo, equalizzatore e modali ora hanno contrasto WCAG AA garantito.
   - Creata architettura a 2 livelli (Canvas vs Card) con variabili semantiche e scoping automatico.
   - Sostituito l'anti-pattern `body:not([data-theme="punk"])` con registro centralizzato `AVAILABLE_THEMES` in `themeManager.js`.
   - Creata la guida passo-passo `docs/manuali/guida_creazione_temi.md`.
17. **Tasti Riproduzione ad Alto Contrasto, Sfondo Punk Cromatico & Invio Telegram** ✅
   - Risolta la visibilità dei tasti multimediali (#shuffleBtn, #prevBtn, #nextBtn, #muteToggleBtn): icone ora in nero solido `#000000` con contrasto netto sulla card stencil bianca, e tasto Play/Pause con bordo marcato e drop shadow verde acido.
   - Sfondo punk arricchito cromaticamente: violetto scuro profondo (`#160026`) stratificato con tre gradienti radiali acid spray (Acid Pink, Acid Cyan, Toxic Green) e texture organica di asfalto scuro.
   - Sincronizzate e ricompilate tutte le build: Desktop macOS (`BlasMusicPlayer.dmg` 5.0 MB, `BlasMusicPlayer.app` firmata ad-hoc) e Mobile Android (`BlasMusicPlayer-release.apk` 15 MB).
   - Inviata con successo l'APK release al DevBot Telegram di Mauro (`@Maurobeltramidevbot`, ID messaggio 71).
18. **Stile Skate-Punk, Bordi Logori/Strappati, Dettagli Verde Acido & Pagina Playlist** ✅
   - Risolta l'illeggibilità dei testi nella pagina Playlist: creato il modulo dedicato `src/css/themes/punk-playlists.css` (133 righe). Brani del navigatore cartelle, directory, testi e comandi della bozza ora hanno contrasto massimo (bianco su viola scuro / hover verde acido).
   - Card delle playlist salvate con badge "X brani" verde acido adesivo (`#CCFF00`, testo nero bold), pulsante "+ Coda" nero con testo verde acido ben visibile, e bottoni Play/Modifica/Elimina ad alta visibilità.
   - Aggiunta estetica Skate-Punk con bordi logori e strappati a fanzine (clip-path irregolare su `.torn-paper`), nastro adesivo da skate (duct tape) fluorescente agli angoli dei box, e accenti verde acido diffusi (progress bar con sfumatura neon, visualizer container, slider e pulsanti).
   - Sincronizzate e ricompilate entrambe le piattaforme: Desktop macOS (`BlasMusicPlayer.app` e `BlasMusicPlayer.dmg` 5.0 MB) e Mobile Android (`BlasMusicPlayer-release.apk` 15 MB).
   - Inviato l'APK aggiornato al DevBot Telegram (`@Maurobeltramidevbot`, ID messaggio 72).
   - Rispetto ferreo della regola $\le 150$ righe per tutti i file sorgente proprietari.

---

## 🎯 Prossimi Passi Consigliati
1. **Collaudo su Dispositivo Mobile Reale:** Scaricare l'APK dal bot Telegram `@Maurobeltramidevbot`, installarlo sul telefono e verificare i nuovi contrasti della schermata Playlist e i dettagli skate-punk.
2. **Eventuali Ulteriori Temi:** Utilizzare la guida `docs/manuali/guida_creazione_temi.md` per aggiungere rapidamente altri stili visivi.

---

## 🛠️ Comandi Utili per l'Ambiente di Lavoro

### Variabili d'ambiente per Android (macOS Apple Silicon):
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.3.11579264"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

### Compilazione APK Android:
```bash
npx tauri android build --apk --debug --target aarch64
# L'APK compilato si trova in:
# src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
# Per comodità copiarlo nella root del progetto:
cp src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk ./app-universal-debug.apk
```

### Avvio Desktop:
```bash
npm run tauri dev
```

### Verifica Rigorosa Limite 150 Righe:
```bash
wc -l src-tauri/src/*.rs src/css/*.css src/js/**/*.js src-tauri/gen/android/app/src/main/java/org/blasopen/musicplayer/*.kt
```

---

## 💬 Prompt Suggerito per Iniziare la Nuova Chat

Puoi copiare e incollare il seguente testo all'avvio della nuova chat:

```text
Ciao! Continuiamo lo sviluppo di BlasMusicPlayer a partire dal documento STATO_PROGETTO_HANDOFF.md presente nella root del progetto (/Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer).
Il branch di lavoro attivo è feature/responsive-android.
Ricordati i vincoli di AGENTS.md (massimo 150 righe per file di codice e commenti rigorosamente in italiano).
Oggi possiamo procedere con la compilazione e test del nuovo APK Android seguendo docs/manuali/guida_aggiornamento_android.md!
```
