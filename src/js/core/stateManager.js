// core/stateManager.js - Gestione della persistenza locale e nativa di BlasMusicPlayer
let state = {
    last_folder: null,
    saved_playlists: [],
    current_queue: [],
    current_track_index: 0
};

export async function initAppState() {
    try {
        if (window.__TAURI__?.core) {
            const nativeState = await window.__TAURI__.core.invoke('load_app_state');
            if (nativeState && typeof nativeState === 'object') {
                state = {
                    last_folder: nativeState.last_folder || null,
                    saved_playlists: Array.isArray(nativeState.saved_playlists) ? nativeState.saved_playlists : [],
                    current_queue: Array.isArray(nativeState.current_queue) ? nativeState.current_queue : [],
                    current_track_index: typeof nativeState.current_track_index === 'number' ? nativeState.current_track_index : 0
                };
                localStorage.setItem('blas_app_state', JSON.stringify(state));
                return state;
            }
        }
    } catch (e) {
        console.warn('Impossibile caricare stato nativo, fallback su localStorage:', e);
    }

    try {
        const raw = localStorage.getItem('blas_app_state');
        if (raw) {
            const parsed = JSON.parse(raw);
            state = { ...state, ...parsed };
            return state;
        }
        const legacyPlaylists = localStorage.getItem('blas_playlists');
        if (legacyPlaylists) {
            state.saved_playlists = JSON.parse(legacyPlaylists);
        }
    } catch (e) {
        console.error('Errore caricamento stato da localStorage:', e);
    }
    return state;
}

export async function saveAppState(partial = {}) {
    state = { ...state, ...partial };
    try {
        localStorage.setItem('blas_app_state', JSON.stringify(state));
        localStorage.setItem('blas_playlists', JSON.stringify(state.saved_playlists));
    } catch (e) {
        console.error('Errore salvataggio localStorage:', e);
    }

    if (window.__TAURI__?.core) {
        try {
            await window.__TAURI__.core.invoke('save_app_state', { state });
        } catch (e) {
            console.error('Errore salvataggio nativo:', e);
        }
    }
    return state;
}

export function getState() {
    return state;
}

export function getLastFolder() {
    return state.last_folder;
}

export async function setLastFolder(folder) {
    if (!folder || folder === state.last_folder) return;
    return await saveAppState({ last_folder: folder });
}

export function getSavedPlaylists() {
    return state.saved_playlists || [];
}

export async function savePlaylist(name, tracks) {
    const playlists = [...(state.saved_playlists || [])];
    const idx = playlists.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
        playlists[idx].tracks = [...tracks];
    } else {
        playlists.push({ id: Date.now(), name, tracks: [...tracks] });
    }
    await saveAppState({ saved_playlists: playlists });
    return { ok: true };
}

export async function deletePlaylist(name) {
    const playlists = (state.saved_playlists || []).filter(p => p.name !== name && p.id !== name);
    await saveAppState({ saved_playlists: playlists });
    return { ok: true };
}

export async function saveQueueState(queue, trackIndex) {
    return await saveAppState({
        current_queue: [...queue],
        current_track_index: trackIndex
    });
}
