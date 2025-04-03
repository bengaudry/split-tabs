@echo off
del extension.zip
cd apps/extension
tar.exe -a -c -f ../../extension.zip *
cd ../..
echo Extension files have been compressed into extension.zip
