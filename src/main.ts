import { Plugin, TAbstractFile, TFile, Notice, Menu } from "obsidian";
import { PinboxSettingTab, PinboxSettings, DEFAULT_SETTINGS } from "./settings";
import { processPlaceholders } from "./utils";

// Interfaces for improved type safety when accessing the internal Bookmarks plugin
interface ObsidianBookmarkItem {
  type: "file" | "group" | "search" | "url" | string; // Allow other types
  path?: string; // for type: 'file'
  title?: string;
  // other properties that might exist
}

interface ObsidianBookmarksPluginInstance {
  getBookmarks: () => ObsidianBookmarkItem[];
}

export default class PinboxPlugin extends Plugin {
  settings: PinboxSettings;

  private async appendContentToNote(
    notePath: string,
    customFormat: string,
    shareText: string,
    noteNameForDisplay: string
  ) {
    const formattedText = processPlaceholders(customFormat, shareText);

    if (this.settings.debugMode) {
      new Notice(
        `Saving to ${noteNameForDisplay}...\n${formattedText.substring(
          0,
          100
        )}...`
      );
    }

    try {
      await this.app.vault.adapter.append(notePath, formattedText);
      new Notice(`Content saved to ${noteNameForDisplay}`);

      if (this.settings.goToNoteAfterSave) {
        const abstractFile = this.app.vault.getAbstractFileByPath(notePath);
        if (abstractFile instanceof TFile) {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(abstractFile);
        } else {
          new Notice(
            `Error: Note "${noteNameForDisplay}" not found at path: ${notePath}`
          );
        }
      }
    } catch (error) {
      new Notice(
        `Failed to save to ${noteNameForDisplay}. See console for details.`
      );
      console.error("Pinbox Error:", error);
    }
  }

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new PinboxSettingTab(this.app, this));

    // Register share menu on the mobile app
    this.registerEvent(
      this.app.workspace.on(
        //@ts-ignore
        "receive-text-menu",
        (menu: Menu, shareText: string) => {
          const hasPinnedNotes = this.settings.pinnedNotes.length > 0;

          const bookmarkedFilePaths: string[] = [];
          if (this.settings.enableObsidianBookmark) {
            // @ts-ignore
            const bookmarksPlugin =
              this.app.internalPlugins?.plugins["bookmarks"];
            if (
              bookmarksPlugin &&
              bookmarksPlugin.enabled &&
              bookmarksPlugin.instance
            ) {
              const bookmarksInstance =
                bookmarksPlugin.instance as ObsidianBookmarksPluginInstance;
              const bookmarkedItems: ObsidianBookmarkItem[] =
                bookmarksInstance.getBookmarks();

              for (const item of bookmarkedItems) {
                if (item.type === "file") {
                  const file = this.app.vault.getAbstractFileByPath(item.path);
                  if (file instanceof TFile) {
                    bookmarkedFilePaths.push(file.path);
                  }
                }
              }
            }
          }
          const hasBookmarkedNotes = bookmarkedFilePaths.length > 0;

          if (!hasPinnedNotes && !hasBookmarkedNotes) return;

          if (hasPinnedNotes) {
            menu.addSeparator();
            this.settings.pinnedNotes.forEach((pinnedNote) => {
              menu.addItem((item) => {
                const noteName = pinnedNote.path
                  .split("/")
                  .pop()
                  ?.replace(".md", "");
                item
                  .setTitle(`Append to ${noteName}`)
                  .setIcon("pin")
                  .onClick(async () => {
                    await this.appendContentToNote(
                      pinnedNote.path,
                      pinnedNote.customFormat,
                      shareText,
                      noteName || "Pinned Note"
                    );
                  });
              });
            });
          }

          if (hasBookmarkedNotes) {
            menu.addSeparator();
            bookmarkedFilePaths.forEach((notePath) => {
              menu.addItem((item) => {
                const noteName = notePath.split("/").pop()?.replace(".md", "");
                item
                  .setTitle(`Append to ${noteName}`)
                  .setIcon("bookmark")
                  .onClick(async () => {
                    // For bookmarked notes, we use a default format as they
                    // don't have custom formats stored in this plugin's
                    // settings.
                    await this.appendContentToNote(
                      notePath,
                      this.settings.globalDefaultFormat,
                      shareText,
                      noteName || "Bookmarked Note"
                    );
                  });
              });
            });
          }
        }
      )
    );

    this.registerEvent(
      this.app.vault.on("rename", this.handleFileRename.bind(this))
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    let settingsWereModified = false;

    // Ensure globalDefaultFormat exists (for migration from older versions)
    if (typeof this.settings.globalDefaultFormat === "undefined") {
      this.settings.globalDefaultFormat = DEFAULT_SETTINGS.globalDefaultFormat; // Use the one from DEFAULT_SETTINGS
      settingsWereModified = true;
    }

    if (this.settings.pinnedNotes) {
      this.settings.pinnedNotes.forEach((pn) => {
        if (typeof pn.customFormat === "undefined") {
          // Initialize with global default
          pn.customFormat = this.settings.globalDefaultFormat;
          settingsWereModified = true;
        }
      });
    }
    if (settingsWereModified) {
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async handleFileRename(file: TAbstractFile, oldPath: string) {
    if (!(file instanceof TFile)) return;

    let settingsChanged = false;

    this.settings.pinnedNotes.forEach((pinnedNote) => {
      if (pinnedNote.path === oldPath) {
        pinnedNote.path = file.path;
        settingsChanged = true;
        new Notice(`Pinned note path "${oldPath}" updated to "${file.path}".`);
      }
    });

    if (settingsChanged) {
      await this.saveSettings();
    }
  }
}
