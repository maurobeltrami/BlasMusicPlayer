# 🎨 Guida alla Creazione di Nuovi Temi Visivi — BlasMusicPlayer

> **Destinatari:** Sviluppatori, designer e utenti della community **[BlasOpen](../../../COSTITUZIONE.md)**.  
> **Obiettivo:** Imparare l'architettura visiva di BlasMusicPlayer e creare nuovi temi grafici personalizzati in modo semplice, pulito e accessibile.

---

## 🏛️ 1. Principi Architetturali e Costituzionali

In conformità all'**Articolo 4 della Costituzione di BlasOpen** (*Trasparenza Didattica, Modularità e Documentazione in Italiano*), l'architettura dei temi di BlasMusicPlayer è stata progettata per essere:

1. **Local-First & Immediata:** Nessuna dipendenza remota; il cambio di tema avviene all'istante tramite CSS Custom Properties (variabili CSS native) gestite a runtime dal browser/WebView.
2. **Auto-Contenuta (No Anti-Pattern):** Ogni tema è incapsulato nel proprio blocco semantico `[data-theme="nome-tema"]`. Non esistono regole globali bloccanti o selettori di negazione rigidi (come vecchi `body:not(...)`).
3. **Architettura a Due Livelli di Contrasto (Canvas vs Card):**
   * **Livello 1 — Canvas/Pagina (`--bg-main`):** Lo sfondo principale dell'applicazione (es. sfondo nero asfalto in Punk, nero neutro in Dark, grigio chiaro in Light). I testi a questo livello usano `--text-main` e `--text-muted`.
   * **Livello 2 — Superfici/Cards (`--box-bg`):** Le schede di contenuto, il player centrale e la coda di riproduzione. I testi all'interno usano `--box-text` e `--box-text-muted`.

Grazie a questo modello gerarchico, un tema può avere uno sfondo scuro con card bianche (come lo stile Punk/Fanzine) oppure superfici omogenee senza che il testo diventi mai illeggibile.

---

## 📐 2. Anatomia dei Token di Stile (`src/css/variables.css`)

Tutti i parametri visivi di un tema sono controllati da variabili CSS standard:

| Variabile CSS | Descrizione | Esempio Dark | Esempio Punk |
| :--- | :--- | :--- | :--- |
| `--bg-main` | Sfondo principale dell'applicazione | `#121212` | `#141414` |
| `--text-main` | Testo principale su sfondo pagina / navbar | `#FFFFFF` | `#F5F5F5` |
| `--text-muted` | Testo secondario / etichette su pagina | `#E5E7EB` | `#B3B3B3` |
| `--accent-red` | Colore d'accento principale (pulsanti attivi, cursori) | `#1DB954` | `#E60000` |
| `--box-bg` | Sfondo dei riquadri e delle card | `#181818` | `#FFFFFF` |
| `--box-text` | Testo primario all'interno delle card | `#FFFFFF` | `#111111` |
| `--box-text-muted` | Testo secondario all'interno delle card | `#A3A3A3` | `#555555` |
| `--box-border-color`| Colore dei bordi delle card | `#282828` | `#000000` |
| `--box-border-width`| Spessore del bordo (es. 1px elegante, 3px punk) | `1px` | `3px` |
| `--box-radius` | Raggio degli angoli (es. 8px arrotondato, 0px netto) | `8px` | `0px` |
| `--shadow-color` | Colore e morbidezza dell'ombra delle card | `rgba(0,0,0,0.5)` | `#CCFF00` |
| `--font-primary` | Famiglia tipografica per il testo principale | `'Inter', sans-serif` | `'Special Elite', monospace` |
| `--font-title` | Famiglia tipografica per i titoli | `'Inter', sans-serif` | `'Rubik Wet Paint', cursive` |

---

## 🛠️ 3. Creare un Nuovo Tema Passo-Passo

Creiamo come esempio un tema in stile **Synthwave / Cyberpunk '80s** (sfondo viola profondo, accenti rosa neon e ciano).

### Passo 1 — Definire le Variabili in `src/css/variables.css`
Apri `src/css/variables.css` e aggiungi il blocco del tuo nuovo tema:

```css
/* OVERRIDE: TEMA SYNTHWAVE '80s */
[data-theme="synthwave"] {
    /* Palette Tipografica */
    --font-primary: 'Inter', sans-serif;
    --font-title: 'Inter', sans-serif;

    /* Sfondo e Testi del Canvas */
    --bg-main: #180928;          /* Viola notte profondo */
    --text-main: #F3E8FF;        /* Bianco lavanda brillante */
    --text-muted: #C084FC;       /* Viola chiaro */
    --accent-red: #FF007F;       /* Rosa fluo neon */

    /* Cards e Superfici */
    --box-bg: #26113E;           /* Viola intermedio */
    --box-text: #FFFFFF;
    --box-text-muted: #E9D5FF;
    --box-border-color: #A855F7;  /* Bordo viola neon */
    --box-border-width: 1.5px;
    --box-radius: 12px;
    --shadow-color: rgba(255, 0, 127, 0.35); /* Glow rosa neon */

    /* Colori acidi / secondari */
    --acid-green: #00FFCC;       /* Ciano fluo */
    --acid-pink: #FF007F;
    --acid-blue: #00E5FF;
}
```

### Passo 2 — Registrare il Tema nel Theme Manager (`src/js/ui/themeManager.js`)
Apri `src/js/ui/themeManager.js` e aggiungi la voce all'array `AVAILABLE_THEMES`:

```javascript
export const AVAILABLE_THEMES = [
    { id: 'dark', name: 'Scuro (Spotify Style)', description: 'Stile moderno scuro pulito ad alto contrasto' },
    { id: 'light', name: 'Chiaro', description: 'Stile moderno chiaro elegante' },
    { id: 'punk', name: 'PUNK (Acid / Street)', description: 'Stile anarchico con collage, leopard e graffiti' },
    { id: 'synthwave', name: 'Synthwave Neon', description: 'Stile anni 80 con accenti rosa fluo e ciano' } // <-- Nuova voce!
];
```

> **Nota di Automazione:**  
> Il `themeManager.js` sincronizza automaticamente il selettore `<select id="themeSelector">`.  
> Non è necessario modificare manualmente l'HTML! All'avvio dell'app, l'opzione apparirà già pronta e selezionabile.

---

## 🪄 4. (Opzionale) Aggiungere Effetti Grafici Esclusivi

Se il tuo tema richiede effetti visivi unici (come sfondi con pattern, ombre luminescenti o animazioni), racchiudili sempre sotto il selettore del tema:

```css
/* Effetto Glow sui titoli per il tema Synthwave */
[data-theme="synthwave"] header h1 {
    text-shadow: 0 0 10px rgba(255, 0, 127, 0.7), 0 0 20px rgba(0, 229, 255, 0.4);
}

/* Bordo luminoso per il visualizzatore audio */
[data-theme="synthwave"] #visualizerContainer {
    border-color: var(--acid-green) !important;
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.3) !important;
}
```

In questo modo gli altri temi non subiranno interferenze e l'esperienza rimarrà pulita e prevedibile.

---

## 👁️ 5. Linee Guida per l'Accessibilità e la Leggibilità

Per evitare problemi di contrasto (come quelli riscontrati nella prima versione del tema Punk):

1. **Rapporto di Contrasto (WCAG AA):**
   * Il testo primario (`--text-main`) rispetto allo sfondo (`--bg-main`) deve avere un contrasto di almeno **4.5:1** (e almeno **3:1** per titoli grandi).
   * Verifica che i pulsanti inattivi nella barra di navigazione mantengano sempre opacità o luminosità sufficiente ad essere letti.
2. **Superfici con Pattern:**
   * Se usi pattern a contrasto variabile (es. maculato leopardato o texture grezze), non posizionare mai testo semplice direttamente sopra di essi. Usa sempre un box con sfondo solido (es. `background-color: #000; color: #FFF;`) per isolare il testo.
3. **Elementi Invertiti:**
   * Se un componente dentro una card chiara utilizza uno sfondo scuro (es. l'indicatore `#time-display` o i badge di stato), imposta esplicitamente il testo interno a un colore chiaro per evitare l'effetto "nero su nero".

---

*Documento conforme alla Costituzione BlasOpen e alle specifiche architetturali di BlasMusicPlayer.*
