# 📖 Manuale Utente: BlasMusicPlayer

Benvenuto nel manuale d'uso ufficiale di **BlasMusicPlayer**, il riproduttore musicale desktop nativo di **BlasOpen**.

---

## 🚀 1. Come Avviare l'Applicazione

Puoi avviare l'applicazione desktop nativa in due modi:

1. **Eseguibile Nativo Diretto (Zero-Terminal):**
   ```bash
   ./src-tauri/target/debug/app
   ```
2. **Modalità Sviluppo con Ricaricamento Istantaneo:**
   ```bash
   npm run dev
   ```
*(Con il comando `npm run build` viene generato il pacchetto di installazione autonomo `.dmg` / `.app` con icona, avviabile con un semplice doppio click).*

---

## 🎵 2. Come Riprodurre la Musica (Drag & Drop Diretto)

BlasMusicPlayer non richiede complesse importazioni in libreria:
1. Apri una cartella qualsiasi del tuo computer contenente musica (`.mp3`, `.wav`, `.flac`, `.ogg`).
2. **Trascina il file audio direttamente con il mouse dentro la finestra dell'applicazione**.
3. Il brano inizierà immediatamente la riproduzione!

---

## ⌨️ 3. Comandi da Tastiera

| Tasto | Azione |
| :--- | :--- |
| **`SPAZIO`** | Avvia la riproduzione / Mette in pausa (Play/Pause Toggle) |
| **`FRECCIA DESTRA`** | Passa al brano successivo nella playlist (`⏭`) |
| **`FRECCIA SINISTRA`** | Torna al brano precedente nella playlist (`⏮`) |
| **`FRECCIA SU`** | Aumenta il volume di ascolto ($+1\%$) |
| **`FRECCIA GIÙ`** | Diminuisce il volume di ascolto ($-1\%$) |
| **`ESC`** o Click su **`X`** | Chiude il programma liberando le risorse audio |

---

## 📁 4. Navigazione Cartelle e Apertura File Stile Windows Media Player

BlasMusicPlayer offre un'esperienza integrata di navigazione del filesystem, senza dover passare per forza dal trascinamento:

- **Scheda `[ 📁 CARTELLE ]`:**
  - **Esplora cartelle:** Mostra le cartelle e i file audio (`.mp3`, `.wav`, `.flac`, `.ogg`) presenti nella directory corrente.
  - **Doppio click / Click su una cartella:** Entra nella cartella selezionata.
  - **Click su `.. (Cartella superiore)` o tasto `[ ⬆ Su ]`:** Risale al livello genitore del filesystem.
  - **Tasto `[ 📂 Sfoglia ]`:** Apre la finestra di dialogo nativa del sistema operativo per scegliere comodamente qualsiasi cartella sul computer.
  - **Tasto `[ ➕ Accoda Cartella ]`:** Aggiunge ricorsivamente tutti i file musicali presenti nella cartella aperta direttamente alla coda di ascolto.
  - **Click diretto su un file musicale:** Avvia immediatamente la riproduzione del brano e lo aggiunge alla coda.

- **Scheda `[ 📜 CODA (N) ]`:**
  - Mostra la coda di riproduzione attiva con il conteggio dei brani.
  - Clicca su una traccia qualsiasi per saltare direttamente a quel brano.

---

## 🎨 5. Interfaccia Moderna Stile WebMusicPlayerAI (Spotify & Punk)

L'interfaccia adotta ora la tipografia vettoriale ad alta definizione **Inter** e si articola in:
- **Top Navbar:**
  - Logo stilizzato **BLASMUSIC** ad alto contrasto.
  - Pulsante **`[ TEMA: MODERN / PUNK ]`**: commuta all'istante l'estetica tra il look elegante *Modern Dark* (Spotify `#121212`, `#181818`, `#1DB954`) e lo stile *Punk Acid* (accenti al neon giallo acido `#CCFF00`, rosa `#FF00FF` e bordi netti).
- **Display Screen Centrale (`#displayScreen`):**
  - Card ad angoli arrotondati (`12px`) con titolo brano in grande e stato in rilievo.
  - **Visualizzatore Audio Integrato:** visualizza in tempo reale Spettro a Barre, Forma d'Onda oscilloscopica, Anelli Reattivi o Disco in Vinile animato a 60 FPS.
  - Tasto **`[ MODO: ... ]`** in sovrimpressione per cambiare tipo di visualizzatore con un click.
  - **Seek Bar Interattiva:** Avanzamento continuo con scrubbing al mouse e timer `MM:SS`.
  - **Controlli Audio:** Precedente (`|<`), grande pulsante circolare Play/Pausa (`> / ||`) da 44px e Successivo (`>|`).
- **Pannello Laterale Sinistro:**
  - Schede `[ 📁 CARTELLE ]` e `[ 📜 CODA (N) ]` con scorrimento fluido della rotellina del mouse.
  - Evidenziazione della traccia in riproduzione con barra verde laterale.
- **Barra Inferiore & Slider Volume Continuo:**
  - **Slider Volume Continuo con Dragging:** Clicca o trascina il pallino cursore lungo la barra orizzontale del volume per impostare qualsiasi valore da 0% a 100%.
  - Visualizzazione percentuale live e scorciatoie da tastiera.
