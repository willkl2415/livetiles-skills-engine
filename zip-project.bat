@echo off
setlocal

:: Name of your project folder
set PROJECT=lvetiles-skills-engine

:: Where to save the zip (on Desktop)
set OUTPUT=%USERPROFILE%\Desktop\%PROJECT%.zip

echo Zipping project: %PROJECT%
echo Output file: %OUTPUT%

:: Use PowerShell's Compress-Archive to zip, excluding node_modules and .next
powershell -command "Compress-Archive -Path (Get-ChildItem -Path . -Exclude 'node_modules','.next' | ForEach-Object { $_.FullName }) -DestinationPath '%OUTPUT%' -Force"

echo Done!
pause
