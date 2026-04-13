param(
    [Parameter(Mandatory = $true)]
    [string]$TargetDir,

    [ValidateSet("cpu", "cuda")]
    [string]$TorchTarget = "cpu"
)

$ErrorActionPreference = "Stop"

function Emit-Json {
    param(
        [string]$State,
        [string]$Message,
        [double]$Progress = -1
    )

    $payload = @{
        state = $State
        message = $Message
    }

    if ($Progress -ge 0) {
        $payload.progress = $Progress
    }

    $payload | ConvertTo-Json -Compress
}

$pythonVersion = "3.11.9"
$pythonZipUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-embed-amd64.zip"
$getPipUrl = "https://bootstrap.pypa.io/get-pip.py"
$runtimeRoot = [System.IO.Path]::GetFullPath($TargetDir)
$pythonDir = Join-Path $runtimeRoot "python"
$tempDir = Join-Path $runtimeRoot "_download"
$pythonZipPath = Join-Path $tempDir "python-embed.zip"
$getPipPath = Join-Path $tempDir "get-pip.py"
$torchIndex = if ($TorchTarget -eq "cuda") { "https://download.pytorch.org/whl/cu128" } else { "https://download.pytorch.org/whl/cpu" }

Write-Output (Emit-Json -State "preparing" -Message "Preparing backend runtime installation..." -Progress 5)

if (Test-Path $runtimeRoot) {
    Remove-Item -LiteralPath $runtimeRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Output (Emit-Json -State "downloading" -Message "Downloading Python runtime..." -Progress 15)
Invoke-WebRequest -Uri $pythonZipUrl -OutFile $pythonZipPath

Write-Output (Emit-Json -State "extracting" -Message "Extracting Python runtime..." -Progress 30)
Expand-Archive -Path $pythonZipPath -DestinationPath $pythonDir -Force

$pthFile = Get-ChildItem -Path $pythonDir -Filter "python*._pth" | Select-Object -First 1
if (-not $pthFile) {
    throw "Embedded Python ._pth file not found."
}

$zipLine = (Get-Content $pthFile.FullName | Where-Object { $_ -match "\.zip$" } | Select-Object -First 1)
if (-not $zipLine) {
    $zipLine = "python311.zip"
}

$pthLines = @(
    $zipLine
    "."
    "Lib"
    "Lib\site-packages"
    "import site"
)
Set-Content -LiteralPath $pthFile.FullName -Value $pthLines -Encoding ASCII

New-Item -ItemType Directory -Force -Path (Join-Path $pythonDir "Lib\site-packages") | Out-Null

Write-Output (Emit-Json -State "downloading" -Message "Downloading pip installer..." -Progress 40)
Invoke-WebRequest -Uri $getPipUrl -OutFile $getPipPath

$pythonExe = Join-Path $pythonDir "python.exe"
if (-not (Test-Path $pythonExe)) {
    throw "python.exe not found after extraction."
}

Write-Output (Emit-Json -State "installing" -Message "Installing pip..." -Progress 50)
& $pythonExe $getPipPath --no-warn-script-location

Write-Output (Emit-Json -State "installing" -Message "Installing base packaging tools..." -Progress 58)
& $pythonExe -m pip install --upgrade pip setuptools wheel --no-warn-script-location

Write-Output (Emit-Json -State "installing" -Message "Installing PyTorch runtime..." -Progress 68)
& $pythonExe -m pip install --no-warn-script-location torch==2.8.0 torchaudio==2.8.0 --index-url $torchIndex

Write-Output (Emit-Json -State "installing" -Message "Installing voice dependencies..." -Progress 82)
& $pythonExe -m pip install --no-warn-script-location `
    transformers accelerate numpy soundfile pydub huggingface_hub sentencepiece `
    einops inflect addict wetext modelscope datasets pydantic tqdm simplejson `
    sortedcontainers librosa matplotlib funasr argbind safetensors "fsspec<=2025.3.0"

$runtimeMeta = @{
    installedAt = (Get-Date).ToString("o")
    torchTarget = $TorchTarget
    pythonVersion = $pythonVersion
}
$runtimeMeta | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeRoot "runtime.json") -Encoding UTF8

if (Test-Path $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
}

Write-Output (Emit-Json -State "complete" -Message "Backend runtime installation complete." -Progress 100)
