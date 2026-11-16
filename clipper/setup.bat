@echo off
REM Windows one-time setup. Double-click this file.
cd /d "%~dp0"
where python >nul 2>nul || winget install -e --id Python.Python.3.12
where ffmpeg >nul 2>nul || winget install -e --id Gyan.FFmpeg
where deno >nul 2>nul || winget install -e --id DenoLand.Deno
if not exist fonts mkdir fonts
if not exist fonts\Montserrat-Black.ttf powershell -Command "Invoke-WebRequest https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Black.ttf -OutFile fonts\Montserrat-Black.ttf"
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo.
echo Open clipper\.env in Notepad and paste your Anthropic API key after ANTHROPIC_API_KEY=
python -m clipper doctor
echo.
echo Setup done. Double-click start.bat to run the autopilot.
pause
