$ErrorActionPreference = "Stop"

$installDir = "$env:LOCALAPPDATA\AIResumeBuilder"
$shortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\AI Resume Builder.lnk"

Write-Host "Uninstalling AI Resume Builder..."

Remove-Item -Recurse -Force $installDir -ErrorAction SilentlyContinue
Remove-Item -Force $shortcut -ErrorAction SilentlyContinue

$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -like "*$installDir*") {
    $newPath = ($userPath -split ";" | Where-Object { $_ -ne $installDir }) -join ";"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
}

Write-Host "Done."
