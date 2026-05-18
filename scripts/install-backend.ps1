param(
    [ValidateSet("cuda", "cuda121", "cuda124", "cuda126", "cuda128", "cuda129", "cuda130", "cpu")]
    [string]$TorchTarget = "cuda128"
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

$normalizedTorchTarget = if ($TorchTarget -eq "cuda") { "cuda128" } else { $TorchTarget }
$torchIndexMap = @{
    cpu = "https://download.pytorch.org/whl/cpu"
    cuda121 = "https://download.pytorch.org/whl/cu121"
    cuda124 = "https://download.pytorch.org/whl/cu124"
    cuda126 = "https://download.pytorch.org/whl/cu126"
    cuda128 = "https://download.pytorch.org/whl/cu128"
    cuda129 = "https://download.pytorch.org/whl/cu129"
    cuda130 = "https://download.pytorch.org/whl/cu130"
}
$torchVersionMap = @{
    cpu = "2.8.0"
    cuda121 = "2.5.1"
    cuda124 = "2.6.0"
    cuda126 = "2.8.0"
    cuda128 = "2.8.0"
    cuda129 = "2.8.0"
    cuda130 = "2.11.0"
}
$torchIndex = $torchIndexMap[$normalizedTorchTarget]
$torchVersion = $torchVersionMap[$normalizedTorchTarget]
if (-not $torchIndex) {
    throw "Unsupported TorchTarget: $TorchTarget"
}

& $python -m pip install "torch==$torchVersion" "torchaudio==$torchVersion" --index-url $torchIndex

& $python -m pip install transformers accelerate numpy soundfile pydub huggingface_hub sentencepiece
& $python -m pip install einops inflect addict wetext modelscope datasets pydantic tqdm simplejson sortedcontainers librosa matplotlib funasr argbind safetensors

Write-Host "Backend dependencies installed."
Write-Host "Python executable: $python"
