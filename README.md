# Firefox Split View

SplitView is a Firefox Addon that can display two websites in a split view.

It can be found on the [Firefox Addons Marketplace]("https://addons.mozilla.org/fr/firefox/addon/splitview/").


## How to contribute

Fork the project and clone it on your machine using

```sh
git clone https://github.com/<your_username>/firefox-split-view
```

Add some modifications and then, build the extension using the `pack_app.py` script.

Before running the script, create a Python virtual environment and install dependencies:

```sh
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Now, run the script:

```sh
python pack_app.py
```

Then in firefox, go to [Firefox debugging page]("about:debugging#/runtime/this-firefox") and click load complementary module.

Select the extension.zip that you created before and there you go.


## Generate a publishable version

Just run this command : 

```sh
python pack_app.py -p
```

And it will generate a _extension.zip_ archive that can be uploaded to mozilla addons.


## Versions handling

The version can be found in _src/manifest.json_.
The format is _x.y.z_, 
- x is the major version (currently 1)
- y is the minor version (incremented for new features)
- z if the number of fixes for the minor version

## Events explanation

- background.js
    - *INIT_EXT*: Initialize extension, args={side: "left" | "right" | "top" | "bottom"}
    - *FETCH_TABS*: No args required, sends a *TABS_DATA* event in response
    - *UPDATE_TABS*: Has to be called whenever the urls change in the split view to update global variables in background args={leftUrl, rightUrl}
    - *CLOSE_SPLIT*: Close the split view and opens the keep url in a new tab args={keep: "left" | "right"}
    - *OPEN_SETTINGS*: Opens the settings page, no args required
    - *EDIT_SETTINGS*: Edit the extension setting at key with value args={key, value}
    - *GET_SETTING*: Returns the value of the setting at key in a *SETTING_VALUE* event args={key} 
