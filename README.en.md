<p align="center">
  <img src="icon.png" alt="VoxCPM Studio logo" width="128" />
</p>

# VoxCPM Studio

English | [简体中文](README.md) | [日本語](README.ja.md)

`VoxCPM Studio` is a local desktop TTS application built with `Electron + Node.js + python-shell + a Python worker`, running the local `VoxCPM2` model.

The project has switched from OmniVoice to `OpenBMB/VoxCPM` and uses the following local resources by default:

- Source directory: `models/VoxCPM/src`
- Model directory: `models/VoxCPM2-HF`
- Output directory: `outputs`

## Current status

- `Auto` mode: verified working
- `Design` mode: frontend and backend wired up, UI supported
- `Clone` mode: wired up, but local smoke tests are not yet consistently stable
- Desktop app: launches, loads the local model, generates and saves audio
- Generated audio is saved automatically into the `outputs` directory
- A progress bar is shown while audio is being generated
- The UI language can be switched between 中文, English and 日本語 (the "Language" panel next to Device info)

If you just want a quick start, test `Auto` mode first — it is the most stable.

## Platform support

The app runs on **Windows** and **macOS**:

- **Windows**: CUDA (NVIDIA GPU) or CPU
- **macOS**: Apple Silicon uses the **MPS** backend automatically; Intel Macs fall back to CPU

Device selection is automatic: `cuda → mps → cpu`.

## Project structure

- `electron/`
  - `main.js`: Electron main process, Python worker lifecycle, IPC
  - `preload.js`: exposes `studioApi` to the renderer
- `renderer/`
  - `index.html`: desktop UI
  - `app.js`: page logic, form state, calls into `studioApi`
  - `styles.css`: styles
- `backend/`
  - `worker.py`: resident Python inference process, talks to Node via a JSON protocol
- `scripts/`
  - `install-backend.ps1`: installs backend Python dependencies (Windows)
  - `start-app.ps1`: installs Node dependencies and starts the app (Windows)
- `models/`
  - `VoxCPM/`: official source repository
  - `VoxCPM2-HF/`: local Hugging Face model weights
- `outputs/`
  - generated audio output directory

## Python environment

The app resolves the Python interpreter in this order:

1. The `pythonPath` stored in the app settings
2. A project virtualenv: `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python3` (macOS/Linux)
3. A conda env named `tts-backend-py311` if present
4. System `python` (Windows) or `python3` (macOS/Linux)

## Installation

Install Node dependencies:

```bash
npm install
```

### Backend dependencies — Windows

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

CPU-only Torch:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1 -TorchTarget cpu
```

### Backend dependencies — macOS

```bash
pip3 install voxcpm modelscope funasr datasets simplejson sortedcontainers
```

Then verify the environment:

```bash
python3 backend/worker.py --doctor
```

`allCoreDepsReady: true` in the output means the backend is ready.

### Model weights

On first launch the app downloads `openbmb/VoxCPM2` (about 4.6 GB) into `models/VoxCPM2-HF` automatically, trying `hf-mirror.com` first and falling back to `huggingface.co`. You can also download manually:

```bash
python3 backend/download_model.py --repo-id openbmb/VoxCPM2 --local-dir models/VoxCPM2-HF --endpoint https://hf-mirror.com
```

## Launch

```bash
npm start
```

## Recommended first run

1. Wait for the automatic environment check and model load ("模型已就绪" / model ready)
2. Generate one clip in `Auto` mode first

Suggested first test text:

```text
Hello world from VoxCPM Studio.
```

## Modes

### Auto

Plain text-to-speech: just provide the text.

### Design

Describe the voice in natural language, for example:

```text
A young woman, gentle and sweet voice, slightly smiling, British accent
```

### Clone

Upload reference audio to clone a voice.

For best results also provide the reference transcript:

- With `ref_text`: closer to ultimate cloning
- Without `ref_text`: reference-audio-driven cloning path

## Useful commands

Check the backend environment:

```bash
python3 backend/worker.py --doctor
```

## Audio format notes

The reference-audio picker currently accepts:

- `wav`
- `flac`

This avoids uncertainty around the `mp3` decoding chain; a system `ffmpeg` is not a default dependency of this project.

## Output behavior

- Every generated clip is **saved automatically** to the `outputs` directory with a timestamped filename
- A progress bar below the Generate button shows generation progress in real time; at startup the app calibrates this device's inference speed with a short sample, estimates each generation's true progress and expected duration in weighted "speech units" (CJK chars, Latin words, digits, pauses), and refines the calibration adaptively after every generation
- "Save as" in the result menu still lets you export a copy anywhere

## Known issues

- `Clone` mode still needs more verification and cannot be called fully stable yet
- Early OmniVoice-related model directories may remain in the project; they are not part of the current pipeline
- The service class in `electron/main.js` is still named `OmniVoiceService`; this is naming legacy only and does not affect behavior

## Handoff docs

For fuller handoff information, risks and next steps see:

- [docs/HANDOFF.md](docs/HANDOFF.md)
