#ifndef FLAC_STREAM_H
#define FLAC_STREAM_H

#include "raylib.h"
#include <string>
#include <atomic>
#include <mutex>

/**
 * @file FlacStream.h
 * @brief Decoder e streamer audio multi-thread dedicato al formato FLAC.
 * 
 * Sfrutta il callback hardware nativo di Raylib (SetAudioStreamCallback)
 * per decodificare i blocchi PCM direttamente nel thread audio, eliminando
 * totalmente stuttering, scatti e cali di pitch dovuti al frame-rate della GUI.
 */
class FlacStream {
public:
    FlacStream();
    ~FlacStream();

    bool Open(const std::string& filePath);
    void Close();

    void Play();
    void Pause();
    void Stop();
    void Update();

    void Seek(float positionSeconds);
    void SetVolume(float volume);

    bool IsLoaded() const { return isLoaded.load(); }
    bool IsPlaying() const { return isLoaded.load() && isPlaying.load() && !isPaused.load(); }
    float GetTimePlayed() const;
    float GetTimeLength() const;

    // Funzione chiamata dal thread audio hardware ad alta priorità
    void FeedAudio(void* bufferData, unsigned int frames);

private:
    void* pFlacInternal;            // Puntatore opaco alla struttura drflac
    AudioStream stream;             // Flusso audio hardware Raylib
    unsigned int channels;          // Numero di canali (1 mono, 2 stereo)
    unsigned int sampleRate;        // Frequenza campionamento originale
    std::atomic<bool> isLoaded;     // Flag thread-safe stato caricamento
    std::atomic<bool> isPlaying;    // Flag thread-safe stato riproduzione
    std::atomic<bool> isPaused;     // Flag thread-safe stato pausa
    float currentVolume;            // Volume corrente
    mutable std::mutex audioMutex;  // Mutex per sincronizzazione con thread audio
};

#endif // FLAC_STREAM_H
