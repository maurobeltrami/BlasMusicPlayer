# Guida: Sostituzione Logo e Icone di BlasMusicPlayer

Questa guida descrive la procedura completa per sostituire il logo e le icone dell'applicazione su tutte le piattaforme supportate (Desktop macOS/Windows/Linux e Mobile Android).

---

## 1. Requisiti del File Sorgente

Il file di partenza deve essere:
- **Formato:** PNG (trasparenza supportata ma non obbligatoria)
- **Dimensioni:** 1024×1024 pixel (o almeno 512×512)
- **Posizionamento:** Il soggetto principale deve stare al centro con margini adeguati (≈10%) per evitare ritagli sui bordi arrotondati delle icone Android

Il logo attuale di BlasMusicPlayer si trova nella root del progetto come:
```
blas-logo-1024.png
```

---

## 2. Generazione Automatica con `npx tauri icon`

Tauri 2.0 include un generatore di icone integrato che produce in automatico **tutti i formati e le densità** necessarie per ogni piattaforma. Basta eseguire **un solo comando** dalla root del progetto:

```bash
cd /percorso/del/progetto/BlasMusicPlayer
npx tauri icon blas-logo-1024.png
```

### File generati per Desktop

| File | Piattaforma | Percorso |
|------|-------------|----------|
| `icon.icns` | macOS | `src-tauri/icons/icon.icns` |
| `icon.ico` | Windows | `src-tauri/icons/icon.ico` |
| `32x32.png` | Linux | `src-tauri/icons/32x32.png` |
| `128x128.png` | Linux | `src-tauri/icons/128x128.png` |
| `128x128@2x.png` | Linux HiDPI | `src-tauri/icons/128x128@2x.png` |

### File generati per Android

| Cartella | Densità schermo | DPI |
|----------|----------------|-----|
| `mipmap-mdpi/` | 1× | 160 dpi |
| `mipmap-hdpi/` | 1.5× | 240 dpi |
| `mipmap-xhdpi/` | 2× | 320 dpi |
| `mipmap-xxhdpi/` | 3× | 480 dpi |
| `mipmap-xxxhdpi/` | 4× | 640 dpi |

Per ogni densità vengono generati:
- `ic_launcher.png` — icona standard quadrata
- `ic_launcher_round.png` — icona circolare (richiesta da Android 7.1+)
- `ic_launcher_foreground.png` — layer primo piano per icone adattive (Android 8.0+)

---

## 3. Come Funziona Android Adaptive Icons

A partire da Android 8.0 (API 26), le icone sono **adattive**: il sistema le ritagli con forme diverse (cerchio, quadratino, quadratino arrotondato, lacrima…) a seconda del launcher del produttore. Per questo motivo il generatore produce:

- **`ic_launcher_foreground.png`** — il soggetto principale (logo) su sfondo trasparente, con safe zone del 33% per i ritagli del sistema
- **`ic_launcher.png`** — icona legacy per dispositivi pre-Android 8

Il file `mipmap-anydpi-v26/ic_launcher.xml` nella build Android definisce quali layer compongono l'icona adattiva. Tauri lo gestisce automaticamente.

---

## 4. Rebuild dell'APK dopo la Modifica delle Icone

Dopo aver eseguito `npx tauri icon`, è necessario ricompilare l'APK per includere le nuove icone nel bundle:

```bash
# Impostare le variabili d'ambiente Android (macOS Apple Silicon)
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.3.11579264"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Compilare l'APK
npx tauri android build --apk --debug --target aarch64

# Copiare l'APK nella root del progetto per comodità
cp src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk ./app-universal-debug.apk
```

---

## 5. Verifica del Risultato

### Su macOS (Desktop)
```bash
# Avviare l'app in development e verificare l'icona nel Dock
npm run tauri dev
```

### Su Android
1. Installare l'APK sul dispositivo: `adb install -r app-universal-debug.apk`
2. Aprire il launcher e cercare "BlasMusicPlayer"
3. Verificare che l'icona appaia nel drawer delle applicazioni e nella schermata recenti

---

## 6. Personalizzare Solo Alcune Piattaforme

Per sovrascrivere manualmente solo un formato specifico (senza rieseguire tutto):

- **macOS:** Sostituire `src-tauri/icons/icon.icns` con il proprio file `.icns`
- **Windows:** Sostituire `src-tauri/icons/icon.ico`
- **Android specifica densità:** Sostituire il PNG nella cartella `mipmap-*` desiderata in `src-tauri/gen/android/app/src/main/res/`
