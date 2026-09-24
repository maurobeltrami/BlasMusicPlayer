import { safeSetClick, safeSetInput } from '../utils/helpers.js';
import * as audioEngine from '../core/audioEngine.js';
import * as pl from '../data/playlist.js';

export function setupPlaybackControls(audioPlayer, loadTrackCallback, renderUICallback) {
    const playIcon = document.getElementById('playPauseIcon');
    const playIconBottom = document.getElementById('playPauseIconBottom');

    const syncState = (playing) => {
        pl.setPlaying(playing);
        const [oldI, newI] = playing ? ['fa-play', 'fa-pause'] : ['fa-pause', 'fa-play'];
        if (playIcon) playIcon.classList.replace(oldI, newI);
        if (playIconBottom) playIconBottom.classList.replace(oldI, newI);
        try { window.AndroidMediaBridge?.updatePlaybackState(playing, Math.floor((audioPlayer.currentTime || 0) * 1000)); } catch (_) {}
        if (renderUICallback) renderUICallback();
    };

    const handlePlayPause = async () => {
        if (!audioEngine.audioContext) await audioEngine.initAudio(audioPlayer);
        await audioEngine.ensureAudioRunning();
        
        if (audioPlayer.paused) { 
            try {
                await audioPlayer.play();
            } catch (err) {
                console.warn("Riproduzione fallita, ritento dopo ripristino:", err);
                await audioEngine.ensureAudioRunning();
                await audioPlayer.play();
            }
            syncState(true);
        } else { 
            audioPlayer.pause(); 
            syncState(false);
        }
    };

    safeSetClick('playPauseBtn', handlePlayPause);
    safeSetClick('playPauseBtnBottom', handlePlayPause);

    safeSetClick('shuffleBtn', () => {
        pl.toggleShuffle();
        loadTrackCallback(0, pl.isPlaying);
    });

    const goNext = () => loadTrackCallback(pl.getNextTrackIndex(), true);
    const goPrev = () => loadTrackCallback(pl.getPrevTrackIndex(), true);

    safeSetClick('nextBtn', goNext);
    safeSetClick('nextBtnBottom', goNext);
    
    safeSetClick('prevBtn', goPrev);
    safeSetClick('prevBtnBottom', goPrev);

    // Controlli multimediali nativi per schermata di blocco Android / cuffie
    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.setActionHandler('play', handlePlayPause);
            navigator.mediaSession.setActionHandler('pause', handlePlayPause);
            navigator.mediaSession.setActionHandler('nexttrack', goNext);
            navigator.mediaSession.setActionHandler('previoustrack', goPrev);
        } catch (_) {}
    }

    // Ricezione comandi fisici al volante e da display Android Auto
    window.addEventListener('native-media-command', (e) => {
        const { action, arg } = e.detail || {};
        if (action === 'play' && audioPlayer.paused) handlePlayPause();
        else if (action === 'pause' && !audioPlayer.paused) handlePlayPause();
        else if (action === 'next') goNext();
        else if (action === 'prev') goPrev();
        else if (action === 'seek' && arg) audioPlayer.currentTime = parseFloat(arg) / 1000;
        else if (action === 'play_track' && arg) {
            const idx = pl.currentPlaylist.findIndex(t => t.path === arg);
            if (idx >= 0) {
                loadTrackCallback(idx, true);
            } else {
                const name = arg.split(/[\/\\]/).pop() || 'Traccia';
                pl.currentPlaylist.push({ title: name.replace(/\.[^/.]+$/, ''), path: arg, artist: '' });
                renderUICallback();
                loadTrackCallback(pl.currentPlaylist.length - 1, true);
            }
        }
    });

    let previousVolume = 0.75;

    const updateVolumeUI = (val) => {
        const vol1 = document.getElementById('volumeSlider');
        const vol2 = document.getElementById('volumeSliderBottom');
        const icon1 = document.getElementById('volumeIcon');
        const icon2 = document.getElementById('volumeIconBottom');

        if (vol1 && parseFloat(vol1.value) !== val) vol1.value = val;
        if (vol2 && parseFloat(vol2.value) !== val) vol2.value = val;

        const iconClass = val === 0 ? 'fa-volume-mute text-red-500' : (val < 0.5 ? 'fa-volume-down text-theme-text' : 'fa-volume-up text-theme-text');
        [icon1, icon2].forEach(icon => {
            if (icon) {
                icon.className = `fas ${iconClass} text-sm`;
            }
        });
    };

    const handleVolume = (e) => { 
        const val = parseFloat(e.target.value);
        audioPlayer.volume = val; 
        audioEngine.setVolume(val);
        if (val > 0) previousVolume = val;
        updateVolumeUI(val);
    };

    const toggleMute = () => {
        const current = audioEngine.getVolume();
        const next = current > 0 ? 0 : (previousVolume || 0.75);
        audioPlayer.volume = next;
        audioEngine.setVolume(next);
        updateVolumeUI(next);
    };

    safeSetInput('volumeSlider', handleVolume);
    safeSetInput('volumeSliderBottom', handleVolume);
    safeSetClick('muteToggleBtn', toggleMute);
    safeSetClick('muteToggleBtnBottom', toggleMute);

    // Scorciatoia da tastiera globale: barra spaziatrice per play/pause
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handlePlayPause();
        }
    });
}
