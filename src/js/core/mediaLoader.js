// core/mediaLoader.js - Caricamento e riproduzione audio locale nativa con streaming HTTP
import * as pl from '../data/playlist.js';
import * as stateManager from './stateManager.js';
import { initAudio } from './audioEngine.js';

let cachedBaseOrigin = null;

export async function initStreamBase() {
    if (cachedBaseOrigin) return cachedBaseOrigin;
    if (window.__TAURI__?.core) {
        try {
            const probe = await window.__TAURI__.core.invoke('get_stream_url', { path: '' });
            if (probe && probe.startsWith('http://127.0.0.1:')) {
                const match = probe.match(/http:\/\/127\.0\.0\.1:\d+/);
                if (match) cachedBaseOrigin = match[0];
            }
        } catch (_) {}
    }
    return cachedBaseOrigin || '';
}

function resolveMediaUrl(filePath) {
    if (!filePath) return "";
    if (cachedBaseOrigin) return `${cachedBaseOrigin}/audio?path=${encodeURIComponent(filePath)}`;
    if (window.__TAURI__?.core?.convertFileSrc) return window.__TAURI__.core.convertFileSrc(filePath);
    return filePath;
}

function resolveCoverUrl(coverPath, trackPath) {
    const p = coverPath || trackPath;
    if (!p) return null;
    if (cachedBaseOrigin) return `${cachedBaseOrigin}/cover?path=${encodeURIComponent(p)}`;
    if (window.__TAURI__?.core?.convertFileSrc) return window.__TAURI__.core.convertFileSrc(p);
    return p;
}

function updateMediaSession(track, coverSrc) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Sconosciuto',
            artist: (track.artist && track.artist !== 'Locale') ? track.artist : 'BlasMusic',
            album: 'BlasMusicPlayer',
            artwork: coverSrc ? [{ src: coverSrc, sizes: '512x512', type: 'image/jpeg' }] : []
        });
    } catch (_) {}
}

export async function loadTrack(audioPlayer, index, autoPlay, renderUICallback) {
    if (pl.currentPlaylist.length === 0) return;
    pl.setCurrentTrackIndex(index);
    stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
    const track = pl.getCurrentTrack();

    if (!cachedBaseOrigin) await initStreamBase();

    const mediaUrl = resolveMediaUrl(track.path);
    if (audioPlayer.src !== mediaUrl) {
        audioPlayer.src = mediaUrl;
    }

    const coverSrc = resolveCoverUrl(track.cover, track.path);
    pl.setCoverUrl(coverSrc);
    updateMediaSession(track, coverSrc);

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

    const trackDisplay = document.getElementById('currentTrack');
    const trackDisplayBottom = document.getElementById('currentTrackBottom');
    const artistStr = (track.artist && track.artist !== 'Locale') ? ` - ${track.artist}` : '';
    const label = `${track.title}${artistStr}`;

    if (trackDisplay) trackDisplay.textContent = label;
    if (trackDisplayBottom) trackDisplayBottom.textContent = label;

    const playIcon = document.getElementById('playPauseIcon');
    const playIconBottom = document.getElementById('playPauseIconBottom');

    const updatePlayUI = (playing) => {
        pl.setPlaying(playing);
        const [oldIcon, newIcon] = playing ? ['fa-play', 'fa-pause'] : ['fa-pause', 'fa-play'];
        if (playIcon) playIcon.classList.replace(oldIcon, newIcon);
        if (playIconBottom) playIconBottom.classList.replace(oldIcon, newIcon);
    };

    if (autoPlay) {
        initAudio(audioPlayer).catch(() => {});
        const p = audioPlayer.play();
        if (p !== undefined) {
            p.then(() => updatePlayUI(true)).catch((err) => {
                console.warn("Riproduzione immediata in attesa:", err);
                audioPlayer.addEventListener('canplay', () => {
                    audioPlayer.play().then(() => updatePlayUI(true)).catch(e => console.warn("Retry play:", e));
                }, { once: true });
            });
        }
    } else {
        updatePlayUI(false);
    }

    if (renderUICallback) renderUICallback();
}
