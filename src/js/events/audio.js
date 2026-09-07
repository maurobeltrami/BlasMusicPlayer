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

    audioPlayer.onended = () => {
        loadNextTrackCallback();
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
