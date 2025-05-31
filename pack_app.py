import os
import sys
import json
import shutil

if len(sys.argv) != 1 and len(sys.argv) != 2:
    print("Usage: python pack_app.py [-p: publish]")
    sys.exit(1)

# Get the directories needed for packaging    
baseDir = os.path.dirname(os.path.abspath(__file__))
iconsDir = os.path.join(baseDir, "icons")
srcDir = os.path.join(baseDir, "src")
buildDir = os.path.join(baseDir, "build")

isPackagingForPublish = sys.argv[1] == "-p" if len(sys.argv) == 2 else False
            
print(">> Packaging for publish <<\n" if isPackagingForPublish else ">> Packaging for development <<\n")
    
# Ask new version number if packaging for publish
if isPackagingForPublish:
    manifestFile = os.path.join(srcDir, "manifest.json")
    with open(manifestFile, "r") as f:
        manifest = f.read()
        manifest = json.loads(manifest)

    print("> Current version of the extension: " + manifest["version"])
    newVersion = input("> Enter new version number: ")
    manifest["version"] = newVersion
    with open(manifestFile, "w") as f:
        f.write(json.dumps(manifest, indent=4))
    print("")
    
# Check if the build directory exists, if it does, clean it up
# and if it doesn't, create it
if (os.path.exists(buildDir) and os.path.isdir(buildDir)):
    print("Cleaning up old build")
    for root, dirs, files in os.walk("build", topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))
else:
    print("> Creating build directory")
    os.mkdir(buildDir)
    
if (os.path.exists(os.path.join(baseDir, "extension.zip"))):
    print("> Cleaning up old extension.zip")
    os.remove(os.path.join(baseDir, "extension.zip"))
    
# Create the icons directory in the build directory
os.mkdir(os.path.join(buildDir, "icons"))
    
# Copy the icons directory to the build directory
print("> Copying icons directory")
if isPackagingForPublish:
    shutil.copyfile(os.path.join(iconsDir, "icon-32.png"), os.path.join(buildDir, "icons", "icon-32.png"))
    shutil.copyfile(os.path.join(iconsDir, "icon-48.png"), os.path.join(buildDir, "icons", "icon-48.png"))
else:
    shutil.copyfile(os.path.join(iconsDir, "wip-icon-32.png"), os.path.join(buildDir, "icons", "icon-32.png"))
    shutil.copyfile(os.path.join(iconsDir, "wip-icon-48.png"), os.path.join(buildDir, "icons", "icon-48.png"))

shutil.copyfile(os.path.join(iconsDir, "LeftPaneIcon.svg"), os.path.join(buildDir, "icons", "LeftPaneIcon.svg"))
shutil.copyfile(os.path.join(iconsDir, "RightPaneIcon.svg"), os.path.join(buildDir, "icons", "RightPaneIcon.svg"))
shutil.copyfile(os.path.join(iconsDir, "TopPaneIcon.svg"), os.path.join(buildDir, "icons", "TopPaneIcon.svg"))
shutil.copyfile(os.path.join(iconsDir, "BottomPaneIcon.svg"), os.path.join(buildDir, "icons", "BottomPaneIcon.svg"))
    
# Run webpack to build the extension
print("> Running webpack")
os.system("npx webpack")    

# Copy the src directory and the subfolders content to the build directory root
print("> Copying src directory")
src_root_files = ["background.js", "manifest.json"]
for file in src_root_files:
    shutil.copyfile(os.path.join(srcDir, file), os.path.join(buildDir, file))

split_view_directory = os.path.join(srcDir, "split-view")
split_view_files = ["content-script.js", "split-view.html", "styles.css"]
for file in split_view_files:
    shutil.copyfile(os.path.join(split_view_directory, file), os.path.join(buildDir, file))

popup_directory = os.path.join(srcDir, "popup")
popup_files = ["popup.html", "popup.js"]
for file in popup_files:
    shutil.copyfile(os.path.join(popup_directory, file), os.path.join(buildDir, file))

# Compress into a zip file
shutil.make_archive(os.path.join(baseDir, "extension"), 'zip', os.path.join(baseDir, "build"))
print("\nPackaging complete")

if isPackagingForPublish:
    print("\nPush changes to github ?")
    push = input("> (y/n): ")
    if push == "y":
        os.system("git add .")
        os.system("git commit -m \"Version " + newVersion + "\"")
        os.system("git push origin master")
        print("Changes pushed to github")

    print("\nSend a new version here : https://addons.mozilla.org/fr/developers/addon/split-tabs/versions/submit/")
    