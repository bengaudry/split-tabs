@echo off
del extension.zip
cd src
xcopy /E /I ..\icons icons
tar.exe -a -c -f extension.zip background.js styles.css manifest.json split-view.html split-view.js content-script.js icons
move extension.zip ..
cd ..
rmdir /S /Q src\icons
echo Extension files have been compressed into extension.zip
