@echo off
del extension.zip
tar.exe -a -c -f extension.zip background.js styles.css manifest.json split-view.html split-view.js icons
echo Extension files have been compressed into extension.zip
