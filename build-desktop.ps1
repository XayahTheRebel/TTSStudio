param(
    [switch]$SkipInstaller,
    [string]$BackendEnv = (Join-Path $env:USERPROFILE "anaconda3\envs\tts-backend-py311")
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $root "scripts\stage-backend-env.ps1") -SourceEnv $BackendEnv

if ($SkipInstaller) {
    npm.cmd run desktop:pack
}
else {
    npm.cmd run desktop:build
}
