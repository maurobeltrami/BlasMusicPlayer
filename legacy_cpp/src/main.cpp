#include "raylib.h"
#include "Theme.h"
#include "AudioEngine.h"
#include "PlayerUI.h"
#include "Playlist.h"
#include "PlaylistUI.h"
#include "FileBrowser.h"

int main() {
    SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_VSYNC_HINT);
    InitWindow(Theme::WindowWidth, Theme::WindowHeight, "BlasMusicPlayer - Local-First Music Experience");
    SetTargetFPS(60);
    SetWindowFocused();

    Theme::Init("assets/fonts/Inter.ttf");

    AudioEngine audioEngine;
    audioEngine.Initialize();
    PlayerUI playerUI;
    Playlist playlist;
    PlaylistUI playlistUI;
    FileBrowser fileBrowser;

    enum class SidebarTab { BROWSER, QUEUE };
    SidebarTab currentTab = SidebarTab::BROWSER;

    auto PlayCurrent = [&]() {
        const TrackInfo* t = playlist.GetCurrentTrack();
        if (t) audioEngine.LoadTrack(t->filePath);
    };

    while (!WindowShouldClose()) {
        float dt = GetFrameTime();
        Vector2 mouse = GetMousePosition();
        bool anyHover = false;

        // 1. Drag & Drop
        if (IsFileDropped()) {
            FilePathList dropped = LoadDroppedFiles();
            int added = 0;
            for (unsigned int i = 0; i < dropped.count; i++) added += playlist.AddFromPath(dropped.paths[i]);
            UnloadDroppedFiles(dropped);
            if (added > 0) {
                if (!audioEngine.IsLoaded()) PlayCurrent();
                currentTab = SidebarTab::QUEUE;
                playerUI.ShowNotification("✅ Aggiunti " + std::to_string(added) + " brani alla coda", Theme::AccentPrimary);
            }
        }

        // 2. Richiesta demo
        if (playerUI.WasDemoRequested()) {
            playerUI.ResetDemoRequest();
            playlist.AddTrack("assets/sample.wav");
            PlayCurrent();
            playerUI.ShowNotification("🎵 Brano demo aggiunto in coda!", Theme::AccentPrimary);
        }

        // 3. Navigazione & Auto-play
        bool next = playerUI.WasNextRequested() || IsKeyPressed(KEY_RIGHT);
        bool prev = playerUI.WasPrevRequested() || IsKeyPressed(KEY_LEFT);
        playerUI.ResetNavRequests();
        if ((next || audioEngine.HasTrackFinished()) && playlist.Next()) PlayCurrent();
        if (prev && playlist.Previous()) PlayCurrent();

        // 4. Scorciatoie tastiera
        if (IsKeyPressed(KEY_SPACE)) {
            if (!audioEngine.IsLoaded()) PlayCurrent(); else audioEngine.TogglePlayPause();
        }
        if (IsKeyDown(KEY_UP))   audioEngine.SetVolume(audioEngine.GetVolume() + 0.01f);
        if (IsKeyDown(KEY_DOWN)) audioEngine.SetVolume(audioEngine.GetVolume() - 0.01f);

        // 5. Update
        audioEngine.Update();
        playerUI.Update(dt);

        // 6. Rendering
        BeginDrawing();
        ClearBackground(Theme::BgMain);
        const int w = GetScreenWidth(), h = GetScreenHeight();

        // Sidebar Tabs
        Rectangle t1 = { 0, 56, 140, 32 }, t2 = { 140, 56, 140, 32 };
        bool h1 = CheckCollisionPointRec(mouse, t1), h2 = CheckCollisionPointRec(mouse, t2);
        if (h1 || h2) anyHover = true;

        DrawRectangleRec(t1, currentTab == SidebarTab::BROWSER ? Theme::CardHover : Theme::BgMain);
        Theme::DrawText("📁 CARTELLE", 22, 65, 12, currentTab == SidebarTab::BROWSER ? Theme::AccentPrimary : Theme::TextMuted);
        if (h1 && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) currentTab = SidebarTab::BROWSER;

        DrawRectangleRec(t2, currentTab == SidebarTab::QUEUE ? Theme::CardHover : Theme::BgMain);
        std::string qTitle = "📜 CODA (" + std::to_string(playlist.GetCount()) + ")";
        Theme::DrawText(qTitle.c_str(), 160, 65, 12, currentTab == SidebarTab::QUEUE ? Theme::AccentPrimary : Theme::TextMuted);
        if (h2 && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) currentTab = SidebarTab::QUEUE;
        DrawLine(0, 88, 280, 88, Theme::BorderColor);

        // Sidebar Content
        Rectangle contentRec = { 0, 88, 280, (float)(h - 88 - 56) };
        if (currentTab == SidebarTab::BROWSER) {
            std::string picked = fileBrowser.Draw(contentRec, mouse, &anyHover);
            if (!picked.empty()) {
                playlist.AddTrack(picked);
                playlist.Select((int)playlist.GetCount() - 1);
                audioEngine.LoadTrack(picked);
                playerUI.ShowNotification("✅ In riproduzione: " + audioEngine.GetCurrentTitle(), Theme::AccentPrimary);
            }
            if (fileBrowser.WasFolderQueueRequested()) {
                fileBrowser.ResetFolderQueueRequest();
                int cnt = playlist.AddFromPath(fileBrowser.GetCurrentPath());
                if (!audioEngine.IsLoaded()) PlayCurrent();
                currentTab = SidebarTab::QUEUE;
                playerUI.ShowNotification("✅ Aggiunti " + std::to_string(cnt) + " brani", Theme::AccentPrimary);
            }
        } else {
            int clicked = playlistUI.Draw(playlist, contentRec, mouse, &anyHover);
            if (clicked != -1 && playlist.Select(clicked)) PlayCurrent();
        }

        playerUI.Draw(audioEngine, w, h);
        EndDrawing();
    }

    audioEngine.Shutdown();
    Theme::Unload();
    CloseWindow();
    return 0;
}
