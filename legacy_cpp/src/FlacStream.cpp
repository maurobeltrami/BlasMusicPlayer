#define DR_FLAC_IMPLEMENTATION
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#pragma clang diagnostic ignored "-Wsign-compare"
#include "dr_flac.h"
#pragma clang diagnostic pop

#include "FlacStream.h"
#include <iostream>
#include <cstring>

inline drflac* AsFlac(void* ptr) { return static_cast<drflac*>(ptr); }

static FlacStream* s_activeFlacStream = nullptr;

static void FlacAudioCallback(void* bufferData, unsigned int frames) {
    if (s_activeFlacStream) s_activeFlacStream->FeedAudio(bufferData, frames);
}

FlacStream::FlacStream()
    : pFlacInternal(nullptr), stream{}, channels(2), sampleRate(44100),
      isLoaded(false), isPlaying(false), isPaused(false), currentVolume(0.8f) {}

FlacStream::~FlacStream() { Close(); }

bool FlacStream::Open(const std::string& filePath) {
    Close();
    drflac* flac = drflac_open_file(filePath.c_str(), nullptr);
    if (!flac) {
        std::cerr << "[FlacStream] Errore apertura FLAC: " << filePath << "\n";
        return false;
    }

    {
        std::lock_guard<std::mutex> lock(audioMutex);
        pFlacInternal = flac;
        channels = flac->channels;
        sampleRate = flac->sampleRate;
    }

    stream = LoadAudioStream(sampleRate, 16, channels);
    if (!IsAudioStreamValid(stream)) {
        std::cerr << "[FlacStream] Errore creazione AudioStream hardware!\n";
        drflac_close(flac);
        pFlacInternal = nullptr;
        return false;
    }

    s_activeFlacStream = this;
    SetAudioStreamCallback(stream, FlacAudioCallback);
    SetAudioStreamVolume(stream, currentVolume);
    PlayAudioStream(stream);

    isLoaded.store(true);
    isPlaying.store(true);
    isPaused.store(false);
    return true;
}

void FlacStream::Close() {
    if (isLoaded.load()) {
        isLoaded.store(false); isPlaying.store(false); isPaused.store(false);
        if (s_activeFlacStream == this) s_activeFlacStream = nullptr;
        StopAudioStream(stream);
        UnloadAudioStream(stream);
        std::lock_guard<std::mutex> lock(audioMutex);
        if (pFlacInternal) { drflac_close(AsFlac(pFlacInternal)); pFlacInternal = nullptr; }
    }
}

void FlacStream::Play() {
    if (isLoaded.load() && isPaused.load()) {
        ResumeAudioStream(stream);
        isPlaying.store(true); isPaused.store(false);
    }
}

void FlacStream::Pause() {
    if (isLoaded.load() && !isPaused.load()) {
        PauseAudioStream(stream);
        isPlaying.store(false); isPaused.store(true);
    }
}

void FlacStream::Stop() {
    if (isLoaded.load()) {
        PauseAudioStream(stream);
        isPlaying.store(false); isPaused.store(true);
        std::lock_guard<std::mutex> lock(audioMutex);
        if (pFlacInternal) drflac_seek_to_pcm_frame(AsFlac(pFlacInternal), 0);
    }
}

void FlacStream::Update() {
    // Sincronizzazione hardware automatica tramite AudioCallback
}

void FlacStream::Seek(float seconds) {
    std::lock_guard<std::mutex> lock(audioMutex);
    if (isLoaded.load() && pFlacInternal && sampleRate > 0) {
        drflac* flac = AsFlac(pFlacInternal);
        drflac_uint64 target = (drflac_uint64)(seconds * sampleRate);
        if (target >= flac->totalPCMFrameCount) target = flac->totalPCMFrameCount - 1;
        drflac_seek_to_pcm_frame(flac, target);
    }
}

void FlacStream::SetVolume(float vol) {
    currentVolume = (vol < 0.0f) ? 0.0f : (vol > 1.0f ? 1.0f : vol);
    if (isLoaded.load()) SetAudioStreamVolume(stream, currentVolume);
}

void FlacStream::FeedAudio(void* bufferData, unsigned int frames) {
    std::lock_guard<std::mutex> lock(audioMutex);
    if (!isLoaded.load() || isPaused.load() || !pFlacInternal) {
        std::memset(bufferData, 0, frames * channels * sizeof(short));
        return;
    }

    drflac* flac = AsFlac(pFlacInternal);
    drflac_int16* out = static_cast<drflac_int16*>(bufferData);
    drflac_uint64 read = drflac_read_pcm_frames_s16(flac, frames, out);

    if (read < frames) {
        drflac_seek_to_pcm_frame(flac, 0); // Loop a fine brano
        drflac_uint64 rem = frames - read;
        drflac_uint64 loopRead = drflac_read_pcm_frames_s16(flac, rem, out + (read * channels));
        if (loopRead < rem) {
            std::memset(out + ((read + loopRead) * channels), 0, (rem - loopRead) * channels * sizeof(short));
        }
    }
}

float FlacStream::GetTimePlayed() const {
    std::lock_guard<std::mutex> lock(audioMutex);
    if (!isLoaded.load() || !pFlacInternal || sampleRate == 0) return 0.0f;
    return (float)AsFlac(pFlacInternal)->currentPCMFrame / (float)sampleRate;
}

float FlacStream::GetTimeLength() const {
    std::lock_guard<std::mutex> lock(audioMutex);
    if (!isLoaded.load() || !pFlacInternal || sampleRate == 0) return 0.0f;
    return (float)AsFlac(pFlacInternal)->totalPCMFrameCount / (float)sampleRate;
}
