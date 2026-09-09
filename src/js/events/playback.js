import { safeSetClick, safeSetInput } from '../utils/helpers.js';
import * as audioEngine from '../core/audioEngine.js';
import * as pl from '../data/playlist.js';

export function setupPlaybackControls(audioPlayer, loadTrackCallback, renderUICallback) {
    const handlePlayPause = async () => {
        if (!audioEngine.audioContext) await audioEngine.initAudio(audioPlayer);
        
        const playIcon = document.getElementById('playPauseIcon');
        const playIconBottom = document.getElementById('playPauseIconBottom');
        
        if (audioPlayer.paused) { 
            audioPlayer.play(); 
            pl.setPlaying(true); 
            if (playIcon) playIcon.classList.replace('fa-play', 'fa-pause');
            if (playIconBottom) playIconBottom.classList.replace('fa-play', 'fa-pause');
        } else { 
            audioPlayer.pause(); 
            pl.setPlaying(false); 
            if (playIcon) playIcon.classList.replace('fa-pause', 'fa-play');
            if (playIconBottom) playIconBottom.classList.replace('fa-pause', 'fa-play');
        }
        if (renderUICallback) renderUICallback();
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
}
