# ==============================================================================
# MAKEFILE - BlasMusicPlayer (Nativo C++17 + Raylib 6.0)
# ==============================================================================

CXX = clang++
CXXFLAGS = -std=c++17 -Wall -Wextra -Iinclude -I/opt/homebrew/include
LDFLAGS = -L/opt/homebrew/lib -lraylib -framework OpenGL -framework Cocoa -framework IOKit -framework CoreVideo

SRCS = src/Theme.cpp src/VisualizerUI.cpp src/AudioEngine.cpp src/FlacStream.cpp src/SeekBar.cpp src/PlayerUI.cpp src/Playlist.cpp src/PlaylistUI.cpp src/FileBrowser.cpp src/main.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = blasmusicplayer

all: $(TARGET)

$(TARGET): $(OBJS)
	@echo "🛠️ Collegamento finale dell'eseguibile BlasMusicPlayer..."
	$(CXX) $(OBJS) -o $(TARGET) $(LDFLAGS)
	@echo "✅ Compilazione completata con successo! Avvia con: ./$(TARGET)"

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	@echo "🧹 Pulizia dei file oggetto e binari..."
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean
