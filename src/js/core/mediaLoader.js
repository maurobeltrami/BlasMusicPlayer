// core/mediaLoader.js - Caricamento e riproduzione audio locale nativa
import * as pl from '../data/playlist.js';
import { initAudio } from './audioEngine.js';

export function loadTrack(audioPlayer, index, autoPlay, renderUICallback) {
    if (pl.currentPlaylist.length === 0) return;
    pl.setCurrentTrackIndex(index);
    const track = pl.getCurrentTrack();

    const toAssetSrc = (filePath) => {
        if (!filePath) return null;
        if (window.__TAURI__?.core?.convertFileSrc) return window.__TAURI__.core.convertFileSrc(filePath);
        if (window.__TAURI_INTERNALS__?.convertFileSrc) return window.__TAURI_INTERNALS__.convertFileSrc(filePath);
        return filePath;
    };

    audioPlayer.src = toAssetSrc(track.path) || track.path;
    audioPlayer.load();

    // Risoluzione e impostazione Copertina
    let coverSrc = toAssetSrc(track.cover);
    if (!coverSrc && track.path) {
        const lastSlash = Math.max(track.path.lastIndexOf('/'), track.path.lastIndexOf('\\'));
        if (lastSlash > 0) {
            coverSrc = toAssetSrc(track.path.substring(0, lastSlash) + "/cover.jpg");
        }
    }
    pl.setCoverUrl(coverSrc);

    const coverThumbBottom = document.getElementById('coverThumbBottom');
    if (coverThumbBottom) {
        if (coverSrc) {
            coverThumbBottom.src = coverSrc;
            coverThumbBottom.classList.remove('hidden');
        } else {
            coverThumbBottom.classList.add('hidden');
        }
    }

    const trackDisplay = document.getElementById('currentTrack');
    const trackDisplayBottom = document.getElementById('currentTrackBottom');
    const artistStr = (track.artist && track.artist !== 'Locale') ? ` - ${track.artist}` : '';
    const label = `${track.title}${artistStr}`;

    if (trackDisplay) trackDisplay.textContent = label;
    if (trackDisplayBottom) trackDisplayBottom.textContent = label;

    const playIcon = document.getElementById('playPauseIcon');
    const playIconBottom = document.getElementById('playPauseIconBottom');

    if (autoPlay) {
        initAudio(audioPlayer).catch(() => {}).then(() => {
            return audioPlayer.play();
        }).then(() => {
            pl.setPlaying(true);
            if (playIcon) playIcon.classList.replace('fa-play', 'fa-pause');
            if (playIconBottom) playIconBottom.classList.replace('fa-play', 'fa-pause');
        }).catch((err) => {
            console.warn("Riproduzione audio:", err);
        });
    } else {
        pl.setPlaying(false);
        if (playIcon) playIcon.classList.replace('fa-pause', 'fa-play');
        if (playIconBottom) playIconBottom.classList.replace('fa-pause', 'fa-play');
    }

    if (renderUICallback) renderUICallback();
}
