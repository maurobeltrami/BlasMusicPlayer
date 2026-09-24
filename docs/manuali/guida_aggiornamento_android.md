# 📱 Guida all'Aggiornamento e Compilazione Android — BlasMusicPlayer

> **Destinatari:** Sviluppatori e utenti avanzati dell'ecosistema **[BlasOpen](../../../COSTITUZIONE.md)**.  
> **Obiettivo:** Compilare, installare ed aggiornare l'applicazione Android con tutte le ultime funzionalità native, la nuova icona punk e il flusso unificato delle playlist.

---

## 🌟 1. Novità Integrate nell'Aggiornamento Android

Questa versione porta su Android tutte le migliorie introdotte di recente nell'architettura di BlasMusicPlayer:

1. **Compositore Playlist Unificato:** La modifica delle playlist ora avviene direttamente nella colonna di composizione (con riordino tracce ▲▼, rimozione ✕ e aggiunta diretta dal browser cartelle).
2. **Modale Rapida di Aggiunta Brano dalla Coda (Home):** Toccando il pulsante `+` accanto a qualsiasi brano nella coda di riproduzione attiva, appare una modale con caselle di spunta (checkbox) per associare o rimuovere istantaneamente la canzone da qualsiasi playlist.
3. **Riproduzione Continua in Background (`AudioService.kt`):** Foreground Service nativo Android con `mediaPlayback` e notifica persistente che impedisce al sistema operativo di arrestare il processo o mandare in deep sleep (Doze mode) la CPU a schermo spento.
4. **Resilienza Standby e Riattivazione Schermo:** Listener Web Audio API per risveglio istantaneo dell'AudioContext quando l'utente sblocca lo smartphone.
5. **Nuova Icona Punk Stencil Adaptive:** Monogramma musicale verde acido su sfondo nero, integrato nelle risorse `mipmap-anydpi-v26` con `ic_launcher_foreground.xml` e `ic_launcher_background.xml`.

---

## 🛠️ 2. Prerequisiti di Sistema (macOS Apple Silicon / Linux)

Per compilare l'APK Android da sorgente sono necessari:
* **Java Development Kit:** OpenJDK 17 (consigliato `openjdk@17` da Homebrew).
* **Android SDK:** Command-line Tools e Platform Tools aggiornati.
* **Android NDK:** Versione consigliata `26.3.11579264` (o superiore compatibile con Tauri 2.0).
* **Target Rust:** `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android`

### Configurazione Variabili d'Ambiente (da inserire nel terminale o in `~/.zshrc`):
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.3.11579264"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

---

## 🏗️ 3. Compilazione Passo-Passo dell'APK

Dalla cartella principale del progetto (`projects/BlasMusicPlayer`):

### 1. Compilazione dell'APK Debug (Architettura ARM64 per moderni smartphone):
```bash
npx tauri android build --apk --debug --target aarch64
```

### 2. (In alternativa) Compilazione APK Universale:
Se desideri generare un APK universale compatibile con qualsiasi architettura CPU:
```bash
npx tauri android build --apk --debug
```

### 3. Posizione dell'APK Compilato:
L'eseguibile compilato si troverà nel percorso:
```text
src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```
*(Oppure in `.../apk/arm64-v8a/debug/app-arm64-v8a-debug.apk` se compilato con `--target aarch64`).*

Per comodità e per distribuirlo, copialo nella root del progetto:
```bash
cp src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk ./app-universal-debug.apk
```

---

## 📲 4. Installazione sullo Smartphone (Zero-Terminal per l'Utente)

In armonia con la **Regola Zero-Terminal** della Costituzione di BlasOpen:

### Metodo A — Diretto per Utente Finale (Consigliato):
1. Invia il file `app-universal-debug.apk` al telefono (tramite cavo USB, condivisione locale, Bluetooth o Telegram/Nextcloud).
2. Sullo smartphone, apri l'app **File / Gestione File** e tocca l'APK.
3. Se Android chiede conferma per "Installare app da origini sconosciute", tocca **Impostazioni** ➔ **Consenti da questa sorgente**.
4. Tocca **Installa** (o **Aggiorna** se hai già installata una versione precedente).

### Metodo B — Rapido per Sviluppatori (via ADB):
Con lo smartphone collegato via USB e con il *Debug USB* attivo nelle Opzioni Sviluppatore:
```bash
adb install -r ./app-universal-debug.apk
```

---

## 🔒 5. Permessi e Verifica del Funzionamento su Android

Al primo avvio dell'applicazione su Android:
1. **Permesso Notifiche (Android 13+):** Conferma l'autorizzazione alle notifiche. Questo permette ad `AudioService.kt` di mostrare la notifica multimediale persistente e continuare l'ascolto a schermo spento.
2. **Accesso ai File Multimediali:** L'app chiederà l'accesso a `READ_MEDIA_AUDIO` per scansionare le tue cartelle musicali locali (`/storage/emulated/0/Music`, `/storage/emulated/0/Download`).
3. **Verifica Nuove Funzioni:**
   * Apri **Playlist**: tocca **Modifica** su una playlist per vederla caricata direttamente nel compositore a destra/in cima.
   * Apri la **Home**: tocca il pulsante `+` accanto a una traccia della coda e verifica che la spunta si attivi e disattivi salvando la playlist all'istante!
