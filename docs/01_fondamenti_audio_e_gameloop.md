# 📚 Lezione 01: Fondamenti di Audio Digitale, Buffer PCM e Game Loop

Benvenuto nella prima lezione teorica di **BlasMusicPlayer**. In questo documento esploriamo la teoria a basso livello che governa il funzionamento del nostro riproduttore musicale nativo in C++17.

---

## 1. Cos'è l'Audio Digitale e il Campionamento PCM?

Nel mondo reale, il suono è un'**onda di pressione analogica** continua nell'aria. Il microfono converte queste onde in una tensione elettrica continua. Ma come fa un computer digitale a memorizzare e riprodurre questa onda?

Attraverso la modulazione ad impulsi di codice: **PCM (Pulse Code Modulation)**.

### I due parametri fondamentali del PCM:

1. **Frequenza di Campionamento (Sample Rate - $Hz$):**
   * Quante volte al secondo il computer misura l'ampiezza dell'onda sonora.
   * Lo standard musicale dei CD audio è **44.100 Hz** (44.1 kHz).
   * Secondo il *Teorema di Nyquist-Shannon*, per registrare perfettamente una frequenza udibile fino a $20.000\text{ Hz}$ (il limite dell'orecchio umano), la frequenza di campionamento deve essere almeno il doppio: $2 \times 20.000 = 40.000\text{ Hz}$. Ecco perché 44.1 kHz o 48 kHz sono gli standard dell'industria.

2. **Profondità di Bit (Bit Depth):**
   * Quanti bit usiamo per memorizzare ciascuna misurazione (campione).
   * Con 16-bit (standard CD), abbiamo $2^{16} = 65.536$ livelli di precisione per campione.
   * Nei motori audio moderni (come Raylib e Web Audio API), i campioni vengono normalizzati in numeri con la virgola a 32 bit (`float`), dove $0.0$ rappresenta il silenzio, $1.0$ il picco massimo positivo e $-1.0$ il picco massimo negativo.

---

## 2. Lo Streaming Audio e il Buffer Circolare

Un file musicale compresso (come un `.mp3` o `.flac`) non viene caricato per intero decompressato nella RAM, perché una canzone da 4 minuti occuperebbe oltre 40 MB di memoria non compressa.

Si utilizza invece lo **Streaming Audio**:
* Il disco legge piccoli pezzi del file compresso alla volta (es. 4096 campioni).
* Il decoder interno (in Raylib gestito dalla libreria C `miniaudio`) decomprime quel piccolo blocco in campioni PCM `float`.
* I campioni vengono inseriti in un **Buffer Circolare (Ring Buffer)** che la scheda audio (DAC - Convertitore Digitale/Analogico) svuota ad intervalli regolari per inviare il segnale agli altoparlanti.
* La funzione di Raylib `UpdateMusicStream(music)` deve essere chiamata ad ogni frame per riempire continuamente il buffer prima che la scheda audio lo esaurisca (evitando i fastidiosi "scatti" o stuttering).

---

## 3. Il Game Loop applicato a una GUI Desktop

A differenza delle vecchie applicazioni desktop che "dormono" finché non premi un tasto, un lettore musicale moderno con visualizzatori e animazioni adotta un **Game Loop a 60 Frame al Secondo (FPS)**:

```text
       ┌───────────────────────────────┐
       │   Avvio & Inizializzazione   │
       └──────────────┬────────────────┘
                      ▼
         ┌───────────────────────────┐
  ┌─────►│  1. Rileva Input Utente   │  (Mouse, Tastiera, Drag & Drop)
  │      └────────────┬──────────────┘
  │                   ▼
  │      ┌───────────────────────────┐
  │      │  2. Aggiorna Stato Logico │  (UpdateMusicStream, calcola secondi)
  │      └────────────┬──────────────┘
  │                   ▼
  │      ┌───────────────────────────┐
  │      │  3. Disegna il Frame      │  (BeginDrawing -> Schermo -> EndDrawing)
  │      └────────────┬──────────────┘
  │                   │
  └─────── [Finestra aperta?] ───────┘
```

In Raylib questo si traduce nel ciclo:
```cpp
while (!WindowShouldClose()) {
    // 1 & 2. Aggiornamento
    audioEngine.Update();
    
    // 3. Rendering
    BeginDrawing();
    ClearBackground(COLOR_BG);
    // ... Disegna elementi UI ...
    EndDrawing();
}
```

---

## 4. Gestione degli Eventi Drag & Drop

I sistemi operativi moderni (macOS Cocoa, Windows Shell, Linux X11/Wayland) permettono all'utente di trascinare file da una cartella dentro una finestra attiva.

Raylib intercetta questo evento tramite due funzioni native:
1. `IsFileDropped()`: Restituisce `true` esattamente nel fotogramma in cui l'utente rilascia il pulsante del mouse sopra la finestra.
2. `LoadDroppedFiles()`: Restituisce una struct `FilePathList` contenente un array di stringhe con i percorsi assoluti di tutti i file trascinati.
3. `UnloadDroppedFiles(files)`: Libera la memoria allocata dal sistema operativo per l'elenco dei percorsi.

Nel prossimo modulo implementeremo il codice per trasformare questi concetti in realtà!
