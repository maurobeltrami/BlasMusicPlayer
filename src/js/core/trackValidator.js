// core/trackValidator.js - Validazione asincrona non-distruttiva dei brani in ingresso alla coda
import * as stateManager from './stateManager.js';

/**
 * Verifica l'esistenza fisica dei brani tramite il backend nativo Rust.
 * - Mantiene intatte le playlist salvate per i brani assenti (nessuna cancellazione dati).
 * - Se un brano e' stato spostato in un'altra cartella, applica il self-healing del nuovo path.
 * - Restituisce solo le tracce effettivamente disponibili per la riproduzione.
 */
export async function resolveTracksForQueue(tracks) {
    if (!Array.isArray(tracks) || tracks.length === 0) {
        return { tracks: [], mapOldToNew: new Map() };
    }
    if (!window.__TAURI__?.core) {
        return { tracks: [...tracks], mapOldToNew: new Map() };
    }

    try {
        const payload = tracks.map(t => ({
            path: t.path || '',
            cover: t.cover || null
        }));
        const lastFolder = stateManager.getLastFolder() || null;

        // Unica chiamata IPC batch verso Rust: Fase 1 (stat veloce) + Fase 2 (fallback mirato)
        const results = await window.__TAURI__.core.invoke('resolve_tracks_batch', {
            tracks: payload,
            lastFolder
        });

        if (!Array.isArray(results) || results.length !== tracks.length) {
            return { tracks: [...tracks], mapOldToNew: new Map() };
        }

        const validTracks = [];
        const relocatedMap = new Map();
        const mapOldToNew = new Map();

        for (let i = 0; i < tracks.length; i++) {
            const orig = tracks[i];
            const res = results[i];
            if (!res?.exists) continue;

            if (res.relocated && res.resolved_path) {
                const healedCover = res.resolved_cover ?? null;
                relocatedMap.set(orig.path, { path: res.resolved_path, cover: healedCover });
                mapOldToNew.set(orig.path, res.resolved_path);
                validTracks.push({ ...orig, path: res.resolved_path, cover: healedCover });
            } else {
                validTracks.push(orig);
            }
        }

        // Approccio 1 (Self-Healing): aggiorna i path ritrovati anche nelle playlist salvate
        if (relocatedMap.size > 0) {
            await stateManager.applySelfHealing(relocatedMap);
        }

        return { tracks: validTracks, mapOldToNew };
    } catch (err) {
        console.warn('Validazione batch tracce non riuscita, uso fallback diretto:', err);
        return { tracks: [...tracks], mapOldToNew: new Map() };
    }
}
