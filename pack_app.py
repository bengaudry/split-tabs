import os
import sys
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
            
if isPackagingForPublish:
    print("Packaging for publish")
else:
    print("Packaging for development")
    
    
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
    print("Creating build directory")
    os.mkdir(buildDir)
    
# Create the icons directory in the build directory
os.mkdir(os.path.join(buildDir, "icons"))
    
# Copy the icons directory to the build directory
print("Copying icons directory")
if isPackagingForPublish:
    shutil.copyfile(os.path.join(iconsDir, "icon-32.png"), os.path.join(buildDir, "icons", "icon-32.png"))
    shutil.copyfile(os.path.join(iconsDir, "icon-48.png"), os.path.join(buildDir, "icons", "icon-48.png"))
else:
    shutil.copyfile(os.path.join(iconsDir, "wip-icon-32.png"), os.path.join(buildDir, "icons", "icon-32.png"))
    shutil.copyfile(os.path.join(iconsDir, "wip-icon-48.png"), os.path.join(buildDir, "icons", "icon-48.png"))
    
# Copy the src directory to the build directory
print("Copying src directory")
shutil.copyfile(os.path.join(srcDir, "background.js"), os.path.join(buildDir, "background.js"))
shutil.copyfile(os.path.join(srcDir, "content-script.js"), os.path.join(buildDir, "content-script.js"))
shutil.copyfile(os.path.join(srcDir, "manifest.json"), os.path.join(buildDir, "manifest.json"))
shutil.copyfile(os.path.join(srcDir, "split-view.html"), os.path.join(buildDir, "split-view.html"))
shutil.copyfile(os.path.join(srcDir, "split-view.js"), os.path.join(buildDir, "split-view.js"))
shutil.copyfile(os.path.join(srcDir, "styles.css"), os.path.join(buildDir, "styles.css"))

# Compress into a zip file
shutil.make_archive(os.path.join(baseDir, "extension"), 'zip', os.path.join(baseDir, "build"))
print("Packaging complete")
