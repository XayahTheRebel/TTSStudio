# TTSStudio

> **All TTS models in one place**

English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

`TTSStudio` is a local desktop TTS application built with **Electron + Node.js + a Python worker**, running the local `OpenBMB/VoxCPM2` model for text-to-speech, voice design and voice cloning.

---

## Download

Prebuilt installers are on the [Releases](https://github.com/XayahTheRebel/TTSStudio/releases) page:

- **Windows 10/11 (x64)**: `TTSStudio Setup <version>.exe` (NSIS installer)
- **macOS Apple Silicon**: `TTSStudio-<version>-arm64.dmg`
- **macOS Intel**: `TTSStudio-<version>-x64.dmg`

The macOS build is not notarized — on first launch, **right-click the app → Open** (or allow it in System Settings → Privacy & Security).

---

## Features

- **Auto mode**: type text, get speech — the most stable path
- **Design mode**: describe the voice in natural language (e.g. "A young woman, gentle and sweet voice, British accent")
- **Clone mode**: upload reference audio to clone a voice, with or without a reference transcript (experimental)
- **Local inference**: models and data stay on your machine
- **GPU acceleration**: NVIDIA CUDA on Windows; Apple Silicon uses **MPS** automatically (device selection: `cuda → mps → cpu`)
- **Auto-saved outputs**: every generated clip lands in the `outputs` directory with a timestamped name
- **Real progress**: a calibrated progress bar tracks actual generation progress and expected duration
- **UI languages**: switch between 中文 / English / 日本語 in the app

---

## Project structure

```
TTSStudio/
├── electron/                 # Electron main process
│   ├── main.js               # window, IPC, Python worker lifecycle
│   └── preload.js            # renderer API bridge
├── renderer/                 # frontend UI
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── backend/                  # Python backend
│   ├── worker.py             # resident inference process (JSON line protocol)
│   ├── download_model.py     # model download script
│   └── install_runtime.ps1   # runtime installer (Windows)
├── scripts/                  # build & install scripts
├── models/                   # local models (not committed)
│   ├── VoxCPM/               # official VoxCPM source
│   └── VoxCPM2-HF/           # VoxCPM2 weights
├── outputs/                  # generated audio
└── package.json
```

---

## Running from source

### 1. Clone and install Node dependencies

```bash
git clone https://github.com/XayahTheRebel/TTSStudio.git
cd TTSStudio
npm install
```

### 2. Backend Python dependencies

**Windows** (creates/reuses a `tts-backend-py311` conda env):

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

CPU-only Torch: append `-TorchTarget cpu`. Supported CUDA targets: `cuda121`, `cuda124`, `cuda126`, `cuda128`, `cuda129`, `cuda130`.

**macOS**:

```bash
pip3 install voxcpm modelscope funasr datasets simplejson sortedcontainers
```

Verify the environment (`allCoreDepsReady: true` means the backend is ready):

```bash
python3 backend/worker.py --doctor
```

### 3. Model weights

No manual download needed: on first launch the app automatically downloads `openbmb/VoxCPM2` (~4.6 GB) into `models/VoxCPM2-HF`, trying the `hf-mirror.com` mirror first and falling back to `huggingface.co`. To download manually instead:

```bash
python3 backend/download_model.py --repo-id openbmb/VoxCPM2 --local-dir models/VoxCPM2-HF --endpoint https://hf-mirror.com
```

### 4. Launch

```bash
npm start
```

---

## First run

1. Wait for the automatic environment check and model load ("Model ready")
2. Generate one clip in **Auto** mode first

Suggested first test text:

```text
Hello world from TTSStudio.
```

---

## Modes

### Auto

Plain text-to-speech: just provide the text.

### Design

Describe the target voice in natural language:

```text
A young woman, gentle and sweet voice, slightly smiling, British accent
```

### Clone

Upload reference audio to clone a voice:

- With `ref_text`: closer to ultimate cloning, more stable
- Without `ref_text`: reference-audio-driven cloning path

> ⚠️ Clone mode is wired up but still being stabilized; prefer Auto mode for now.

---

## Python interpreter resolution

The app resolves the Python interpreter in this order:

1. The `pythonPath` stored in the app settings
2. A project virtualenv: `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python3` (macOS/Linux)
3. A conda env named `tts-backend-py311` if present
4. System `python` (Windows) or `python3` (macOS/Linux)

---

## Packaging desktop installers

```bash
# Directory only, no installer
npm run desktop:pack

# Windows NSIS installer (on Windows)
npm run desktop:build

# macOS DMG (on macOS, arm64 + x64)
npx electron-builder --mac --arm64 --x64
```

Artifacts are written to `release/`.

---

## Audio format notes

The reference-audio picker currently accepts `wav` and `flac` only, to avoid uncertainty around the `mp3` decoding chain (a system `ffmpeg` is not a default dependency). Output audio is saved as WAV.

---

## Known issues

- **Clone mode** needs further verification and cannot be called fully stable yet
- The service class in `electron/main.js` is still named `OmniVoiceService` — naming legacy only, no functional impact
- Early OmniVoice-related model directories may remain locally; they are not part of the current pipeline

---

## Tech stack

- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [python-shell](https://www.npmjs.com/package/python-shell)
- [PyTorch](https://pytorch.org/)
- [Transformers](https://huggingface.co/docs/transformers/)
- [VoxCPM2](https://huggingface.co/openbmb/VoxCPM2)

---

## License

MIT
