param(
    [ValidateSet("cuda", "cpu")]
    [string]$TorchTarget = "cuda"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $root ".venv"
$venvPython = Join-Path $venv "Scripts\\python.exe"
$condaPython = Join-Path $env:USERPROFILE "anaconda3\\envs\\tts-backend-py311\\python.exe"
$python = $venvPython

if (Test-Path $condaPython) {
    $python = $condaPython
    Write-Host "Using existing conda environment: $python"
}
else {
    Write-Host "Creating virtual environment at $venv"
    if (-not (Test-Path $python)) {
        python -m venv $venv
    }
}

& $python -m pip install --upgrade pip setuptools wheel

if ($TorchTarget -eq "cuda") {
    & $python -m pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cu128
}
else {
    & $python -m pip install torch==2.8.0 torchaudio==2.8.0
}

& $python -m pip install transformers accelerate numpy soundfile pydub huggingface_hub sentencepiece
& $python -m pip install einops inflect addict wetext modelscope datasets pydantic tqdm simplejson sortedcontainers librosa matplotlib funasr argbind safetensors

Write-Host "Backend dependencies installed."
Write-Host "Python executable: $python"
