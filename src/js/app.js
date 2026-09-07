// app.js - Entrypoint principale dell'applicazione Tauri
import * as audioEngine from './core/audioEngine.js';
import * as vis from './ui/visualizer.js';
import * as pl from './data/playlist.js';
import * as mediaLoader from './core/mediaLoader.js';
import * as uiRenderer from './ui/playlistRenderer.js';
import * as stateManager from './core/stateManager.js';
import { setupRouter } from './ui/router.js';
import { initTheme } from './ui/themeManager.js';
import { setupAudioEvents } from './events/audio.js';
import { setupPlaybackControls } from './events/playback.js';
import { setupNavigation } from './events/navigation.js';
import { setupEqualizer } from './events/equalizer.js';
import { setupPlaylistsManager } from './events/playlistsManager.js';

window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    const initialState = await stateManager.initAppState();

    const audioPlayer = document.getElementById('audioPlayer');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas ? canvas.getContext('2d') : null;

    let plManager;
    const renderUICallback = () => {
        uiRenderer.updatePlaylistView(pl.currentPlaylist, pl.currentTrackIndex, pl.isPlaying, {
            playlistEl: document.getElementById('playlist'),
            nextBtn: document.getElementById('nextBtn'),
            prevBtn: document.getElementById('prevBtn'),
            shuffleBtn: document.getElementById('shuffleBtn')
        }, {
            onLoadTrack: (idx) => loadTrackCallback(idx, true),
            onRemoveTrack: (idx) => { pl.removeTrack(idx); renderUICallback(); },
            onAddToPlaylist: () => {},
            isShuffling: pl.isShuffling
        });
        const countEl = document.getElementById('playlistCount');
        if (countEl) countEl.textContent = pl.currentPlaylist.length;
        if (plManager?.refreshPlaylistsUI) plManager.refreshPlaylistsUI();
        stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
    };

    const loadTrackCallback = (index, autoPlay) => {
        mediaLoader.loadTrack(audioPlayer, index, autoPlay, renderUICallback);
    };

    const loadNextTrackCallback = () => {
        loadTrackCallback(pl.getNextTrackIndex(), true);
    };

    setupAudioEvents(audioPlayer, loadNextTrackCallback);
    setupPlaybackControls(audioPlayer, loadTrackCallback, renderUICallback);
    setupRouter();
    setupEqualizer();
    plManager = await setupPlaylistsManager(loadTrackCallback, renderUICallback);

    // Ripristino coda e traccia precedente all'avvio
    if (initialState?.current_queue?.length > 0) {
        pl.setPlaylists(initialState.current_queue);
        if (typeof initialState.current_track_index === 'number') {
            pl.setCurrentTrackIndex(initialState.current_track_index);
        }
        renderUICallback();
        loadTrackCallback(pl.currentTrackIndex, false);
    }

    await setupNavigation(loadTrackCallback, renderUICallback);

    // Resume AudioContext on any user interaction
    document.addEventListener('pointerdown', () => {
        if (audioEngine.audioContext?.state === 'suspended') audioEngine.audioContext.resume();
    }, { once: false });

    // Visualizer Loop a 60 FPS
    let frame = 0;
    const animate = () => {
        if (ctx && canvas) {
            const selector = document.getElementById('visualizerSelector');
            const type = selector ? selector.value : 'cover';
            vis.renderVisualizer(ctx, canvas, type, pl.isPlaying, frame++, audioEngine.analyser, pl.currentCoverUrl);
        }
        requestAnimationFrame(animate);
    };
    animate();

    // Drag & Drop nativo
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const f = e.dataTransfer.files[i];
                const rawName = f.name.replace(/\.[^/.]+$/, "");
                const parts = rawName.split(" - ");
                let title = rawName;
                let artist = "";
                if (parts.length >= 2) {
                    artist = parts[0].trim();
                    title = parts.slice(1).join(" - ").trim();
                }
                pl.currentPlaylist.push({
                    title,
                    path: f.path || f.name,
                    artist
                });
            }
            renderUICallback();
            if (!pl.isPlaying) loadTrackCallback(0, true);
        }
    });
});
