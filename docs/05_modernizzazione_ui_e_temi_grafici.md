# 05. Modernizzazione UI, Tipografia Vettoriale e Temi Grafici Dinamici

Questo documento approfondisce i concetti teorici e architetturali alla base del restyling moderno di **BlasMusicPlayer**, ispirato all'interfaccia dell'applicazione web **WebMusicPlayerAI** (Django/Tailwind/CSS).

---

## 1. Il Problema della Tipografia Bitmap vs Vettoriale

Nei motori grafici per videogiochi e GUI come Raylib, la funzione nativa `DrawText()` utilizza un font bitmap monospazio a 10 pixel compresso direttamente nell'eseguibile.
Questo approccio ha dei limiti evidenti:
1. **Pixelation e Mancanza di Antialiasing:** A risoluzioni superiori o su schermi Retina/HiDPI, i caratteri scalati appaiono sgranati, ricordando i giochi DOS degli anni '90.
2. **Spaziatura (Kerning):** I font bitmap non gestiscono la crenatura tra lettere adiacenti, risultando visivamente rigidi.

### Soluzione in BlasMusicPlayer
Per ottenere la resa pulita e moderna dell'app web (font *Inter*):
* Carichiamo il font TrueType ad alta definizione con `LoadFontEx("assets/fonts/Inter.ttf", fontSize, NULL, 250)`.
* Attiviamo il filtro bilineare sulla texture del font:
  ```cpp
  SetTextureFilter(font.texture, TEXTURE_FILTER_BILINEAR);
  ```
* Disegniamo il testo tramite `DrawTextEx(font, text, position, fontSize, spacing, tint)`.

---

## 2. Architettura dei Temi Dinamici (Modern Dark vs Punk Style)

L'applicazione web originale implementava una doppia anima visiva:
1. **Modern Dark (Stile Spotify):**
   * Sfondo primario: `#121212` (Nero profondo ma non assoluto, previene l'affaticamento visivo).
   * Superfici e Cards: `#181818` / `#222222`.
   * Bordi sottili ed eleganti: `#282828`.
   * Accento primario: Verde Spotify `#1DB954` (Hover `#1ED760`).
   * Raggio di curvatura morbido (`border-radius: 8px - 12px`).
2. **Punk Acid (Stile Underground / Street):**
   * Ispirato al punk rock e alle grafiche fotocopia fanzine.
   * Colori acidi al neon: Verde Acido (`#CCFF00`), Rosa Acido (`#FF00FF`), Ciano (`#00FFFF`).
   * Bordi spessi e ad altissimo contrasto con ombre nette (Drop-shadows rigide a 4px).
   * Badge vistosi per le sezioni (`TRAX`, `CARTELLE`, `CODA`).

### Pattern di Implementazione
Nel file `Theme.h` e `Theme.cpp`, definiamo una struttura `ThemePalette` con puntatori o variabili statiche ricalcolate in base a `ThemeMode`:
```cpp
enum class ThemeMode { MODERN_DARK, PUNK };
```
La commutazione avviene in tempo reale senza dover ricaricare risorse o riavviare l'applicazione.

---

## 3. Slider del Volume Continuo ad Alta Precisione

La versione precedente utilizzava pulsanti incrementali a scatti (`-` e `+`). L'esperienza moderna richiede uno slider orizzontale continuo:
* **Mappatura Normalizzata ($0.0 \dots 1.0$):**
  $$\text{valore} = \text{clamp}\left(\frac{\text{mouseX} - \text{barX}}{\text{barWidth}}, 0.0f, 1.0f\right)$$
* **Dragging continuo (Scrubbing):** Se il tasto sinistro del mouse viene premuto all'interno dell'area di collisione e tenuto premuto (`IsMouseButtonDown`), lo stato di dragging viene mantenuto anche se il cursore esce verticalmente di pochi pixel.
* **Rendering a doppio livello:**
  1. Binario di fondo scuro (`TrackBg`).
  2. Barra attiva colorata proporzionale a `vol`.
  3. Cursore a pallino circolare (Thumb) posizionato esattamente sul valore corrente con feedback di hover.

---

## 4. Visualizzatore Audio Dinamico Centrale

Al centro del display screen (`#displayScreen`), il canvas dinamico ospita tre modalità di visualizzazione:
* **Spectrum Bars (Barre di Frequenza):** Barre verticali animate con attenuazione esponenziale (decay) per simulare l'analizzatore di spettro.
* **Waveform (Oscilloscopio):** Linea continua sinusoidale modulata dall'ampiezza dell'audio in esecuzione.
* **Reactive Rings (Cerchi Concentrici):** Onde circolari pulsanti che si espandono dal centro verso i bordi a tempo di musica.
