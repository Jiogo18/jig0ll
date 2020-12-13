@echo off
cd

:start
echo Arret : Ctrl + C
npm start

echo.
echo.
echo Redemarrage ?
pause

cls
echo Redemarrage
goto start
