import { formatTime, getClientX } from '../utils/helpers.js';

export function setupAudioEvents(audioPlayer, loadNextTrackCallback) {
    audioPlayer.ontimeupdate = () => {
        const progressBar = document.getElementById('progressBar');
        const progressBarBottom = document.getElementById('progressBarBottom');
        const timeDisplay = document.getElementById('time-display');
        const timeDisplayBottom = document.getElementById('time-display-bottom');
        
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressBarBottom) progressBarBottom.style.width = `${percent}%`;
            
            const timeStr = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
            if (timeDisplay) timeDisplay.textContent = timeStr;
            if (timeDisplayBottom) timeDisplayBottom.textContent = timeStr;
        }
    };

    let errorStreak = 0;

    audioPlayer.onended = () => {
        errorStreak = 0;
        loadNextTrackCallback();
    };

    audioPlayer.onplaying = () => {
        errorStreak = 0;
    };

    audioPlayer.onerror = () => {
        // Ignora l'errore di abort (code 1) che si verifica al cambio normale di src
        if (audioPlayer.error?.code === 1) return;
        console.warn("Errore HTML5 Audio:", audioPlayer.error?.code, audioPlayer.error?.message);
        errorStreak++;
        if (errorStreak < 5) {
            setTimeout(() => {
                loadNextTrackCallback();
            }, 1000);
        }
    };

    const handleSeek = (e) => {
        if (e.cancelable) e.preventDefault();
        const el = document.getElementById('progressControl');
        if (!el) return;
        
        const rect = el.getBoundingClientRect();
        const clientX = getClientX(e);
        if (isNaN(clientX)) return;
        
        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        if (audioPlayer.duration) {
            audioPlayer.currentTime = (x / rect.width) * audioPlayer.duration;
        }
    };

    const progressEl = document.getElementById('progressControl');
    const progressElBottom = document.getElementById('progressControlBottom');
    
    [progressEl, progressElBottom].forEach(el => {
        if (el) {
            el.addEventListener('click', handleSeek);
            el.addEventListener('touchstart', handleSeek, { passive: false });
            el.addEventListener('touchmove', handleSeek, { passive: false });
        }
    });
}
