#include "Playlist.h"
#include <filesystem>
#include <algorithm>

namespace fs = std::filesystem;

Playlist::Playlist() : currentIndex(-1) {}

bool Playlist::IsSupportedFormat(const std::string& ext) {
    std::string lower = ext;
    for (auto& c : lower) c = tolower(c);
    return (lower == ".mp3" || lower == ".wav" || lower == ".flac" || lower == ".ogg");
}

bool Playlist::AddTrack(const std::string& filePath) {
    if (!fs::exists(filePath) || fs::is_directory(filePath)) return false;
    std::string ext = fs::path(filePath).extension().string();
    if (!IsSupportedFormat(ext)) return false;

    TrackInfo info;
    info.filePath = filePath;
    info.title = fs::path(filePath).stem().string();
    tracks.push_back(info);

    if (currentIndex == -1) currentIndex = 0;
    return true;
}

int Playlist::AddFromPath(const std::string& pathOrFolder) {
    if (!fs::exists(pathOrFolder)) return 0;
    int count = 0;

    if (fs::is_directory(pathOrFolder)) {
        // Esplorazione ricorsiva di cartelle e sottocartelle
        for (const auto& entry : fs::recursive_directory_iterator(pathOrFolder)) {
            if (entry.is_regular_file() && AddTrack(entry.path().string())) {
                count++;
            }
        }
    } else {
        if (AddTrack(pathOrFolder)) count = 1;
    }
    return count;
}

void Playlist::Clear() {
    tracks.clear();
    currentIndex = -1;
}

bool Playlist::Next() {
    if (tracks.empty()) return false;
    currentIndex = (currentIndex + 1) % (int)tracks.size();
    return true;
}

bool Playlist::Previous() {
    if (tracks.empty()) return false;
    currentIndex = (currentIndex - 1 + (int)tracks.size()) % (int)tracks.size();
    return true;
}

bool Playlist::Select(int index) {
    if (index >= 0 && index < (int)tracks.size()) {
        currentIndex = index;
        return true;
    }
    return false;
}

const TrackInfo* Playlist::GetCurrentTrack() const {
    if (currentIndex >= 0 && currentIndex < (int)tracks.size()) {
        return &tracks[currentIndex];
    }
    return nullptr;
}

bool Playlist::HasNext() const {
    return !tracks.empty() && (currentIndex + 1 < (int)tracks.size());
}

bool Playlist::HasPrevious() const {
    return !tracks.empty() && (currentIndex > 0);
}
