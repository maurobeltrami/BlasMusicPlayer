// utils/helpers.js

export const safeSetClick = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
export const safeSetInput = (id, fn) => { const el = document.getElementById(id); if (el) el.oninput = fn; };
export const safeSetChange = (id, fn) => { const el = document.getElementById(id); if (el) el.onchange = fn; };

export const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

export function getSecureRandomDouble() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
}

export function getClientX(e) {
    return e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
}
