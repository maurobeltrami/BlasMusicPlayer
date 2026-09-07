import { safeSetInput } from '../utils/helpers.js';
import * as audioEngine from '../core/audioEngine.js';

export function setupEqualizer() {
    console.log("Equalizer module initialized.");

    // Volume Slider (Sync with others)
    safeSetInput('eqVolumeSlider', (e) => {
        const val = parseFloat(e.target.value);
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) audioPlayer.volume = val;
        audioEngine.setVolume(val);

        // Sync with bottom and main volume sliders
        const vol1 = document.getElementById('volumeSlider');
        const vol2 = document.getElementById('volumeSliderBottom');
        if (vol1 && vol1 !== e.target) vol1.value = val;
        if (vol2 && vol2 !== e.target) vol2.value = val;
    });

    // EQ Bands
    const bands = [
        { id: 'eqLowSlider', valId: 'eqLowVal', bandType: 'low' },
        { id: 'eqMidSlider', valId: 'eqMidVal', bandType: 'mid' },
        { id: 'eqHighSlider', valId: 'eqHighVal', bandType: 'high' }
    ];

    bands.forEach(b => {
        safeSetInput(b.id, (e) => {
            const v = parseFloat(e.target.value);
            const valEl = document.getElementById(b.valId);
            if (valEl) valEl.textContent = `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`;
            audioEngine.updateEQ(b.bandType, v);
        });
    });

    // Compressor Controls (Moved from Home)
    safeSetInput('thresholdSlider', (e) => {
        const val = parseFloat(e.target.value);
        const l = document.getElementById('thresholdVal');
        if (l) l.textContent = val.toFixed(1);
        audioEngine.updateCompressor('threshold', val);
    });

    safeSetInput('ratioSlider', (e) => {
        const val = parseFloat(e.target.value);
        const l = document.getElementById('ratioVal');
        if (l) l.textContent = val.toFixed(1);
        audioEngine.updateCompressor('ratio', val);
    });

    // Bass Boost Button
    const bbBtn = document.getElementById('bassBoostBtn');
    if (bbBtn) {
        bbBtn.addEventListener('click', () => {
            const active = audioEngine.toggleBassBoost();
            bbBtn.textContent = `BASS BOOST: ${active ? 'ON' : 'OFF'}`;
            if (active) {
                bbBtn.classList.replace('bg-black', 'bg-theme-accent');
                bbBtn.classList.replace('text-theme-text', 'text-white');
            } else {
                bbBtn.classList.replace('bg-theme-accent', 'bg-black');
                bbBtn.classList.replace('text-white', 'text-theme-text');
            }
        });
    }
}
