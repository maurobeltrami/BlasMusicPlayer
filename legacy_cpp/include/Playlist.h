#ifndef PLAYLIST_H
#define PLAYLIST_H

#include <string>
#include <vector>

/**
 * @struct TrackInfo
 * @brief Informazioni di base su ciascuna traccia caricata in coda.
 */
struct TrackInfo {
    std::string filePath;
    std::string title;
};

/**
 * @file Playlist.h
 * @brief Gestore logico della coda dei brani e scansione delle cartelle.
 * 
 * Mantiene la lista ordinata dei brani in riproduzione, supporta l'avanzamento,
 * il riavvolgimento e la scansione ricorsiva di cartelle musicali.
 */
class Playlist {
public:
    Playlist();

    // Aggiunge un singolo file audio se supportato (MP3, WAV, FLAC, OGG)
    bool AddTrack(const std::string& filePath);

    // Scansiona ricorsivamente una cartella o aggiunge un file singolo
    int AddFromPath(const std::string& pathOrFolder);

    // Svuota l'intera playlist
    void Clear();

    // Navigazione tracce
    bool Next();
    bool Previous();
    bool Select(int index);

    // Getters di stato
    const TrackInfo* GetCurrentTrack() const;
    int GetCurrentIndex() const { return currentIndex; }
    size_t GetCount() const { return tracks.size(); }
    bool IsEmpty() const { return tracks.empty(); }
    const std::vector<TrackInfo>& GetTracks() const { return tracks; }

    bool HasNext() const;
    bool HasPrevious() const;

private:
    std::vector<TrackInfo> tracks;
    int currentIndex;

    static bool IsSupportedFormat(const std::string& ext);
};

#endif // PLAYLIST_H
