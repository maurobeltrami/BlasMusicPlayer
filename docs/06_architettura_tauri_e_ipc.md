# 06. Architettura Moderna Desktop: Tauri 2.0, Web Audio API e IPC

Questo documento illustra l'architettura tecnica e didattica di **BlasMusicPlayer** basata su **Tauri 2.0**, spiegando come unire l'estetica avanzata del web moderno (Tailwind CSS, Flexbox, Canvas 60 FPS) con le prestazioni, la sicurezza e l'indipendenza di un'applicazione nativa compilata.

---

## 1. Perché Tauri 2.0 e il Superamento dei Limiti di Raylib

Nello sviluppo desktop di lettori multimediali moderni, esistono due grandi famiglie di tecnologie:
1. **Motori a Disegno Diretto (Game Engines come Raylib):**
   * Richiedono il calcolo manuale dei pixel $(x, y, w, h)$.
   * Mancano di astrazioni per layout responsive fluidi, font kerning avanzato e gerarchie di stili complessi come Tailwind.
2. **Framework Ibridi Basati su Webview Nativa (Tauri 2.0):**
   * **Nessun runtime Chromium incorporato (a differenza di Electron):** Tauri sfrutta il motore WebKit già presente nel sistema operativo (WebKit su macOS/Linux, WebView2 su Windows).
   * **Consumi Minimi:** L'eseguibile compilato occupa pochissimi megabyte e consuma una frazione minima di memoria RAM (~30-40 MB).
   * **Grafica Tailwind Completa:** Permette di utilizzare al 100% l'ecosistema CSS moderno, transizioni fluide a 60 FPS, ombre morbide, icone vettoriali e animazioni.

---

## 2. Architettura Multi-Processo e Canale IPC (Inter-Process Communication)

L'applicazione si struttura su due livelli isolati e sicuri:

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (WebKit / WKWebView)                │
│   HTML5 + Tailwind CSS + Web Audio API + Canvas 60 FPS      │
└──────────────────────────────┬──────────────────────────────┘
                               │
            Canale IPC (Inter-Process Communication)
            Comandi nativi deserializzati via Serde JSON
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    BACKEND (Rust Compilato)                 │
│      Scansione Filesystem ricorsiva + Dialoghi Nativi OS    │
└─────────────────────────────────────────────────────────────┘
```

### Come Funzionano i Comandi Nativi Rust
Nel frontend JavaScript, quando l'utente clicca su "Sfoglia", viene invocata la funzione asincrona:
```javascript
const items = await window.__TAURI__.core.invoke('scan_directory', { dirPath: path });
```
Il backend Rust riceve la richiesta nel thread nativo:
```rust
#[tauri::command]
pub fn scan_directory(dir_path: String) -> Vec<FileItemDto> { ... }
```
La scansione avviene in microsecondi senza bloccare l'interfaccia grafica.

---

## 3. Web Audio API e Riproduzione Locale con Protocollo Asset

Per riprodurre file audio locali (`.mp3`, `.wav`, `.flac`, `.ogg`) senza dover avviare un server HTTP o esporre porte di rete, Tauri fornisce il protocollo sicuro `asset://`:
* La funzione `convertFileSrc(path)` traduce un percorso assoluto locale (es. `/Users/.../brano.flac`) in un URI interno sicuro per l'elemento `<audio>`.
* Il flusso audio viene poi collegato alla **Web Audio API**:
  1. `AudioContext.createMediaElementSource(audioElement)`
  2. `BiquadFilterNode` (Bassi, Medi, Alti ed Equalizzatore a 3 bande)
  3. `DynamicsCompressorNode` (Compressione dinamica per evitare distorsioni)
  4. `AnalyserNode` (Campionamento dello spettro di frequenze per il canvas del visualizzatore a 60 FPS)

---

## 4. Regola Costituzionale "Zero-Terminal"
Con il comando `tauri build`, il compilatore genera un vero pacchetto autonomo:
* Su macOS: file `.dmg` e bundle `.app`.
* Su Windows: installer `.msi` ed eseguibile `.exe`.
* Su Linux: pacchetto `.deb` e binario `.AppImage`.

L'utente finale installa e avvia il programma con un doppio click, senza mai vedere una riga di comando.
