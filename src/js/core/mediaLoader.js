// core/mediaLoader.js - Caricamento e riproduzione audio locale nativa con streaming HTTP
import * as pl from '../data/playlist.js';
import { initAudio } from './audioEngine.js';

async function resolveMediaUrl(filePath) {
    if (!filePath) return "";
    if (window.__TAURI__?.core) {
        try {
            const url = await window.__TAURI__.core.invoke('get_stream_url', { path: filePath });
            if (url) return url;
        } catch (_) {}
        if (window.__TAURI__.core.convertFileSrc) return window.__TAURI__.core.convertFileSrc(filePath);
    }
    return filePath;
}

async function resolveCoverUrl(coverPath, trackPath) {
    let p = coverPath;
    if (!p && trackPath) {
        const lastSlash = Math.max(trackPath.lastIndexOf('/'), trackPath.lastIndexOf('\\'));
        if (lastSlash > 0) p = trackPath.substring(0, lastSlash) + "/cover.jpg";
    }
    if (!p) return null;
    if (window.__TAURI__?.core) {
        try {
            const url = await window.__TAURI__.core.invoke('get_cover_url', { path: p });
            if (url) return url;
        } catch (_) {}
        if (window.__TAURI__.core.convertFileSrc) return window.__TAURI__.core.convertFileSrc(p);
    }
    return p;
}

export async function loadTrack(audioPlayer, index, autoPlay, renderUICallback) {
    if (pl.currentPlaylist.length === 0) return;
    pl.setCurrentTrackIndex(index);
    const track = pl.getCurrentTrack();

    audioPlayer.src = await resolveMediaUrl(track.path);
    audioPlayer.load();

    const coverSrc = await resolveCoverUrl(track.cover, track.path);
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
