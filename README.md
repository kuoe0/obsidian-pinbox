# Pinbox for Obsidian

Pinbox is an Obsidian plugin designed to instantly capture content like text snippets and URLs from your mobile device directly into pre-configured notes within your vault. **It streamlines your workflow by reducing the friction of saving information on the go.**

## Features

*   **Pin Notes for Quick Share on Mobile:** Designate specific notes as "pinned" targets for quick saving in the Obsidian share menu on Android/iOS to append text or links to your pinned notes instantly.
*   **Obsidian Bookmarks Integration:** Include your Obsidian bookmarked notes (file bookmarks only) in the share menu for even broader quick-capture capabilities.
*   **Global Custom Format:** Define a default template for how shared content (the `{{content}}` placeholder) is appended. Supports `{{timestamp}}`, `{{date}}`, and `{{time}}`.
*   **Per-Note Custom Format:** Override the global default and set a unique append format for each individual pinned note.
*   **Path Auto-Update:** Pinned note paths are automatically updated if you rename or move the file within Obsidian.

## Screenshots

| Screenshot 1 | Screenshot 2 | Screenshot 3 |
| --- | --- | --- |
| ![Screenshot 1](https://github.com/kuoe0/obsidian-pinbox/blob/master/assets/screenshot-1.png?raw=true) | ![Screenshot 2](https://github.com/kuoe0/obsidian-pinbox/blob/master/assets/screenshot-2.png?raw=true) | ![Screenshot 3](https://github.com/kuoe0/obsidian-pinbox/blob/master/assets/screenshot-3.png?raw=true) |


## Settings Overview

The Pinbox settings tab allows you to:

*   **Configure Global Default Note Format:** Set the universal template for appending content. Includes a text area for the format string, and buttons to reset to default or copy the format.
*   **Pin a new note:** Opens a modal to search and add notes to your quick-share list.
*   **Manage Pinned Notes:**
    *   View your list of pinned notes.
    *   For each pinned note:
        *   See its name and path.
        *   Reorder it in the list using up/down arrows.
        *   Edit its individual custom append format (with reset and copy options).
        *   Unpin the note using the trash icon.
*   **Toggle Obsidian Bookmark Integration:** Enable or disable "Show bookmarked notes in share menu".
*   **Toggle Debug Mode:** If enabled, shows extra notices for troubleshooting, e.g., when saving shared text.
*   **Toggle Go to Note After Saving:** If enabled, automatically opens the target note in Obsidian after successfully appending shared text.

## Installation

### From Obsidian Community Plugins (Recommended)

1.  Open Obsidian and go to `Settings`.
2.  Navigate to `Community plugins`.
3.  Ensure "Restricted mode" is **off**.
4.  Click `Browse` to open the community plugins browser.
5.  Search for "Pinbox".
6.  Click `Install` on the Pinbox plugin.
7.  Once installed, click `Enable`.

### Using BRAT (Beta Reviewer's Auto-update Tool)

If you want to test beta versions of the plugin before they are officially released:

1.  Install and enable the "Beta Reviewer's Auto-update Tool" (BRAT) community plugin in Obsidian.
2.  Open BRAT settings.
3.  Under "Add Beta Plugin", click "Add Beta Plugin".
4.  Enter the GitHub repository URL for Pinbox: `kuoe0/obsidian-pinbox`.
5.  Click "Add Plugin".
6.  Once added, go to `Settings` > `Community plugins`, find "Pinbox" in the list, and enable it.

### Manual Installation

1.  Download the latest release assets (`main.js`, `manifest.json`) from the Releases page of the Pinbox GitHub repository.
2.  In your Obsidian vault, navigate to your vault's configuration folder, which is usually `.obsidian` (it might be hidden).
3.  Inside `.obsidian`, create a folder named `plugins` if it doesn't already exist.
4.  Inside the `plugins` folder, create a new folder named `pinbox`.
5.  Copy the downloaded `main.js` and `manifest.json` files into the `pinbox` folder.
6.  Restart Obsidian.
7.  Go to `Settings` > `Community plugins`, find "Pinbox" in the list, and enable it.

## Funding

If you find Pinbox useful and would like to support its development, you can:

<a href="https://coff.ee/kuoe0" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

Or visit: https://coff.ee/kuoe0

## Author

**kuoe0**
(https://github.com/kuoe0)
