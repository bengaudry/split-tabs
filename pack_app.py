import json
import os
import shutil
import subprocess as sp
import sys

from colorama import Fore, Style
from halo import Halo

# CONSTANTS

# Strings
ADDON_TITLE = "Split Tabs"

# Directories paths
BASE_DIR_PATH = os.path.dirname(os.path.abspath(__file__))
ICONS_DIR_PATH = os.path.join(BASE_DIR_PATH, "icons")
SRC_DIR_PATH = os.path.join(BASE_DIR_PATH, "src")
BUILD_DIR_PATH = os.path.join(BASE_DIR_PATH, "build")

# Files paths
MANIFEST_FILE_PATH = os.path.join(SRC_DIR_PATH, "manifest.json")


# GLOBAL VARIABLES

spinner: Halo = Halo(text="", spinner="dots")


# FUNCTIONS


def exit_with_error(message: str, error: Exception = None):
    """Prints an error message and exits the program"""

    spinner.fail(message)

    print(Fore.RED)
    print("\nFailed to build extension, terminating...\n")

    if error:
        print(str(error))

    print(Style.RESET_ALL)

    restore_build_dir_from_backup()
    sys.exit(1)


def open_in_firefox(url: str):
    """Opens the given URL in Firefox browser"""

    try:
        if sys.platform == "linux":
            sp.run(["firefox", "-url", url])
        elif sys.platform == "darwin":
            sp.run(["open", "-a", "Firefox", url])
        elif sys.platform == "win32":
            sp.run(["C:\\Program Files\\Mozilla Firefox\\firefox.exe", "-url", url])
        else:
            print(f"Unsupported platform: {sys.platform}. Please open {url} manually.")
    except FileNotFoundError:
        print(f"Could not find Firefox. Please open {url} manually.")


def print_packaging_method(is_packaging_for_publish: bool):
    """Prints the packaging method"""

    if is_packaging_for_publish:
        print(">> Packaging for publish <<\n")
    else:
        print(">> Packaging for development <<\n")


def read_current_manifest() -> dict:
    """Reads the current manifest file and returns it as a dictionary"""

    spinner.start("Reading current manifest file\n")
    try:
        with open(MANIFEST_FILE_PATH, "r") as f:
            manifest = f.read()
            manifest = json.loads(manifest)
            spinner.succeed()
            return manifest
    except Exception as e:
        exit_with_error("Error reading manifest file", e)


def ask_new_addon_version(currentVersion: str) -> str:
    """Asks the user for a new addon version"""

    print("Current version of the extension: " + currentVersion)
    newVersion = input("Enter new version number:\n> ")
    return newVersion


def update_manifest_data(manifest: dict, is_packaging_for_publish: bool):
    """Updates the manifest data (title and version) based on the packaging method"""

    # Ask new version number if packaging for publish
    if is_packaging_for_publish:
        manifest["version"] = ask_new_addon_version(manifest["version"])
        manifest["name"] = ADDON_TITLE
    else:
        manifest["name"] = ADDON_TITLE + " - Development"

    return manifest


def export_manifest_to_build_dir(manifest: dict):
    """Exports the updated manifest to the build directory"""

    spinner.start("Exporting manifest to build directory\n")
    manifest_path_in_build_dir = os.path.join(BUILD_DIR_PATH, "manifest.json")
    try:
        with open(manifest_path_in_build_dir, "w") as f:
            json.dump(manifest, f, indent=4)
        spinner.succeed()
    except Exception as e:
        exit_with_error("Error exporting manifest", e)


def create_build_dir_backup():
    """Creates a backup of the build directory"""

    if build_dir_exists():
        spinner.start("Creating build directory backup\n")
        backup_path = BUILD_DIR_PATH + "_backup"

        try:
            if os.path.exists(backup_path):
                shutil.rmtree(backup_path)
            shutil.copytree(BUILD_DIR_PATH, backup_path)
            spinner.succeed()
        except Exception as e:
            exit_with_error("Error creating build directory backup", e)


def remove_build_dir_backup():
    """Removes the backup of the build directory"""

    backup_path = BUILD_DIR_PATH + "_backup"
    if os.path.exists(backup_path):
        spinner.start("Removing build directory backup\n")

        try:
            shutil.rmtree(backup_path)
            spinner.succeed()
        except Exception as e:
            exit_with_error("Error removing build directory backup", e)


def build_dir_exists() -> bool:
    """Checks if the build directory exists"""

    return os.path.exists(BUILD_DIR_PATH) and os.path.isdir(BUILD_DIR_PATH)


def create_build_dir_if_not_exists():
    """Creates the build directory if it does not exist"""

    if not build_dir_exists():
        spinner.start("Creating build directory\n")
        os.mkdir(BUILD_DIR_PATH)
        spinner.succeed()


def clear_build_dir():
    """Clears the build directory"""

    try:
        if build_dir_exists():
            spinner.start("Clearing build directory\n")
            for root, dirs, files in os.walk(BUILD_DIR_PATH, topdown=False):
                for file in files:
                    os.remove(os.path.join(root, file))
                for dir in dirs:
                    os.rmdir(os.path.join(root, dir))
            spinner.succeed()
    except Exception as e:
        exit_with_error("Error clearing build directory", e)


def prepare_build_dir():
    """Prepares the build directory by creating or cleaning it"""

    if build_dir_exists():
        create_build_dir_backup()
        clear_build_dir()
    else:
        create_build_dir_if_not_exists()

    # Create the icons directory in the build directory
    os.mkdir(os.path.join(BUILD_DIR_PATH, "icons"))


def remove_old_extension_zip_if_exists(is_packaging_for_publish: bool):
    """Removes the old extension.zip file if it exists"""

    if not is_packaging_for_publish:
        old_extension_zip_path = os.path.join(BASE_DIR_PATH, "extension.zip")
        try:
            if os.path.exists(old_extension_zip_path) and os.path.isfile(old_extension_zip_path):
                spinner.start("Cleaning up old extension.zip")
                os.remove(old_extension_zip_path)
                spinner.succeed()
        except Exception as e:
            exit_with_error("Error removing old extension.zip", e)


def restore_build_dir_from_backup():
    """Restores the build directory from its backup"""

    backup_path = BUILD_DIR_PATH + "_backup"
    if os.path.exists(backup_path):
        spinner.start("Restoring build directory from backup\n")

        try:
            if build_dir_exists():
                shutil.rmtree(BUILD_DIR_PATH)
            shutil.copytree(backup_path, BUILD_DIR_PATH)
            spinner.succeed()
        except Exception as e:
            exit_with_error("Error restoring build directory from backup", e)


def copy_icons_to_build_dir(is_packaging_for_publish: bool):
    """Copies the icons to the build directory based on the packaging method"""

    # Copy the icons directory to the build directory
    spinner.start("Copying icons directory\n")

    icons_map = {
        "icon-32.png": "icon-32.png",
        "icon-48.png": "icon-48.png",
        "browser-action-icon.svg": "browser-action-icon.svg",
    }

    if not is_packaging_for_publish:
        # change icons for development version
        icons_map["icon-32.png"] = "wip-icon-32.png"
        icons_map["icon-48.png"] = "wip-icon-48.png"
        icons_map["browser-action-icon.svg"] = "wip-browser-action-icon.svg"

    try:
        # copy icons to build/icons
        for dest_icon, src_icon in icons_map.items():
            shutil.copyfile(
                os.path.join(ICONS_DIR_PATH, src_icon),
                os.path.join(BUILD_DIR_PATH, "icons", dest_icon),
            )
        spinner.succeed()
    except Exception as e:
        exit_with_error("Error copying icons", e)


def change_dev_value_in_constants_file(is_dev: bool):
    """Changes the value of IS_DEV in the constants.ts file"""

    spinner.start("Updating constants file\n")

    constants_file_path = os.path.join(SRC_DIR_PATH, "utils", "constants.ts")
    try:
        with open(constants_file_path, "r") as f:
            lines = f.readlines()

        with open(constants_file_path, "w") as f:
            for line in lines:
                if line.startswith("export const IS_DEV"):
                    f.write(f"export const IS_DEV = {str(is_dev).lower()};\n")
                else:
                    f.write(line)

        spinner.succeed()
    except Exception as e:
        exit_with_error("Error updating constants file", e)


def copy_src_files_to_build_dir():
    """Copy the src directory and the subfolders content to the build directory root"""

    spinner.start("Copying src directory\n")

    src_root_files = ["manifest.json"]
    for file in src_root_files:
        shutil.copyfile(os.path.join(SRC_DIR_PATH, file), os.path.join(BUILD_DIR_PATH, file))

    split_view_directory = os.path.join(SRC_DIR_PATH, "split-view")
    split_view_files = ["content-script.js", "split-view.html", "styles.css"]
    for file in split_view_files:
        shutil.copyfile(os.path.join(split_view_directory, file), os.path.join(BUILD_DIR_PATH, file))

    popup_directory = os.path.join(SRC_DIR_PATH, "popup")
    popup_files = ["popup.html", "popup.js"]
    for file in popup_files:
        shutil.copyfile(os.path.join(popup_directory, file), os.path.join(BUILD_DIR_PATH, file))

    settings_directory = os.path.join(SRC_DIR_PATH, "settings")
    settings_files = ["settings.html", "settings.js"]
    for file in settings_files:
        shutil.copyfile(os.path.join(settings_directory, file), os.path.join(BUILD_DIR_PATH, file))

    styles_directory = os.path.join(SRC_DIR_PATH, "styles")
    styles_files = ["reset.css"]
    for file in styles_files:
        shutil.copyfile(os.path.join(styles_directory, file), os.path.join(BUILD_DIR_PATH, file))

    spinner.succeed()


def copy_files_to_dir(is_packaging_for_publish: bool):
    """Copies necessary files to the build directory"""

    try:
        copy_src_files_to_build_dir()
    except Exception as e:
        exit_with_error("Error copying src files: ", e)

    try:
        copy_icons_to_build_dir(is_packaging_for_publish)
    except Exception as e:
        exit_with_error("Error copying icons: ", e)


def run_webpack():
    """Runs webpack to build the extension"""

    spinner.start("Running webpack\n")
    os.system("npx webpack")
    spinner.succeed()


def compress_build_dir(is_packaging_for_publish: bool, newVersion: str):
    """Compresses the build directory into a zip file based on the packaging method"""

    spinner.start("Compressing build directory\n")

    # Compress into a zip file
    if is_packaging_for_publish:
        zip_path = os.path.join(BASE_DIR_PATH, "packages", newVersion)
    else:
        zip_path = os.path.join(BASE_DIR_PATH, "extension")

    shutil.make_archive(zip_path, "zip", BUILD_DIR_PATH)
    spinner.succeed()


def main():
    if len(sys.argv) != 1 and len(sys.argv) != 2:
        print("Usage: python pack_app.py [-p: publish]")
        sys.exit(1)

    is_packaging_for_publish = len(sys.argv) == 2 and sys.argv[1] == "-p"
    print_packaging_method(is_packaging_for_publish)

    remove_old_extension_zip_if_exists(is_packaging_for_publish)

    prepare_build_dir()
    change_dev_value_in_constants_file(not is_packaging_for_publish)
    run_webpack()
    copy_files_to_dir(is_packaging_for_publish)

    manifest = read_current_manifest()
    updated_manifest = update_manifest_data(manifest, is_packaging_for_publish)
    export_manifest_to_build_dir(updated_manifest)

    compress_build_dir(is_packaging_for_publish, updated_manifest["version"])

    if is_packaging_for_publish:
        print("\nPush changes to github ?")
        push = input("> (y/n): ")
        if push == "y":
            os.system("git add .")
            os.system('git commit -m "Version ' + updated_manifest["version"] + '"')
            os.system("git push origin master")
            print("Changes pushed to github")
        open_in_firefox("https://addons.mozilla.org/fr/developers/addon/split-tabs/versions/submit/")
    else:
        open_in_firefox("about:debugging#/runtime/this-firefox")

    remove_build_dir_backup()

    print("\nPackaging complete")


if __name__ == "__main__":
    main()
