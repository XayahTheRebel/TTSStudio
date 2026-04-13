param(
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if ($SkipInstaller) {
    npm.cmd run desktop:pack
}
else {
    npm.cmd run desktop:build
}
