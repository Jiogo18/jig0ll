@echo off
cd

:start
echo Arret : Ctrl + C
node index.js

echo.
echo.
echo Redemarrage ?
pause

cls
echo Redemarrage
goto start
