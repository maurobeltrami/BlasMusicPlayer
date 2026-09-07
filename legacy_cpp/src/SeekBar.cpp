#include "SeekBar.h"
#include "AudioEngine.h"
#include "Theme.h"
#include <algorithm>
#include <cstdio>

SeekBar::SeekBar() : isScrubbing(false), scrubTargetTime(0.0f) {}

std::string SeekBar::FormatTime(float seconds) {
    if (seconds < 0.0f) seconds = 0.0f;
    int totalSec = static_cast<int>(seconds);
    int m = totalSec / 60;
    int s = totalSec % 60;
    char buffer[16];
    std::snprintf(buffer, sizeof(buffer), "%02d:%02d", m, s);
    return std::string(buffer);
}

void SeekBar::Draw(AudioEngine& audio, Rectangle bounds, Vector2 mousePos, bool* anyHovered) {
    float totalTime = audio.GetTimeLength();
    float currentTime = audio.GetTimePlayed();

    Rectangle hitBox = { bounds.x, bounds.y - 6, bounds.width, bounds.height + 12 };
    bool hovered = CheckCollisionPointRec(mousePos, hitBox);
    if (hovered && anyHovered) *anyHovered = true;

    if (hovered && IsMouseButtonPressed(MOUSE_BUTTON_LEFT) && totalTime > 0.0f) {
        isScrubbing = true;
    }

    if (isScrubbing) {
        if (anyHovered) *anyHovered = true;
        if (IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
            float ratio = (mousePos.x - bounds.x) / bounds.width;
            scrubTargetTime = std::clamp(ratio, 0.0f, 1.0f) * totalTime;
        } else {
            isScrubbing = false;
            audio.Seek(scrubTargetTime);
        }
    }

    float displayTime = isScrubbing ? scrubTargetTime : currentTime;
    float progress = (totalTime > 0.0f) ? std::clamp(displayTime / totalTime, 0.0f, 1.0f) : 0.0f;

    // Timer a sinistra e destra
    std::string curText = FormatTime(displayTime);
    Theme::DrawText(curText.c_str(), bounds.x - 48, bounds.y - 6, 13, Theme::TextMuted);

    // Barra di sfondo
    DrawRectangleRounded(bounds, 0.5f, 4, Theme::SliderTrack);

    // Riempimento attivo
    float filledWidth = bounds.width * progress;
    if (filledWidth > 0.0f) {
        Rectangle fillRec = { bounds.x, bounds.y, filledWidth, bounds.height };
        Color greenCol = (hovered || isScrubbing) ? Theme::AccentHover : Theme::AccentPrimary;
        DrawRectangleRounded(fillRec, 0.5f, 4, greenCol);
    }

    // Pallino cursore (Thumb)
    if (hovered || isScrubbing) {
        Vector2 thumb = { bounds.x + filledWidth, bounds.y + bounds.height / 2.0f };
        DrawCircleV(thumb, 6.0f, Theme::TextMain);
        DrawCircleLines((int)thumb.x, (int)thumb.y, 6.0f, Theme::AccentPrimary);
    }

    std::string totalText = FormatTime(totalTime);
    Theme::DrawText(totalText.c_str(), bounds.x + bounds.width + 12, bounds.y - 6, 13, Theme::TextDim);
}
