$ErrorActionPreference = "Stop"

$installDir = "$env:LOCALAPPDATA\AIResumeBuilder"
$binDir = "$env:LOCALAPPDATA\Microsoft\WindowsApps"
$shortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\AI Resume Builder.lnk"

Write-Host "Installing AI Resume Builder..."

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Copy-Item "index.html" $installDir
Copy-Item "styles.css" $installDir
Copy-Item "app.js" $installDir

$runScript = @"
Start-Process "$installDir\index.html"
"@

Set-Content -Path "$installDir\run.ps1" -Value $runScript

# add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$installDir", "User")
}

# create a .cmd wrapper so it works from cmd too
$cmdWrapper = "@echo off`r`npowershell -ExecutionPolicy Bypass -File `"$installDir\run.ps1`""
Set-Content -Path "$installDir\ai-resume-builder.cmd" -Value $cmdWrapper

# start menu shortcut
$WshShell = New-Object -ComObject WScript.Shell
$sc = $WshShell.CreateShortcut($shortcut)
$sc.TargetPath = "powershell.exe"
$sc.Arguments = "-ExecutionPolicy Bypass -File `"$installDir\run.ps1`""
$sc.WorkingDirectory = $installDir
$sc.Save()

Write-Host "Done. Run with: ai-resume-builder"
