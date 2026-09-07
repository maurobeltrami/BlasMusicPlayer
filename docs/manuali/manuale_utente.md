# 📖 Manuale Utente: BlasMusicPlayer

Benvenuto nel manuale d'uso ufficiale di **BlasMusicPlayer**, il riproduttore musicale desktop nativo di **BlasOpen**.

---

## 🚀 1. Come Avviare l'Applicazione (Regola Zero-Terminal)

In conformità con l'Articolo 2 della **Costituzione di BlasOpen**, l'utente finale non deve mai essere costretto a interagire con il terminale:

1. **Avvio Diretto (Zero-Terminal):**
   * Fai doppio clic su **`BlasMusicPlayer.app`** (installato da `.dmg`) o sullo script `./blasmusicplayer`.
   * **Se macOS mostra l'avviso di sicurezza (Gatekeeper):** Trattandosi di software open source gratuito, al primo avvio su Mac:
     * Clicca su **Done/Annulla**.
     * Apri **Impostazioni di Sistema** ➔ **Privacy e sicurezza** ➔ scorri su **Sicurezza** e clicca su **"Apri comunque"**.
     * *(In alternativa da Terminale: `xattr -cr /Applications/BlasMusicPlayer.app`).*
   * **Se Windows mostra "PC protetto da Windows" (SmartScreen):** Clicca su **"Ulteriori informazioni"** e seleziona **"Esegui comunque"**.
2. **Modalità Sviluppo (per programmatori):**
   ```bash
   npm run tauri dev
   ```

---

## 🎵 2. Riproduzione e Navigazione Filesystem

BlasMusicPlayer rende l'ascolto immediato e privo di configurazioni complesse:

### 📂 Esplorazione delle Cartelle
* **Navigazione Rapida:** Clicca sulle cartelle per entrarvi; usa il pulsante **`⬆` (Su)** per risalire alla cartella superiore.
* **Tasto Play sulle Sottocartelle (▶):** Accanto a ogni cartella o sottocartella è presente un pulsante verde Play. Cliccandolo, tutti i brani contenuti in quella sottocartella vengono accodati e riprodotti all'istante!
* **Cambia Cartella Principale:** Clicca sull'icona della cartella per selezionare una nuova cartella sorgente sul tuo computer.
* **Memoria dell'Ultima Posizione:** L'applicazione ricorda sempre l'ultima cartella esplorata, riaprendola automaticamente al successivo avvio.

---

## 📑 3. Creazione e Gestione delle Playlist

BlasMusicPlayer include un sistema completo per la gestione delle proprie playlist personali in locale:

### 🎧 Selezione Playlist
* Nella barra laterale sinistra, sotto la cartella corrente, trovi il menu a tendina **"Seleziona Playlist"**.
* Selezionando una playlist salvata, i brani vengono caricati immediatamente nella coda di ascolto.

### ➕ Creare una Nuova Playlist (Pagina Playlist)
1. Clicca sulla scheda **"Playlist"** nella barra di navigazione in alto.
2. Inserisci il nome della nuova playlist nel campo di testo dedicato.
3. Esplora le tue cartelle musicali nel pannello di composizione.
4. Ogni brano mostra un pulsante **`+`**: fai clic su di esso per aggiungere la canzone alla tua nuova playlist!
5. Clicca su **"Salva Playlist"**: la playlist verrà memorizzata in modo permanente sul tuo dispositivo (salvataggio locale).

---

## 🖼️ 4. Copertine, Metadati e Display Centrale

* **Metadati Automatici:** All'avvio di ogni brano, il motore nativo estrae istantaneamente il titolo reale della traccia e il nome dell'artista dai tag audio (ID3/FLAC/Vorbis).
* **Copertine Incorporate (Cover Art):** Se il file audio contiene una copertina incorporata, questa viene mostrata sia nel display centrale che nell'anteprima laterale.
* **Visualizzatore Audio a 60 FPS:** Clicca su **`[ MODO: ... ]`** per alternare tra:
  * Spettro a Barre di frequenza
  * Oscilloscopio a Forma d'Onda
  * Anelli d'Onda Reattivi
  * Vinile Rotante sincronizzato con il ritmo

---

## 🎚️ 5. Volume ed Equalizzatore

* **Regolazione Volume:** Modifica il volume sia dallo slider continuo nella barra di navigazione che dalla barra inferiore; i controlli sono sempre sincronizzati.
* **Equalizzatore a 3 Bande:** Nella scheda dedicata, puoi intervenire in tempo reale sulle frequenze dei Bassi, Medi e Alti.

---

## 🎨 6. Temi Grafici: Modern vs Punk

Puoi cambiare l'estetica dell'applicazione con un solo clic dal selettore in alto a destra:
* **Tema Modern Dark:** Atmosfera scura, pulita ed elegante in stile Spotify con accenti verde `#1DB954`.
* **Tema Punk:** Stile acid-punk anni '80 con lo sfondo iconico **leopardato** (`.leopard-bg`) nella libreria laterale, bordi rosa shocking e accenti giallo neon `#CCFF00`.

---

## ⌨️ 7. Scorciatoie da Tastiera

| Tasto | Azione |
| :--- | :--- |
| **`SPAZIO`** | Play / Pausa |
| **`FRECCIA DESTRA`** | Brano successivo (`⏭`) |
| **`FRECCIA SINISTRA`** | Brano precedente (`⏮`) |
| **`FRECCIA SU`** | Aumenta il volume ($+5\%$) |
| **`FRECCIA GIÙ`** | Diminuisce il volume ($-5\%$) |
| **`ESC`** | Torna alla schermata principale |
