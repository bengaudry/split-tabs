# Firefox Split View

SplitView is a Firefox Addon that can display two websites in a split view.

It can be found on the [Firefox Addons Marketplace]("https://addons.mozilla.org/fr/firefox/addon/splitview/").

## How to contribute

Fork the project and clone it on your machine using

```sh
git clone https://github.com/<your_username>/firefox-split-view
```

Add some modifications and then, build the extension using :

```sh
./pack_app.bat
```

Then in firefox, go to [Firefox debugging page]("about:debugging#/runtime/this-firefox") and click load complementary module.

Select the extension.zip that you created before and there you go.
