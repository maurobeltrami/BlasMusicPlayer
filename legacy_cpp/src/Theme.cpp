#include "Theme.h"
#include <filesystem>

namespace Theme {
    Color BgMain           = { 18, 18, 18, 255 };
    Color CardBg           = { 24, 24, 24, 255 };
    Color CardHover        = { 40, 40, 40, 255 };
    Color BorderColor      = { 40, 40, 40, 255 };
    Color AccentPrimary    = { 29, 185, 84, 255 };
    Color AccentHover      = { 30, 215, 96, 255 };
    Color TextMain         = { 255, 255, 255, 255 };
    Color TextMuted        = { 179, 179, 179, 255 };
    Color TextDim          = { 115, 115, 115, 255 };
    Color SliderTrack      = { 50, 50, 50, 255 };
    Color AcidPink         = { 255, 0, 128, 255 };
    Color AcidBlue         = { 0, 200, 255, 255 };

    static ThemeMode currentMode = ThemeMode::MODERN_DARK;
    static Font mainFont{};
    static bool fontLoaded = false;

    void SetMode(ThemeMode mode) {
        currentMode = mode;
        if (mode == ThemeMode::MODERN_DARK) {
            BgMain = { 18, 18, 18, 255 };
            CardBg = { 24, 24, 24, 255 };
            CardHover = { 38, 38, 38, 255 };
            BorderColor = { 40, 40, 40, 255 };
            AccentPrimary = { 29, 185, 84, 255 };
            AccentHover = { 30, 215, 96, 255 };
            TextMain = { 255, 255, 255, 255 };
            TextMuted = { 179, 179, 179, 255 };
            TextDim = { 115, 115, 115, 255 };
            SliderTrack = { 50, 50, 50, 255 };
        } else {
            BgMain = { 22, 22, 22, 255 };
            CardBg = { 14, 14, 14, 255 };
            CardHover = { 32, 32, 32, 255 };
            BorderColor = { 204, 255, 0, 255 }; // Verde acido
            AccentPrimary = { 204, 255, 0, 255 };
            AccentHover = { 255, 0, 128, 255 }; // Rosa acido
            TextMain = { 255, 255, 255, 255 };
            TextMuted = { 204, 255, 0, 255 };
            TextDim = { 0, 200, 255, 255 };
            SliderTrack = { 45, 45, 45, 255 };
        }
    }

    void ToggleMode() {
        SetMode(currentMode == ThemeMode::MODERN_DARK ? ThemeMode::PUNK : ThemeMode::MODERN_DARK);
    }

    ThemeMode GetMode() { return currentMode; }
    const char* GetModeName() { return currentMode == ThemeMode::MODERN_DARK ? "MODERN" : "PUNK"; }

    void Init(const char* fontPath) {
        if (fontPath && std::filesystem::exists(fontPath)) {
            mainFont = LoadFontEx(fontPath, 48, nullptr, 250);
            SetTextureFilter(mainFont.texture, TEXTURE_FILTER_BILINEAR);
            fontLoaded = true;
        }
        SetMode(ThemeMode::MODERN_DARK);
    }

    void Unload() {
        if (fontLoaded) {
            UnloadFont(mainFont);
            fontLoaded = false;
        }
    }

    Font GetFont() { return mainFont; }

    void DrawText(const char* text, float x, float y, float fontSize, Color color) {
        if (fontLoaded) {
            DrawTextEx(mainFont, text, { x, y }, fontSize, 1.0f, color);
        } else {
            ::DrawText(text, (int)x, (int)y, (int)fontSize, color);
        }
    }

    int MeasureText(const char* text, float fontSize) {
        if (fontLoaded) {
            return (int)MeasureTextEx(mainFont, text, fontSize, 1.0f).x;
        }
        return ::MeasureText(text, (int)fontSize);
    }
}
