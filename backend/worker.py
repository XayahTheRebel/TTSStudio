import argparse
import importlib
import json
import logging
import os
import sys
import time
import traceback
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

STATE: dict[str, Any] = {
    "ready": False,
    "model": None,
    "torch": None,
    "soundfile": None,
    "librosa": None,
    "settings": {},
    "meta": {},
}

SUPPORTED_LANGUAGES = [
    "Arabic",
    "Burmese",
    "Chinese",
    "Danish",
    "Dutch",
    "English",
    "Finnish",
    "French",
    "German",
    "Greek",
    "Hebrew",
    "Hindi",
    "Indonesian",
    "Italian",
    "Japanese",
    "Khmer",
    "Korean",
    "Lao",
    "Malay",
    "Norwegian",
    "Polish",
    "Portuguese",
    "Russian",
    "Spanish",
    "Swahili",
    "Swedish",
    "Tagalog",
    "Thai",
    "Turkish",
    "Vietnamese",
]

VOICE_DESIGN_PRESETS = {
    "identity": [
        "A young woman",
        "A middle-aged man",
        "A teenage girl",
        "An elderly man",
        "A child with a bright voice",
    ],
    "tone": [
        "gentle and sweet voice",
        "warm and calm tone",
        "clear and professional voice",
        "soft and intimate voice",
        "deep and steady voice",
    ],
    "emotion": [
        "slightly smiling",
        "cheerful tone",
        "serious tone",
        "energetic delivery",
        "relaxed and natural expression",
    ],
    "pace": [
        "slightly faster",
        "slow and deliberate pace",
        "normal conversational pace",
    ],
    "accent": [
        "British accent",
        "American accent",
        "Sichuan dialect",
        "Northeast dialect",
        "Henan dialect",
    ],
}

DEFAULTS = {
    "cfg_value": 2.0,
    "inference_timesteps": 10,
    "min_len": 2,
    "max_len": 4096,
    "normalize": False,
    "denoise": False,
    "retry_badcase": True,
    "retry_badcase_max_times": 3,
    "retry_badcase_ratio_threshold": 6.0,
}


def emit(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def emit_event(name: str, payload: dict[str, Any]) -> None:
    emit({"type": "event", "name": name, "payload": payload})


def respond(request_id: str, ok: bool, data: Any = None, error: str | None = None) -> None:
    emit({"type": "response", "id": request_id, "ok": ok, "data": data, "error": error})


def safe_version(module_name: str) -> dict[str, Any]:
    try:
        module = importlib.import_module(module_name)
        return {"ok": True, "version": getattr(module, "__version__", "unknown")}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}


def normalize_settings(payload: dict[str, Any]) -> dict[str, Any]:
    model_dir = payload.get("modelDir") or ""
    source_dir = payload.get("sourceDir") or ""
    output_dir = payload.get("outputDir") or ""
    python_path = payload.get("pythonPath") or sys.executable
    return {
        "modelDir": str(Path(model_dir).resolve()) if model_dir else "",
        "sourceDir": str(Path(source_dir).resolve()) if source_dir else "",
        "outputDir": str(Path(output_dir).resolve()) if output_dir else "",
        "pythonPath": python_path,
        "devicePreference": payload.get("devicePreference") or "auto",
    }


def choose_device(torch_mod, preference: str) -> str:
    pref = (preference or "auto").lower()
    if pref == "cuda":
        return "cuda" if torch_mod.cuda.is_available() else "cpu"
    if pref == "cpu":
        return "cpu"
    if torch_mod.cuda.is_available():
        return "cuda"
    if getattr(torch_mod.backends, "mps", None) and torch_mod.backends.mps.is_available():
        return "mps"
    return "cpu"


def ensure_source_path(source_dir: str) -> None:
    if source_dir and source_dir not in sys.path:
        sys.path.insert(0, source_dir)


def action_doctor(payload: dict[str, Any]) -> dict[str, Any]:
    settings = normalize_settings(payload)
    ensure_source_path(settings["sourceDir"])
    modules = {
        name: safe_version(name)
        for name in [
            "torch",
            "torchaudio",
            "transformers",
            "numpy",
            "soundfile",
            "librosa",
            "modelscope",
            "datasets",
            "funasr",
            "pydantic",
            "simplejson",
            "sortedcontainers",
        ]
    }
    modules["voxcpm"] = safe_version("voxcpm")
    return {
        "pythonExecutable": sys.executable,
        "pythonVersion": sys.version.split()[0],
        "settings": settings,
        "paths": {
            "modelDirExists": os.path.isdir(settings["modelDir"]),
            "sourceDirExists": os.path.isdir(settings["sourceDir"]),
            "outputDirExists": os.path.isdir(settings["outputDir"]),
        },
        "modules": modules,
        "allCoreDepsReady": all(info["ok"] for info in modules.values()),
    }


def action_init(payload: dict[str, Any]) -> dict[str, Any]:
    if STATE["ready"]:
        return STATE["meta"]

    settings = normalize_settings(payload)
    if not os.path.isdir(settings["modelDir"]):
        raise FileNotFoundError(f"Model directory not found: {settings['modelDir']}")
    if not os.path.isdir(settings["sourceDir"]):
        raise FileNotFoundError(f"Source directory not found: {settings['sourceDir']}")

    ensure_source_path(settings["sourceDir"])
    os.makedirs(settings["outputDir"], exist_ok=True)

    emit_event("status", {"state": "loading", "message": "Importing VoxCPM backend modules..."})
    torch_mod = importlib.import_module("torch")
    soundfile_mod = importlib.import_module("soundfile")
    voxcpm_mod = importlib.import_module("voxcpm")

    device = choose_device(torch_mod, settings["devicePreference"])
    emit_event(
        "status",
        {
            "state": "loading",
            "message": f"Loading VoxCPM2 from {settings['modelDir']} on {device}...",
        },
    )
    started = time.perf_counter()
    model = voxcpm_mod.VoxCPM.from_pretrained(
        settings["modelDir"],
        load_denoiser=False,
        local_files_only=True,
        device=device,
        optimize=False,
    )
    load_seconds = round(time.perf_counter() - started, 2)

    dtype_name = "bfloat16" if device.startswith("cuda") else "float32"
    sample_rate = getattr(model.tts_model, "sample_rate", 48000)
    STATE.update(
        {
            "ready": True,
            "model": model,
            "torch": torch_mod,
            "soundfile": soundfile_mod,
            "settings": settings,
            "meta": {
                "ready": True,
                "device": device,
                "dtype": dtype_name,
                "samplingRate": sample_rate,
                "loadSeconds": load_seconds,
                "languageCount": len(SUPPORTED_LANGUAGES),
                "languages": SUPPORTED_LANGUAGES,
                "voiceDesignPresets": VOICE_DESIGN_PRESETS,
                "defaults": DEFAULTS,
                "modelDir": settings["modelDir"],
                "sourceDir": settings["sourceDir"],
                "outputDir": settings["outputDir"],
            },
        }
    )
    emit_event("status", {"state": "ready", "message": f"VoxCPM2 ready in {load_seconds}s."})
    return STATE["meta"]


def action_capabilities(_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "voiceDesignPresets": VOICE_DESIGN_PRESETS,
        "defaults": DEFAULTS,
        "supports": {
            "autoVoice": True,
            "voiceDesign": True,
            "controllableClone": True,
            "ultimateClone": True,
            "multilingual": True,
            "controllableStylePrefix": True,
        },
        "notes": [
            "Voice design works by prefixing the text with a natural-language description in parentheses.",
            "Controllable cloning uses reference audio only, with an optional style description in parentheses.",
            "Ultimate cloning uses reference audio plus its exact transcript for strongest similarity.",
        ],
    }


@dataclass
class GenerateRequest:
    mode: str
    text: str
    language: str | None
    ref_audio: str | None
    ref_text: str | None
    instruct: str | None
    clone_style: str | None
    file_stem: str | None
    settings: dict[str, Any]
    speed_ratio: float


def to_request(payload: dict[str, Any]) -> GenerateRequest:
    raw_speed_ratio = payload.get("speedRatio", 1.0)
    try:
        speed_ratio = float(raw_speed_ratio)
    except (TypeError, ValueError) as exc:
        raise ValueError("Speed ratio must be a number.") from exc

    return GenerateRequest(
        mode=(payload.get("mode") or "auto").strip(),
        text=(payload.get("text") or "").strip(),
        language=(payload.get("language") or "").strip() or None,
        ref_audio=(payload.get("refAudio") or "").strip() or None,
        ref_text=(payload.get("refText") or "").strip() or None,
        instruct=(payload.get("instruct") or "").strip() or None,
        clone_style=(payload.get("cloneStyle") or "").strip() or None,
        file_stem=(payload.get("fileStem") or "").strip() or None,
        settings=payload.get("settings") or {},
        speed_ratio=speed_ratio,
    )


def sanitize_stem(stem: str | None) -> str:
    fallback = datetime.now().strftime("voxcpm-%Y%m%d-%H%M%S")
    if not stem:
        return fallback
    filtered = "".join(ch if ch.isalnum() or ch in "-_." else "-" for ch in stem)
    filtered = filtered.strip(".-_")
    return filtered[:80] or fallback


def apply_style_prefix(text: str, instruction: str | None) -> str:
    if not instruction:
        return text
    if text.lstrip().startswith("("):
        return text
    return f"({instruction}){text}"


def compose_instruction(language: str | None, instruction: str | None) -> str | None:
    parts: list[str] = []
    if language:
        parts.append(f"Speak in {language}")
    if instruction:
        parts.append(instruction)
    return ", ".join(parts) or None


def apply_speed_ratio(wav, speed_ratio: float):
    if abs(speed_ratio - 1.0) < 1e-6:
        return wav

    if not 0.5 <= speed_ratio <= 2.0:
        raise ValueError("Speed ratio must be between 0.5 and 2.0.")

    librosa_mod = STATE["librosa"]
    if librosa_mod is None:
        librosa_mod = importlib.import_module("librosa")
        STATE["librosa"] = librosa_mod

    return librosa_mod.effects.time_stretch(wav.astype("float32"), rate=speed_ratio)


def action_generate(payload: dict[str, Any]) -> dict[str, Any]:
    if not STATE["ready"]:
        raise RuntimeError("Model is not initialized yet.")

    req = to_request(payload)
    if not req.text:
        raise ValueError("Text is required.")
    if req.mode == "design" and not req.instruct:
        raise ValueError("Voice design mode requires a voice description.")
    if req.mode == "clone" and not req.ref_audio:
        raise ValueError("Reference audio is required in clone mode.")
    if req.mode == "clone" and req.ref_text and req.clone_style:
        raise ValueError("Ultimate cloning and clone style control should not be used together.")
    if not 0.5 <= req.speed_ratio <= 2.0:
        raise ValueError("Speed ratio must be between 0.5 and 2.0.")

    runtime_settings = normalize_settings(payload.get("runtimeSettings") or STATE["settings"])
    os.makedirs(runtime_settings["outputDir"], exist_ok=True)
    file_name = sanitize_stem(req.file_stem)
    output_path = os.path.join(runtime_settings["outputDir"], f"{file_name}.wav")

    defaults = {**DEFAULTS, **req.settings}
    model = STATE["model"]
    soundfile_mod = STATE["soundfile"]
    final_text = req.text
    kwargs: dict[str, Any] = {
        "cfg_value": float(defaults["cfg_value"]),
        "inference_timesteps": int(defaults["inference_timesteps"]),
        "min_len": int(defaults["min_len"]),
        "max_len": int(defaults["max_len"]),
        "normalize": bool(defaults["normalize"]),
        "denoise": bool(defaults["denoise"]),
        "retry_badcase": bool(defaults["retry_badcase"]),
        "retry_badcase_max_times": int(defaults["retry_badcase_max_times"]),
        "retry_badcase_ratio_threshold": float(defaults["retry_badcase_ratio_threshold"]),
    }

    if req.mode == "design":
        final_text = apply_style_prefix(req.text, compose_instruction(req.language, req.instruct))
    elif req.mode == "auto" and req.language:
        final_text = apply_style_prefix(req.text, compose_instruction(req.language, None))
    elif req.mode == "clone":
        kwargs["reference_wav_path"] = req.ref_audio
        if req.ref_text:
            kwargs["prompt_wav_path"] = req.ref_audio
            kwargs["prompt_text"] = req.ref_text
        else:
            final_text = apply_style_prefix(
                req.text,
                compose_instruction(req.language, req.clone_style),
            )

    emit_event(
        "log",
        {
            "level": "info",
            "message": f"Generating {req.mode} audio with VoxCPM2",
        },
    )
    started = time.perf_counter()
    wav = model.generate(text=final_text, **kwargs)
    sample_rate = model.tts_model.sample_rate
    wav = apply_speed_ratio(wav, req.speed_ratio)
    soundfile_mod.write(output_path, wav, sample_rate)
    elapsed = round(time.perf_counter() - started, 2)
    duration_seconds = round(len(wav) / sample_rate, 2)

    emit_event(
        "log",
        {
            "level": "success",
            "message": f"Saved {output_path} ({duration_seconds}s) in {elapsed}s",
        },
    )
    return {
        "outputPath": output_path,
        "samplingRate": sample_rate,
        "durationSeconds": duration_seconds,
        "elapsedSeconds": elapsed,
        "mode": req.mode,
        "language": req.language or "Auto",
        "speedRatio": req.speed_ratio,
        "usedInstruction": req.instruct or "",
        "usedCloneStyle": req.clone_style or "",
        "usedReferenceAudio": req.ref_audio or "",
        "usedReferenceText": req.ref_text or "",
        "finalText": final_text,
        "settings": defaults,
        "meta": STATE["meta"],
    }


def action_shutdown(_payload: dict[str, Any]) -> dict[str, Any]:
    emit_event("status", {"state": "stopped", "message": "Python worker stopped."})
    return {"ok": True}


def dispatch(command: str, payload: dict[str, Any]) -> dict[str, Any]:
    if command == "doctor":
        return action_doctor(payload)
    if command == "init":
        return action_init(payload)
    if command == "capabilities":
        return action_capabilities(payload)
    if command == "generate":
        return action_generate(payload)
    if command == "shutdown":
        return action_shutdown(payload)
    raise ValueError(f"Unknown command: {command}")


def process_line(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    try:
        message = json.loads(line)
        request_id = message.get("id", "")
        command = message.get("command", "")
        payload = message.get("payload") or {}
        data = dispatch(command, payload)
        respond(request_id, True, data=data)
        if command == "shutdown":
            return False
        return True
    except Exception as exc:  # noqa: BLE001
        request_id = ""
        try:
            request_id = json.loads(line).get("id", "")
        except Exception:  # noqa: BLE001
            pass
        traceback_text = "".join(traceback.format_exception_only(type(exc), exc)).strip()
        emit_event("log", {"level": "error", "message": traceback_text})
        respond(request_id, False, error=traceback_text)
        return True


def run_stdio() -> int:
    for raw_line in sys.stdin:
        if not process_line(raw_line):
            return 0
    return 0


def run_doctor_cli() -> int:
    root = Path(__file__).resolve().parents[1]
    result = action_doctor(
        {
            "modelDir": str(root / "models" / "VoxCPM2-HF"),
            "sourceDir": str(root / "models" / "VoxCPM" / "src"),
            "outputDir": str(root / "outputs"),
            "pythonPath": sys.executable,
        }
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--doctor", action="store_true")
    args = parser.parse_args()
    if args.doctor:
        return run_doctor_cli()
    return run_stdio()


if __name__ == "__main__":
    raise SystemExit(main())
