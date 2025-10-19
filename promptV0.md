

**Project Title:** Banana Piano — 7-Note USB App (C++/CMake)

**Goal:** Build a cross-platform (Windows/macOS/Linux) desktop **C++** app that listens to a **USB CDC (virtual COM)** stream from an **STM32 NUCLEO-F767ZI** and plays **7 piano notes** (with switchable instruments and simple delay FX). The bananas are wired to an **MPR121** capacitive touch chip; the STM32 firmware sends small JSON events over serial like `{"e":N,"s":0/1}` where **e=0..6** (note index) and **s=1 press / 0 release**. The app must be low-latency and robust.

### Tech Stack (fixed)

* **Language:** C++17
* **Build:** CMake
* **Audio:** **SFML Audio** (`sf::SoundBuffer`, `sf::Sound`) for one-shot sample playback
* **Serial:** **Boost.Asio** `serial_port` to read the STM32’s COM/tty port
* **No external cloud APIs**. Offline, local audio.

### App Behavior

* On start, enumerate or accept a CLI arg for serial port (default `COM6` on Windows, `/dev/ttyACM0` on Linux/macOS).
* Open port at **115200 baud** and read line-delimited JSON messages (`\n` terminated).
* Parse minimal JSON safely (tiny hand-rolled parser is fine; we only need integers for `e` and `s`).
* When `s==1`, **immediately play** the mapped note sample for electrode `e`.
* **7 fixed notes:** `C4, D4, E4, F4, G4, A4, B4` (map e=0..6).
* **Instrument packs:** load one of two sample sets at runtime (piano & guitar).

  * Provide a simple keybinding: press `I` to toggle between `piano_` and `guitar_` packs.
* **FX:** add a lightweight **delay/echo** (single tap) implemented in app logic by scheduling a quiet re-trigger ~140 ms later. Keep CPU usage minimal.
* **UI:** console app is acceptable (we prioritize latency), but print clear status lines: connected port, active instrument, key help (`I` to toggle, `Q` to quit).
* **Latency targets:** preload all samples in memory; reuse `sf::Sound` objects; keep parsing tight; no blocking I/O on note-on path.

### Protocol (assume firmware already emits this)

* Press: `{"e":2,"s":1}\n`
* Release: `{"e":2,"s":0}\n`
* Ignore out-of-range `e`. Only act on `s==1` (note-on). Optionally you can add a future velocity field but ignore for now.

### Repository Layout

```
/ (root)
  CMakeLists.txt
  /src
    main.cpp               // serial read, parser, note dispatcher, FX scheduler
    audio_engine.hpp/.cpp  // sample manager, note playback, delay scheduling
    serial_reader.hpp/.cpp // Boost.Asio line-reader with newline framing
    util/json_min.hpp      // ultra-small parser for {"e":N,"s":N}
  /assets
    piano_C4.wav ... piano_B4.wav
    guitar_C4.wav ... guitar_B4.wav
  /docs
    README.md
    wiring.md              // STM32 ↔ MPR121 ↔ bananas summary + JSON protocol
```

### Implementation Notes

* **Audio:**

  * Load 7 **WAV** files for each instrument (`piano_*.wav`, `guitar_*.wav`).
  * Keep `sf::SoundBuffer` objects alive for app lifetime; attach to `sf::Sound` objects and call `play()` on note-on.
  * Provide a tiny delay scheduler thread or timer queue that triggers a second playback of the same buffer after `DELAY_MS=140` with a **reduced gain**. If per-note volume isn’t available in `sf::Sound`, simulate with pre-attenuated duplicate buffers or accept same volume for v1.
* **Serial:**

  * Use Boost.Asio synchronous `read` or `read_until('\n')` loop with a small buffer; tolerate malformed lines; cap line length (e.g., 256).
  * CLI: `--port COM6` or default-detect common names. Print helpful error if not found.
* **Threading:**

  * Main thread reads serial and triggers notes; one lightweight worker handles delay scheduling (`std::thread` + `sleep_for(5ms)` loop).
* **Config:**

  * `config.hpp` constants: `DEFAULT_PORT`, `BAUD=115200`, `DELAY_MS=140`.
  * Keybinds: `I` (toggle instrument), `Q` (quit).
* **Testing stub (no board):**

  * Add a `--demo` flag to simulate test events (e.g., fire `e=0..6` every 500 ms) so audio path can be verified without the MCU.

### Deliverables

1. **Buildable project** with `CMakeLists.txt` that fetches/links **SFML** and **Boost** (find_package or CPM).
2. **README.md** with:

   * Build steps for Windows (MSVC), macOS (Clang), Linux (GCC)
   * How to select the serial port / run `--demo`
   * How to add new instrument packs (drop 7 WAV files with the `instrument_` prefix)
   * Latency tips and troubleshooting (audio device selection, buffer underruns)
3. **Minimal sample set**: include placeholder sine-piano WAVs so the app runs out-of-the-box.
4. **Acceptance checks** (automated or documented):

   * On receiving `{"e":3,"s":1}\n`, the corresponding sample plays within <10 ms from parse.
   * Press `I` switches sample set instantly; press `Q` exits cleanly.
   * `--demo` mode cycles notes and exercises the delay FX.

### Nice-to-have (only if time allows)

* Simple desktop UI (ImGui or minimal window) to show port, instrument selector, delay on/off and ms slider.
* Hot-reload of samples if files change.

---

## Why this stack (for reference, not part of the code)

* **SFML Audio** is ideal for instant playback of small in-memory sounds via `sf::SoundBuffer`/`sf::Sound`. Low overhead and simple API. ([sfml-dev.org][1])
* **Boost.Asio `serial_port`** gives portable serial access on Windows/macOS/Linux, matching the STM32 **USB-CDC** virtual COM workflow. ([boost.org][2])
* **NUCLEO-F767ZI** + **USB-CDC** and **MPR121** are standard, well-documented choices for this pipeline. ([STMicroelectronics][3])

If you want, I can also provide a ready-to-paste `CMakeLists.txt` and `main.cpp` that match this prompt.

[1]: https://www.sfml-dev.org/tutorials/3.0/audio/sounds/?utm_source=chatgpt.com "Playing sounds and music"
[2]: https://www.boost.org/doc/libs/latest/doc/html/boost_asio/overview/serial_ports.html?utm_source=chatgpt.com "Serial Ports"
[3]: https://www.st.com/resource/en/user_manual/um1974-stm32-nucleo144-boards-mb1137-stmicroelectronics.pdf?utm_source=chatgpt.com "UM1974 - STM32 Nucleo-144 boards (MB1137)"





cmake_minimum_required(VERSION 3.16)
project(BananaPiano CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Options
option(BUILD_DEMO "Build with --demo support" ON)

# Find SFML (audio + system). Install SFML or set CMAKE_PREFIX_PATH accordingly.
# SFML provides Sound/SoundBuffer for low-latency one-shots.
find_package(SFML 2.5 REQUIRED COMPONENTS audio system) # 2.5+ works fine

# Find Boost (we need at least Boost::system for Asio serial_port)
find_package(Boost REQUIRED COMPONENTS system)

add_executable(banana_piano
  src/main.cpp
)

target_include_directories(banana_piano PRIVATE ${Boost_INCLUDE_DIRS})
target_link_libraries(banana_piano PRIVATE
  sfml-audio
  sfml-system
  Boost::system
)

# On Unix-like systems, link pthread if needed (Asio may use it)
if(UNIX AND NOT APPLE)
  find_package(Threads REQUIRED)
  target_link_libraries(banana_piano PRIVATE Threads::Threads)
endif()

# Copy asset WAVs next to the binary at build time (optional helper)
add_custom_command(TARGET banana_piano POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E make_directory $<TARGET_FILE_DIR:banana_piano>/assets
  COMMAND ${CMAKE_COMMAND} -E copy_directory
          ${CMAKE_SOURCE_DIR}/assets
          $<TARGET_FILE_DIR:banana_piano>/assets
)


// Banana Piano: reads {"e":N,"s":0/1}\n from STM32 USB-CDC and plays 7 notes.
// Build: CMake (see CMakeLists.txt). Run with optional arg: ./banana_piano [PORT] [--demo]

#include <SFML/Audio.hpp>
#include <boost/asio.hpp>
#include <iostream>
#include <array>
#include <string>
#include <thread>
#include <chrono>
#include <mutex>
#include <atomic>

using boost::asio::io_context;
using boost::asio::serial_port;
using boost::asio::buffer;

static const char* NOTE_NAMES[7] = {"C4","D4","E4","F4","G4","A4","B4"};

struct AudioEngine {
    std::array<sf::SoundBuffer,7> buffers{};
    std::array<sf::Sound,7>       sounds{};

    bool loadInstrument(const std::string& prefix, const std::string& assetsDir = "assets") {
        for (int i=0;i<7;++i) {
            std::string path = assetsDir + "/" + prefix + NOTE_NAMES[i] + ".wav";
            if (!buffers[i].loadFromFile(path)) {
                std::cerr << "Failed to load " << path << "\n";
                return false;
            }
            sounds[i].setBuffer(buffers[i]); // Buffer must outlive Sound
        }
        std::cout << "Loaded instrument: " << prefix << "\n";
        return true;
    }

    void noteOn(int e) {
        if (e < 0 || e >= 7) return;
        sounds[e].play();

        // Simple echo: schedule a re-trigger ~140 ms later (same gain for SFML v1)
        std::thread([this, e]{
            std::this_thread::sleep_for(std::chrono::milliseconds(140));
            sounds[e].play();
        }).detach();
    }
};

// Tiny helper to parse {"e":3,"s":1} without bringing a JSON lib.
// Very permissive: finds the first integers after "e": and "s":
static bool parse_event(const std::string& line, int& e, int& s) {
    auto epos = line.find("\"e\"");
    auto spos = line.find("\"s\"");
    if (epos == std::string::npos || spos == std::string::npos) return false;
    auto ecolon = line.find(':', epos);
    auto scolon = line.find(':', spos);
    if (ecolon == std::string::npos || scolon == std::string::npos) return false;
    try {
        e = std::stoi(line.substr(ecolon+1));
        s = std::stoi(line.substr(scolon+1));
    } catch (...) { return false; }
    return true;
}

int main(int argc, char** argv) {
    std::string portName;
#if defined(_WIN32)
    portName = "COM6";
#else
    portName = "/dev/ttyACM0";
#endif
    bool demo = false;

    for (int i=1;i<argc;++i) {
        std::string arg = argv[i];
        if (arg.rfind("COM",0)==0 || arg.rfind("/dev/",0)==0) portName = arg;
        if (arg == "--demo") demo = true;
    }

    AudioEngine audio;
    // Provide two instrument packs; start with piano_. You can add guitar_ files to switch.
    if (!audio.loadInstrument("piano_")) {
        std::cerr << "Place WAVs like assets/piano_C4.wav ... piano_B4.wav\n";
        return 1;
    }

    std::cout << "Banana Piano\n";
    std::cout << "Default port: " << portName << "\n";
    std::cout << "Keys: [i] toggle instrument (piano_ / guitar_), [q] quit\n";

    std::atomic<bool> running{true};
    std::thread kb([&](){
        std::string s;
        while (running && std::getline(std::cin, s)) {
            if (s == "q" || s == "Q") { running = false; break; }
            if (s == "i" || s == "I") {
                static bool guitar=false;
                guitar = !guitar;
                audio.loadInstrument(guitar ? "guitar_" : "piano_");
            }
        }
    });

    if (demo) {
        std::cout << "[DEMO] No serial. Cycling notes every 400 ms.\n";
        int e = 0;
        while (running) {
            audio.noteOn(e);
            e = (e + 1) % 7;
            std::this_thread::sleep_for(std::chrono::milliseconds(400));
        }
        kb.join();
        return 0;
    }

    try {
        io_context io;
        serial_port sp(io, portName);
        sp.set_option(boost::asio::serial_port_base::baud_rate(115200));

        std::cout << "Listening on " << portName << "...\n";
        boost::asio::streambuf sbuf;
        std::istream is(&sbuf);

        while (running) {
            // Read until newline from STM32 (CDC sends '\n' per event)
            boost::asio::read_until(sp, sbuf, '\n');
            std::string line;
            std::getline(is, line);
            if (line.size() > 256) continue; // safety

            int e=-1, s=-1;
            if (parse_event(line, e, s) && s==1 && e>=0 && e<7) {
                audio.noteOn(e);
            }
        }
    } catch (const std::exception& ex) {
        std::cerr << "Serial error: " << ex.what() << "\n";
        std::cerr << "Tip: pass port explicitly, e.g., ./banana_piano "
#if defined(_WIN32)
                  << "COM6"
#else
                  << "/dev/ttyACM0"
#endif
                  << " or use --demo\n";
    }

    running = false;
    if (kb.joinable()) kb.join();
    return 0;
}
