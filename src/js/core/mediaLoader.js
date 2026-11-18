// core/mediaLoader.js - Caricamento e riproduzione audio locale nativa con streaming HTTP
import * as pl from '../data/playlist.js';
import * as stateManager from './stateManager.js';
import { initAudio, ensureAudioRunning } from './audioEngine.js';
import { setPlayIcons, renderTrackDisplay, resetTrackDisplay } from '../ui/mediaDisplay.js';

let cachedBaseOrigin = null;
let pendingCanPlayHandler = null;

// Rimuove eventuale listener canplay pendente da un tentativo precedente fallito
function clearPendingCanPlay(audioPlayer) {
    if (pendingCanPlayHandler && audioPlayer) {
        audioPlayer.removeEventListener('canplay', pendingCanPlayHandler);
        pendingCanPlayHandler = null;
    }
}

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
    if (!track) return;
    const title = track.title || 'Sconosciuto';
    const artist = (track.artist && track.artist !== 'Locale') ? track.artist : 'BlasMusic';
    try {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title, artist, album: 'BlasMusicPlayer',
                artwork: coverSrc ? [{ src: coverSrc, sizes: '512x512', type: 'image/jpeg' }] : []
            });
        }
        window.AndroidMediaBridge?.updateMetadata(title, artist, 'BlasMusicPlayer', 0);
    } catch (_) {}
}

// Ripulisce lo stato audio e visivo quando la coda resta vuota (es. tutti i brani assenti)
export function clearLoadedTrack(audioPlayer) {
    clearPendingCanPlay(audioPlayer);
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load();
    }
    pl.setCoverUrl(null);
    resetTrackDisplay();
}

export async function loadTrack(audioPlayer, index, autoPlay, renderUICallback) {
    if (pl.currentPlaylist.length === 0) return;
    clearPendingCanPlay(audioPlayer);
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
    renderTrackDisplay(track, coverSrc);

    if (autoPlay) {
        initAudio(audioPlayer).then(() => ensureAudioRunning()).catch(() => {});
        const p = audioPlayer.play();
        if (p !== undefined) {
            p.then(() => setPlayIcons(true)).catch((err) => {
                console.warn("Riproduzione immediata in attesa:", err);
                pendingCanPlayHandler = async () => {
                    pendingCanPlayHandler = null;
                    await ensureAudioRunning();
                    audioPlayer.play().then(() => setPlayIcons(true)).catch(e => console.warn("Retry play:", e));
                };
                audioPlayer.addEventListener('canplay', pendingCanPlayHandler, { once: true });
            });
        }
    } else {
        setPlayIcons(false);
    }

    if (renderUICallback) renderUICallback();
}
