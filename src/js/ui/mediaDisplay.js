// ui/mediaDisplay.js - Aggiornamento e pulizia dell'interfaccia del brano in riproduzione
import * as pl from '../data/playlist.js';

// Sincronizza le icone Play/Pausa su player principale e sticky bar
export function setPlayIcons(playing) {
    pl.setPlaying(playing);
    const [oldIcon, newIcon] = playing ? ['fa-play', 'fa-pause'] : ['fa-pause', 'fa-play'];
    ['playPauseIcon', 'playPauseIconBottom'].forEach(id => {
        document.getElementById(id)?.classList.replace(oldIcon, newIcon);
    });
}

// Aggiorna titolo, artista e miniatura della copertina nell'interfaccia
export function renderTrackDisplay(track, coverSrc) {
    const coverThumbBottom = document.getElementById('coverThumbBottom');
    if (coverThumbBottom) {
        if (coverSrc) {
            coverThumbBottom.onload = () => coverThumbBottom.classList.remove('hidden');
            coverThumbBottom.onerror = () => coverThumbBottom.classList.add('hidden');
            coverThumbBottom.src = coverSrc;
        } else {
            coverThumbBottom.classList.add('hidden');
            coverThumbBottom.src = '';
        }
    }

    const artistStr = (track.artist && track.artist !== 'Locale') ? ` - ${track.artist}` : '';
    const label = `${track.title}${artistStr}`;
    const trackDisplay = document.getElementById('currentTrack');
    const trackDisplayBottom = document.getElementById('currentTrackBottom');
    if (trackDisplay) trackDisplay.textContent = label;
    if (trackDisplayBottom) trackDisplayBottom.textContent = label;
}

// Ripristina i controlli visivi allo stato iniziale quando la coda viene svuotata
export function resetTrackDisplay() {
    setPlayIcons(false);
    const coverThumbBottom = document.getElementById('coverThumbBottom');
    if (coverThumbBottom) { coverThumbBottom.classList.add('hidden'); coverThumbBottom.src = ''; }

    const trackDisplay = document.getElementById('currentTrack');
    const trackDisplayBottom = document.getElementById('currentTrackBottom');
    if (trackDisplay) trackDisplay.textContent = 'NESSUN BRANO SELEZIONATO';
    if (trackDisplayBottom) trackDisplayBottom.textContent = 'NESSUN BRANO';

    ['progressBar', 'progressBarBottom'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = '0%';
    });
    ['time-display', 'time-display-bottom'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0:00 / 0:00';
    });
}
