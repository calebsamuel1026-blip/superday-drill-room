@echo off
REM Starts the fully automatic clipper and restarts it if it crashes. Close the window to stop.
cd /d "%~dp0"
call .venv\Scripts\activate.bat
pip install -q --upgrade yt-dlp
REM keep the PC awake while running
powercfg /change standby-timeout-ac 0 >nul 2>nul
:loop
python -m clipper autopilot
if %errorlevel%==0 goto end
echo autopilot exited, restarting in 30s...
timeout /t 30 >nul
goto loop
:end
