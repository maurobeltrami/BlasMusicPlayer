// themeManager.js - Gestione architettura temi BlasMusicPlayer

const THEME_KEY = 'mauro_music_player_theme';
export const DEFAULT_THEME = 'dark';

/**
 * REGISTRO DEI TEMI CENTRALIZZATO
 * Per aggiungere un nuovo stile all'app basta:
 * 1. Aggiungere la voce in questo array (id, name, description)
 * 2. Definire le variabili CSS in `src/css/variables.css` sotto [data-theme="tuo-id"]
 * 3. (Opzionale) Aggiungere l'opzione nel <select id="themeSelector"> in index.html (se omesso viene sincronizzato automaticamente)
 */
export const AVAILABLE_THEMES = [
    { id: 'dark', name: 'Scuro (Spotify Style)', description: 'Stile moderno scuro pulito ad alto contrasto' },
    { id: 'light', name: 'Chiaro', description: 'Stile moderno chiaro elegante' },
    { id: 'punk', name: 'PUNK (Acid / Street)', description: 'Stile anarchico con collage, leopard e graffiti' }
];

export function initTheme() {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);

    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        syncThemeSelector(themeSelector, savedTheme);

        themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            setTheme(newTheme);
        });
    }
}

export function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) {
        return saved;
    }
    return DEFAULT_THEME;
}

export function setTheme(themeId) {
    const validTheme = AVAILABLE_THEMES.some(t => t.id === themeId) ? themeId : DEFAULT_THEME;
    applyTheme(validTheme);
    localStorage.setItem(THEME_KEY, validTheme);

    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector && themeSelector.value !== validTheme) {
        themeSelector.value = validTheme;
    }

    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: validTheme } }));
}

export function applyTheme(themeName) {
    const theme = AVAILABLE_THEMES.some(t => t.id === themeName) ? themeName : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
        document.body.setAttribute('data-theme', theme);
    }
}

function syncThemeSelector(selectorEl, currentTheme) {
    // Se ci sono temi registrati non ancora presenti nel select, li aggiunge dinamicamente
    AVAILABLE_THEMES.forEach(t => {
        if (!selectorEl.querySelector(`option[value="${t.id}"]`)) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            selectorEl.appendChild(opt);
        }
    });
    selectorEl.value = currentTheme;
}
