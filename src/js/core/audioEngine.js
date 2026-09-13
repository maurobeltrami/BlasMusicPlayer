// audio-engine.js - Gestione Normalizzazione, Volume e Analizzatore
export let audioContext;
export let analyser;
export let compressor;
export let gainNode;
export let eqFilters = {};

let currentVolume = 0.75;

export function setVolume(val) {
    currentVolume = typeof val === 'number' ? Math.max(0, Math.min(1, val)) : 0.75;
    if (gainNode && audioContext) {
        gainNode.gain.setTargetAtTime(currentVolume, audioContext.currentTime, 0.02);
    }
}

export function getVolume() {
    return currentVolume;
}

export async function initAudio(audioElement) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        compressor = audioContext.createDynamicsCompressor();

        // Impostazioni iniziali compressore
        compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
        compressor.knee.setValueAtTime(30, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);

        // Creazione filtri EQ tramite funzione ausiliaria compatta
        const makeFilter = (type, freq, gain = 0, q = 1) => {
            const f = audioContext.createBiquadFilter();
            f.type = type; f.frequency.value = freq; f.gain.value = gain; f.Q.value = q;
            return f;
        };
        eqFilters.bassBoost = makeFilter('lowshelf', 80);
        eqFilters.low = makeFilter('lowshelf', 60);
        eqFilters.mid = makeFilter('peaking', 1000, 0, 1);
        eqFilters.high = makeFilter('highshelf', 10000);

        // Nodo Gain Master per il controllo del volume effettivo
        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);

        // Routing Chain: source -> analyser -> EQ -> compressor -> master gain -> destination
        source.connect(analyser);
        analyser.connect(eqFilters.bassBoost);
        eqFilters.bassBoost.connect(eqFilters.low);
        eqFilters.low.connect(eqFilters.mid);
        eqFilters.mid.connect(eqFilters.high);
        eqFilters.high.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }

        audioContext.onstatechange = () => {
            if (audioContext.state !== 'running') {
                console.info("Stato AudioContext variato:", audioContext.state);
            }
        };
    }

    if (audioContext.state !== 'running') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.warn("Ripristino AudioContext non riuscito in initAudio:", e);
        }
    }

    return { audioContext, analyser, compressor, gainNode };
}

/**
 * Assicura che l'AudioContext sia attivo e sincronizzato (es. dopo sleep/standby o cambio periferica)
 */
export async function ensureAudioRunning() {
    if (!audioContext) return;
    if (audioContext.state !== 'running') {
        try {
            await audioContext.resume();
            console.info("AudioContext riattivato con successo. Stato:", audioContext.state);
        } catch (e) {
            console.warn("Tentativo di riattivare AudioContext fallito:", e);
        }
    }
    if (gainNode && audioContext) {
        gainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);
    }
}

/**
 * Registra listener globali per intercettare il risveglio dallo standby e cambi visibilità finestra
 */
export function setupWakeupListeners() {
    const handleWake = () => {
        if (audioContext && audioContext.state !== 'running') {
            ensureAudioRunning();
        }
    };
    window.addEventListener('focus', handleWake);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleWake();
    });
    document.addEventListener('pointerdown', handleWake);
    document.addEventListener('keydown', handleWake);
}

/**
 * Aggiorna i parametri del compressore in tempo reale
 */
export function updateCompressor(param, value) {
    if (!compressor || !audioContext) return;
    compressor[param].setTargetAtTime(value, audioContext.currentTime, 0.1);
}

/**
 * Aggiorna i guadagni dell'equalizzatore
 */
export function updateEQ(band, gainValue) {
    if (!eqFilters[band] || !audioContext) return;
    eqFilters[band].gain.setTargetAtTime(gainValue, audioContext.currentTime, 0.1);
}

export let isBassBoostActive = false;
export function toggleBassBoost() {
    isBassBoostActive = !isBassBoostActive;
    if (eqFilters.bassBoost && audioContext) {
        const targetGain = isBassBoostActive ? 15 : 0;
        eqFilters.bassBoost.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.1);
    }
    return isBassBoostActive;
}