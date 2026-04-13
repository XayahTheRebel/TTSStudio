param(
    [string]$SourceEnv = (Join-Path $env:USERPROFILE "anaconda3\envs\tts-backend-py311"),
    [string]$TargetDir = (Join-Path (Split-Path -Parent $PSScriptRoot) ".build\backend-python"),
    [switch]$UseCpuTorch = $true
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourceEnv)) {
    throw "Backend environment not found: $SourceEnv"
}

$pythonExe = Join-Path $SourceEnv "python.exe"
if (-not (Test-Path $pythonExe)) {
    throw "python.exe not found in backend environment: $pythonExe"
}

$targetParent = Split-Path -Parent $TargetDir
New-Item -ItemType Directory -Force -Path $targetParent | Out-Null

if (Test-Path $TargetDir) {
    Remove-Item -LiteralPath $TargetDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$excludeDirs = @(
    "__pycache__",
    ".pytest_cache",
    "Lib\site-packages\matplotlib\tests",
    "Lib\site-packages\numpy\tests",
    "Lib\site-packages\pydub\__pycache__",
    "Lib\site-packages\huggingface_hub\__pycache__"
)

$excludeFiles = @(
    "t64-arm.exe",
    "w64-arm.exe",
    "*.pyc",
    "*.pyo",
    "*.log"
)

$robocopyArgs = @(
    $SourceEnv,
    $TargetDir,
    "/MIR",
    "/R:1",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP",
    "/XD"
) + $excludeDirs + @("/XF") + $excludeFiles

Write-Host "Staging backend environment..."
Write-Host "Source: $SourceEnv"
Write-Host "Target: $TargetDir"

& robocopy @robocopyArgs | Out-Null
$exitCode = $LASTEXITCODE
if ($exitCode -ge 8) {
    throw "robocopy failed with exit code $exitCode"
}

if ($UseCpuTorch) {
    $targetPython = Join-Path $TargetDir "python.exe"
    if (-not (Test-Path $targetPython)) {
        throw "Staged python.exe not found: $targetPython"
    }

    Write-Host "Switching staged runtime to CPU Torch..."
    $torchPaths = @(
        (Join-Path $TargetDir "Lib\site-packages\torch"),
        (Join-Path $TargetDir "Lib\site-packages\torch-*.dist-info"),
        (Join-Path $TargetDir "Lib\site-packages\torchaudio"),
        (Join-Path $TargetDir "Lib\site-packages\torchaudio-*.dist-info"),
        (Join-Path $TargetDir "Lib\site-packages\torchvision"),
        (Join-Path $TargetDir "Lib\site-packages\torchvision-*.dist-info"),
        (Join-Path $TargetDir "Lib\site-packages\functorch"),
        (Join-Path $TargetDir "Lib\site-packages\~unctorch")
    )
    foreach ($pattern in $torchPaths) {
        Get-ChildItem -LiteralPath $pattern -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    Get-ChildItem (Join-Path $TargetDir "Scripts") -Filter "torch*.exe" -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue

    & $targetPython -m pip install --no-cache-dir --force-reinstall torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install CPU Torch into staged runtime."
    }
}

Write-Host "Backend environment staged successfully."
