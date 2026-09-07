#include "VisualizerUI.h"
#include "Theme.h"
#include <cmath>
#include <cstdlib>

VisualizerUI::VisualizerUI() : type(VisualizerType::BARS), animTime(0.0f), vinylRotation(0.0f) {
    for (int i = 0; i < 32; i++) barHeights[i] = 10.0f;
}

void VisualizerUI::Update(float dt) {
    animTime += dt;
    vinylRotation += dt * 90.0f;
    if (vinylRotation >= 360.0f) vinylRotation -= 360.0f;
}

void VisualizerUI::NextType() {
    int next = (static_cast<int>(type) + 1) % 4;
    type = static_cast<VisualizerType>(next);
}

const char* VisualizerUI::GetTypeName() const {
    switch (type) {
        case VisualizerType::BARS:     return "BARRE SPETTRO";
        case VisualizerType::WAVEFORM: return "FORMA D'ONDA";
        case VisualizerType::CIRCLES:  return "ANELLI REATTIVI";
        case VisualizerType::VINYL:    return "DISCO VINILE";
    }
    return "VISUALIZER";
}

void VisualizerUI::Draw(Rectangle bounds, bool isPlaying) {
    DrawRectangleRounded(bounds, 0.04f, 6, { 10, 10, 10, 240 });
    DrawRectangleRoundedLinesEx(bounds, 0.04f, 6, 1.2f, Theme::BorderColor);

    switch (type) {
        case VisualizerType::BARS:     DrawBars(bounds, isPlaying); break;
        case VisualizerType::WAVEFORM: DrawWaveform(bounds, isPlaying); break;
        case VisualizerType::CIRCLES:  DrawCircles(bounds, isPlaying); break;
        case VisualizerType::VINYL:    DrawVinyl(bounds, isPlaying); break;
    }
}

void VisualizerUI::DrawBars(Rectangle b, bool isPlaying) {
    const int count = 28;
    float pad = 4.0f;
    float barW = (b.width - (count + 1) * pad) / count;
    float maxH = b.height - 30.0f;

    for (int i = 0; i < count; i++) {
        float target = 6.0f;
        if (isPlaying) {
            float s1 = std::sin(animTime * 4.0f + i * 0.4f);
            float s2 = std::cos(animTime * 6.5f + i * 0.7f);
            target = 10.0f + std::abs(s1 * 0.6f + s2 * 0.4f) * maxH;
        }
        barHeights[i] += (target - barHeights[i]) * 0.2f;

        float bx = b.x + pad + i * (barW + pad);
        float by = b.y + b.height - 15.0f - barHeights[i];
        Rectangle r = { bx, by, barW, barHeights[i] };
        Color col = (i % 2 == 0) ? Theme::AccentPrimary : Theme::AccentHover;
        DrawRectangleRounded(r, 0.4f, 4, col);
    }
}

void VisualizerUI::DrawWaveform(Rectangle b, bool isPlaying) {
    float midY = b.y + b.height / 2.0f;
    int points = 80;
    float step = b.width / (points - 1);
    Vector2 prev = { b.x, midY };

    for (int i = 1; i < points; i++) {
        float x = b.x + i * step;
        float amp = isPlaying ? 35.0f : 2.0f;
        float y = midY + std::sin(animTime * 5.0f + i * 0.25f) * amp * std::cos(i * 0.1f);
        Vector2 cur = { x, y };
        DrawLineEx(prev, cur, 2.5f, Theme::AccentPrimary);
        prev = cur;
    }
}

void VisualizerUI::DrawCircles(Rectangle b, bool isPlaying) {
    Vector2 center = { b.x + b.width / 2.0f, b.y + b.height / 2.0f };
    float baseR = 25.0f;
    for (int i = 1; i <= 4; i++) {
        float pulse = isPlaying ? std::sin(animTime * 3.5f - i * 0.6f) * 12.0f : 0.0f;
        float r = baseR * i + pulse;
        Color c = (i % 2 == 0) ? Theme::AccentPrimary : Theme::AccentHover;
        c.a = (unsigned char)(255 - i * 40);
        DrawCircleLines((int)center.x, (int)center.y, r, c);
    }
}

void VisualizerUI::DrawVinyl(Rectangle b, bool isPlaying) {
    Vector2 center = { b.x + b.width / 2.0f, b.y + b.height / 2.0f };
    float r = (b.height < b.width ? b.height : b.width) * 0.38f;
    DrawCircleV(center, r, { 18, 18, 18, 255 });
    DrawCircleLines((int)center.x, (int)center.y, r, Theme::BorderColor);
    DrawCircleLines((int)center.x, (int)center.y, r * 0.8f, { 45, 45, 45, 255 });
    DrawCircleLines((int)center.x, (int)center.y, r * 0.6f, { 45, 45, 45, 255 });
    DrawCircleV(center, r * 0.35f, Theme::AccentPrimary);
    DrawCircleV(center, 8.0f, Theme::BgMain);

    if (isPlaying) {
        float rad = vinylRotation * (3.14159f / 180.0f);
        Vector2 marker = { center.x + std::cos(rad) * (r * 0.22f), center.y + std::sin(rad) * (r * 0.22f) };
        DrawCircleV(marker, 4.0f, WHITE);
    }
}
