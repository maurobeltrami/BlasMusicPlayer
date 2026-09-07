#include "PlayerUI.h"
#include "AudioEngine.h"
#include "Theme.h"
#include <algorithm>

PlayerUI::PlayerUI()
    : notificationMessage(""), notificationColor(WHITE), notificationTimer(0.0f),
      demoRequested(false), nextRequested(false), prevRequested(false),
      themeToggleRequested(false), isVolumeDragging(false) {}

void PlayerUI::Update(float dt) {
    if (notificationTimer > 0.0f) notificationTimer -= dt;
    visualizer.Update(dt);
}

void PlayerUI::ShowNotification(const std::string& msg, Color col) {
    notificationMessage = msg; notificationColor = col; notificationTimer = 3.5f;
}

bool PlayerUI::DrawButton(Rectangle rec, const char* text, Color bg, Color hov, Color fg, Vector2 m, float sz, bool* h) {
    bool isH = CheckCollisionPointRec(m, rec);
    if (isH && h) *h = true;
    DrawRectangleRounded(rec, 0.25f, 6, isH ? hov : bg);
    DrawRectangleRoundedLinesEx(rec, 0.25f, 6, 1.2f, isH ? Theme::AccentPrimary : Theme::BorderColor);
    int tw = Theme::MeasureText(text, sz);
    Theme::DrawText(text, rec.x + rec.width/2 - tw/2, rec.y + rec.height/2 - sz/2, sz, fg);
    return isH && IsMouseButtonPressed(MOUSE_BUTTON_LEFT);
}

bool PlayerUI::DrawCircleButton(Vector2 c, float r, const char* ic, Color bg, Color hov, Color fg, Vector2 m, bool* h) {
    bool isH = CheckCollisionPointCircle(m, c, r);
    if (isH && h) *h = true;
    DrawCircleV(c, r, isH ? hov : bg);
    DrawCircleLines((int)c.x, (int)c.y, r, isH ? Theme::AccentHover : Theme::BorderColor);
    int tw = Theme::MeasureText(ic, r * 0.9f);
    Theme::DrawText(ic, c.x - tw/2, c.y - (r * 0.45f), r * 0.9f, fg);
    return isH && IsMouseButtonPressed(MOUSE_BUTTON_LEFT);
}

void PlayerUI::DrawVolumeSlider(AudioEngine& audio, Rectangle rec, Vector2 m, bool* h) {
    Rectangle hit = { rec.x, rec.y - 6, rec.width, rec.height + 12 };
    bool isH = CheckCollisionPointRec(m, hit);
    if (isH && h) *h = true;

    if (isH && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) isVolumeDragging = true;
    if (isVolumeDragging) {
        if (h) *h = true;
        if (IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
            float val = std::clamp((m.x - rec.x) / rec.width, 0.0f, 1.0f);
            audio.SetVolume(val);
        } else isVolumeDragging = false;
    }

    DrawRectangleRounded(rec, 0.5f, 4, Theme::SliderTrack);
    float vol = audio.GetVolume();
    if (vol > 0.0f) {
        Rectangle fill = { rec.x, rec.y, rec.width * vol, rec.height };
        DrawRectangleRounded(fill, 0.5f, 4, isH ? Theme::AccentHover : Theme::AccentPrimary);
    }
    Vector2 thumb = { rec.x + rec.width * vol, rec.y + rec.height / 2.0f };
    DrawCircleV(thumb, (isH || isVolumeDragging) ? 6.0f : 4.0f, Theme::TextMain);

    std::string vStr = std::to_string((int)(vol * 100)) + "%";
    Theme::DrawText(vStr.c_str(), rec.x + rec.width + 8, rec.y - 4, 12, Theme::TextMuted);
}

void PlayerUI::Draw(AudioEngine& audio, int w, int h) {
    Vector2 mouse = GetMousePosition();
    bool anyHover = false;

    // 1. Top Navbar
    DrawRectangle(0, 0, w, 56, Theme::CardBg);
    DrawLine(0, 56, w, 56, Theme::BorderColor);
    Theme::DrawText("BLASMUSIC", 24, 16, 20, Theme::AccentPrimary);
    Theme::DrawText("LOCAL-FIRST AUDIO", 160, 20, 13, Theme::TextDim);

    std::string tBtn = std::string("TEMA: ") + Theme::GetModeName();
    if (DrawButton({ (float)w - 140, 14, 120, 28 }, tBtn.c_str(), Theme::BgMain, Theme::CardHover, Theme::TextMain, mouse, 12, &anyHover)) {
        Theme::ToggleMode();
        themeToggleRequested = true;
    }

    // 2. Display Screen centrale
    float areaX = 280.0f, areaW = (float)w - areaX;
    Rectangle card = { areaX + (areaW - 540.0f)/2.0f, 74, 540, 460 };
    DrawRectangleRounded(card, 0.03f, 8, Theme::CardBg);
    DrawRectangleRoundedLinesEx(card, 0.03f, 8, 1.2f, Theme::BorderColor);

    std::string title = audio.IsLoaded() ? audio.GetCurrentTitle() : "NESSUN BRANO SELEZIONATO";
    int tw = Theme::MeasureText(title.c_str(), 18);
    Theme::DrawText(title.c_str(), card.x + card.width/2 - tw/2, card.y + 16, 18, Theme::TextMain);

    const char* st = audio.IsPlaying() ? "IN RIPRODUZIONE" : (audio.IsLoaded() ? "IN PAUSA" : "TRASCINA MUSICA QUI");
    Color stCol = audio.IsPlaying() ? Theme::AccentPrimary : Theme::TextDim;
    Theme::DrawText(st, card.x + card.width/2 - Theme::MeasureText(st, 12)/2, card.y + 42, 12, stCol);

    // Contenitore Visualizzatore
    Rectangle vizRec = { card.x + 20, card.y + 68, card.width - 40, 290 };
    visualizer.Draw(vizRec, audio.IsPlaying());

    std::string vizBtn = std::string("MODO: ") + visualizer.GetTypeName();
    if (DrawButton({ vizRec.x + vizRec.width - 150, vizRec.y + 8, 142, 24 }, vizBtn.c_str(), { 0, 0, 0, 180 }, Theme::CardHover, Theme::TextMain, mouse, 11, &anyHover)) {
        visualizer.NextType();
    }

    // Seek Bar interna alla card
    Rectangle seekRec = { card.x + 60, card.y + 380, card.width - 120, 6 };
    seekBar.Draw(audio, seekRec, mouse, &anyHover);

    // 3. Controlli Audio Centrali
    float ctrY = card.y + 422;
    if (DrawCircleButton({ card.x + card.width/2 - 50, ctrY }, 16, "|<", Theme::CardHover, Theme::TextMain, Theme::TextMain, mouse, &anyHover)) prevRequested = true;
    
    const char* pIcon = audio.IsPlaying() ? "||" : ">";
    if (DrawCircleButton({ card.x + card.width/2, ctrY }, 22, pIcon, Theme::AccentPrimary, Theme::AccentHover, Theme::BgMain, mouse, &anyHover)) {
        if (!audio.IsLoaded()) demoRequested = true; else audio.TogglePlayPause();
    }
    if (DrawCircleButton({ card.x + card.width/2 + 50, ctrY }, 16, ">|", Theme::CardHover, Theme::TextMain, Theme::TextMain, mouse, &anyHover)) nextRequested = true;

    // 4. Barra Inferiore con scorciatoie e Volume Continuo
    DrawRectangle(0, h - 56, w, 56, Theme::CardBg);
    DrawLine(0, h - 56, w, 56, Theme::BorderColor);
    Theme::DrawText("[SPAZIO] Play/Pausa | [FRECCE] Navigazione/Volume", 24, h - 34, 12, Theme::TextDim);

    Theme::DrawText("VOL", w - 210, h - 34, 12, Theme::TextMuted);
    DrawVolumeSlider(audio, { (float)w - 170, (float)h - 30, 100, 6 }, mouse, &anyHover);

    // 5. Notifiche Toast
    if (notificationTimer > 0.0f) {
        int nw = Theme::MeasureText(notificationMessage.c_str(), 14);
        Rectangle notif = { (float)w/2 - nw/2 - 16, 64, (float)nw + 32, 32 };
        DrawRectangleRounded(notif, 0.4f, 6, Theme::CardHover);
        DrawRectangleRoundedLinesEx(notif, 0.4f, 6, 1.2f, notificationColor);
        Theme::DrawText(notificationMessage.c_str(), notif.x + 16, notif.y + 8, 14, notificationColor);
    }

    SetMouseCursor(anyHover ? MOUSE_CURSOR_POINTING_HAND : MOUSE_CURSOR_DEFAULT);
}
