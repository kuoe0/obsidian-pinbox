import { Plugin, TAbstractFile, TFile, Notice, Menu, moment } from "obsidian";
import { PinboxSettingTab, PinboxSettings, DEFAULT_SETTINGS } from "./settings";
import { processPlaceholders } from "./utils";

// Interfaces for improved type safety when accessing the internal Bookmarks plugin
interface ObsidianBookmarkItem {
  type: string; // "file" | "group" | "search" | "url" | string - simplified to string to avoid lint error
  path?: string; // for type: 'file'
  title?: string;
  // other properties that might exist
}

interface ObsidianBookmarksPluginInstance {
  getBookmarks: () => ObsidianBookmarkItem[];
}

interface ObsidianInternalPlugin {
  enabled: boolean;
  instance: ObsidianBookmarksPluginInstance;
}

interface ObsidianInternalPlugins {
  plugins: {
    [id: string]: ObsidianInternalPlugin;
  };
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
            const internalPlugins = (this.app as any).internalPlugins as ObsidianInternalPlugins | undefined;
            const bookmarksPlugin = internalPlugins?.plugins["bookmarks"];
            if (
              bookmarksPlugin &&
              bookmarksPlugin.enabled &&
              bookmarksPlugin.instance
            ) {
              const bookmarksInstance = bookmarksPlugin.instance;
              const bookmarkedItems: ObsidianBookmarkItem[] =
                bookmarksInstance.getBookmarks();

              for (const item of bookmarkedItems) {
                if (item.type === "file" && item.path) {
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
                const isDynamic = pinnedNote.path.includes("{{");
                let resolvedPath = pinnedNote.path;
                let noteName = "";

                if (pinnedNote.path === "{{daily}}") {
                  noteName = "Today's Daily Note";
                  const dailyPath = this.getDailyNotePath();
                  resolvedPath = dailyPath || "";
                } else {
                  noteName = pinnedNote.path.split("/").pop()?.replace(".md", "") || "Pinned note";
                  resolvedPath = processPlaceholders(pinnedNote.path);
                }

                const fileExists = resolvedPath ? (this.app.vault.getAbstractFileByPath(resolvedPath) instanceof TFile) : false;
                const title = (fileExists || isDynamic) ? `Append to ${noteName}` : `Append to ${noteName} (Missing)`;
                
                let icon = "pin";
                if (pinnedNote.path === "{{daily}}") {
                  icon = "calendar";
                } else if (!fileExists && !isDynamic) {
                  icon = "alert-triangle";
                }

                item
                  .setTitle(title)
                  .setIcon(icon)
                  .onClick(async () => {
                    if (!resolvedPath) {
                      new Notice("Error: Resolved path is empty or invalid.");
                      return;
                    }

                    if (!fileExists && !isDynamic) {
                      new Notice(`Error: Note "${noteName}" not found at path: ${pinnedNote.path}`);
                      return;
                    }

                    // Ensure the file exists for dynamic paths
                    let file = this.app.vault.getAbstractFileByPath(resolvedPath);
                    if (!(file instanceof TFile)) {
                      if (pinnedNote.path === "{{daily}}" || resolvedPath === this.getDailyNotePath()) {
                        file = await this.createDailyNoteWithTemplate();
                      }
                      if (!(file instanceof TFile)) {
                        file = await this.createFileRecursively(resolvedPath);
                      }
                    }

                    if (file instanceof TFile) {
                      await this.appendContentToNote(
                        file.path,
                        pinnedNote.customFormat,
                        shareText,
                        noteName
                      );
                    } else {
                      new Notice(`Error: Failed to create or open note at: ${resolvedPath}`);
                    }
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
                      noteName || "Bookmarked note"
                    );
                  });
              });
            });
          }
        }
      )
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.handleFileRename(file, oldPath))
    );

    this.addCommand({
      id: "pin-current-note",
      name: "Pin current note",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile instanceof TFile) {
          if (!checking) {
            this.pinNote(activeFile);
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "unpin-current-note",
      name: "Unpin current note",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile instanceof TFile) {
          const isPinned = this.settings.pinnedNotes.some(
            (pn) => pn.path === activeFile.path
          );
          if (isPinned) {
            if (!checking) {
              this.unpinNote(activeFile);
            }
            return true;
          }
        }
        return false;
      },
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<PinboxSettings>);

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

  private async pinNote(file: TFile) {
    const isAlreadyPinned = this.settings.pinnedNotes.some(
      (pn) => pn.path === file.path
    );
    if (isAlreadyPinned) {
      new Notice(`"${file.basename}" is already pinned.`);
      return;
    }

    this.settings.pinnedNotes.push({
      path: file.path,
      customFormat: this.settings.globalDefaultFormat,
    });
    await this.saveSettings();
    new Notice(`Pinned "${file.basename}"`);
  }

  private async unpinNote(file: TFile) {
    const index = this.settings.pinnedNotes.findIndex(
      (pn) => pn.path === file.path
    );
    if (index === -1) {
      new Notice(`"${file.basename}" is not pinned.`);
      return;
    }

    this.settings.pinnedNotes.splice(index, 1);
    await this.saveSettings();
    new Notice(`Unpinned "${file.basename}"`);
  }

  public getDailyNotePath(): string | null {
    // 1. Check Periodic Notes first
    const periodicNotes = (this.app as any).plugins?.plugins["periodic-notes"];
    if (periodicNotes && periodicNotes.settings?.daily?.enabled) {
      const dailyConfig = periodicNotes.settings.daily;
      const folder = dailyConfig.folder ? dailyConfig.folder.trim() : "";
      const format = dailyConfig.format || "YYYY-MM-DD";
      const fileName = moment().format(format) + ".md";
      return folder ? `${folder}/${fileName}` : fileName;
    }

    // 2. Check Core Daily Notes plugin
    const dailyNotes = (this.app as any).internalPlugins?.plugins["daily-notes"];
    if (dailyNotes && dailyNotes.enabled) {
      const dailyConfig = dailyNotes.instance?.options;
      if (dailyConfig) {
        const folder = dailyConfig.folder ? dailyConfig.folder.trim() : "";
        const format = dailyConfig.format || "YYYY-MM-DD";
        const fileName = moment().format(format) + ".md";
        return folder ? `${folder}/${fileName}` : fileName;
      }
    }

    return null;
  }

  private async createDailyNoteWithTemplate(): Promise<TFile | null> {
    // 1. Try Core Daily Notes creation
    const dailyNotes = (this.app as any).internalPlugins?.plugins["daily-notes"];
    if (dailyNotes && dailyNotes.enabled && dailyNotes.instance?.createDailyNote) {
      try {
        const file = await dailyNotes.instance.createDailyNote(moment());
        if (file instanceof TFile) return file;
      } catch (err) {
        console.error("Pinbox failed to create daily note via core Daily Notes plugin:", err);
      }
    }

    // 2. Try Periodic Notes daily note creation
    const periodicNotes = (this.app as any).plugins?.plugins["periodic-notes"];
    if (periodicNotes && periodicNotes.settings?.daily?.enabled) {
      try {
        if (typeof periodicNotes.createDailyNote === "function") {
          const file = await periodicNotes.createDailyNote(moment());
          if (file instanceof TFile) return file;
        }
      } catch (err) {
        console.error("Pinbox failed to create daily note via Periodic Notes:", err);
      }
    }

    return null;
  }

  private async createFileRecursively(path: string): Promise<TFile | null> {
    try {
      const parentPath = path.substring(0, path.lastIndexOf("/"));
      if (parentPath) {
        const parts = parentPath.split("/");
        let currentPath = "";
        for (const part of parts) {
          if (!part) continue;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!(this.app.vault.getAbstractFileByPath(currentPath))) {
            await this.app.vault.createFolder(currentPath);
          }
        }
      }
      
      return await this.app.vault.create(path, "");
    } catch (err) {
      console.error(`Pinbox: failed to create file recursively at ${path}:`, err);
      return null;
    }
  }
}
