import { App, Notice, PluginSettingTab, Setting, TFile, Component } from "obsidian";
import PinboxPlugin from "./main";
import { NoteSuggesterModal } from "./modals";
import { FormatEditor, FormatEditorOptions } from "./components/FormatEditor";

export interface PinnedNote {
  path: string;
  customFormat: string;
}
export interface PinboxSettings {
  pinnedNotes: PinnedNote[];
  globalDefaultFormat: string;
  debugMode: boolean;
  goToNoteAfterSave: boolean;
  enableObsidianBookmark: boolean;
}
export const DEFAULT_PINNED_NOTE_FORMAT =
  "\n\n---\n{{content}}\n@ {{timestamp}}\n\n---\n";

export const DEFAULT_SETTINGS: PinboxSettings = {
  pinnedNotes: [],
  debugMode: false,
  goToNoteAfterSave: false,
  enableObsidianBookmark: false,
  globalDefaultFormat: DEFAULT_PINNED_NOTE_FORMAT,
};

export class PinboxSettingTab extends PluginSettingTab {
  plugin: PinboxPlugin;
  component: Component;

  constructor(app: App, plugin: PinboxPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private createFormatEditor(
    containerEl: HTMLElement,
    options: Omit<FormatEditorOptions, "app" | "plugin" | "component">
  ): void {
    new FormatEditor(containerEl, {
      ...options,
      app: this.app,
      component: this.component,
    });
  }

  private async handleFormatChange(
    saveFunction: (value: string) => void,
    value: string,
    refreshDisplay: boolean
  ) {
    saveFunction(value);
    await this.plugin.saveSettings();
    if (refreshDisplay) {
      this.display();
    }
  }

  hide() {
    super.hide();
    if (this.component) this.component.unload();
  }

  display(): void {
    const { containerEl } = this;
    // Store the current scroll position
    const scrollPosition = containerEl.scrollTop;

    containerEl.empty();
    
    this.component = new Component();

    containerEl.createEl("p", {
      text: "Pinbox allows you to pin notes for quick access when sharing links or text on Android/iOS.",
    });

    containerEl.createEl("p", {
      text: "If you like this plugin, please consider supporting my work:",
    });

    const coffeeDiv = containerEl.createDiv({ cls: "coffee-div" });
    coffeeDiv
      .createEl("a", {
        attr: { href: "https://www.buymeacoffee.com/kuoe0", target: "_blank" },
      })
      .createEl("img", {
        attr: {
          class: "coffee-button",
          src: "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png",
          alt: "Buy me a coffee",
        },
      });

    // Create the outer container for global format setting
    const globalFormatSettingItem = containerEl.createDiv({
      cls: "pinbox-setting-item",
    });

    // Info section (name and description)
    const globalInfoEl = globalFormatSettingItem.createDiv({
      cls: "pinbox-setting-item-info",
    });
    const globalNoteInfoEl = globalInfoEl.createDiv({
      cls: "setting-item-note-info",
    });
    globalNoteInfoEl.createDiv({
      cls: "setting-item-name",
      text: "Global default format",
    });
    globalNoteInfoEl.createDiv({
      cls: "setting-item-description",
      text: "Set the default format for new pins and bookmarked notes. Placeholders: {{content}}, {{timestamp}} (YYYY-MM-DD HH:mm:ss), {{date}} (YYYY-MM-DD), {{time}} (HH:mm:ss).",
    });

    const globalControlEl = globalFormatSettingItem.createDiv({
      cls: "pinbox-setting-item-control",
    });
    const globalControlContainer = globalControlEl.createDiv({
      cls: "pinbox-control-container",
    });
    this.createFormatEditor(globalControlContainer, {
      getCurrentValue: () => this.plugin.settings.globalDefaultFormat,
      onValueChange: async (value) => {
        await this.handleFormatChange(
          (v) => (this.plugin.settings.globalDefaultFormat = v),
          value,
          false
        );
      },
      getResetValue: () => DEFAULT_PINNED_NOTE_FORMAT,
      onResetConfirmed: async () => {
        await this.handleFormatChange(
          (_) =>
            (this.plugin.settings.globalDefaultFormat =
              DEFAULT_PINNED_NOTE_FORMAT),
          DEFAULT_PINNED_NOTE_FORMAT,
          true
        );
      },
      resetTooltipText: "Reset to default format",
      getPreviewData: () => ({
        content: "Sample shared content",
        filePath: "path/to/Sample Note.md",
      }),
    });

    new Setting(containerEl)
      .setName("Pin a new note")
      .setDesc("Add a note to your quick-share list.")
      .addButton((button) => {
        button
          .setIcon("plus-with-circle")
          .setTooltip("Pin a new note")
          .setCta()
          .onClick(() => {
            new NoteSuggesterModal(
              this.app,
              this.plugin.settings.globalDefaultFormat,
              async (file: TFile, newPinnedNote: PinnedNote) => {
                if (
                  this.plugin.settings.pinnedNotes.some(
                    (pn) => pn.path === newPinnedNote.path
                  )
                ) {
                  new Notice(
                    `${newPinnedNote.path
                      .split("/")
                      .pop()
                      ?.replace(".md", "")} is already pinned.`
                  );
                  return;
                }
                // newPinnedNote already has the globalDefaultFormat set by the modal
                this.plugin.settings.pinnedNotes.push(newPinnedNote);
                await this.plugin.saveSettings();
                new Notice(`Pinned "${file.basename}"`);

                // Refresh settings tab
                this.display();
              }
            ).open();
          });
      });

    new Setting(containerEl).setName("Pinned notes").setHeading();

    if (this.plugin.settings.pinnedNotes.length === 0) {
      containerEl.createEl("p", { text: "No notes are pinned yet." });
    } else {
      this.plugin.settings.pinnedNotes.forEach((pinnedNote, index) => {
        const noteName =
          pinnedNote.path.split("/").pop()?.replace(".md", "") || "Note";

        const settingItem = containerEl.createDiv({
          cls: "pinbox-setting-item",
        });

        const infoEl = settingItem.createDiv({
          cls: "pinbox-setting-item-info",
        });

        const noteInfoEl = infoEl.createDiv({ cls: "setting-item-note-info" });
        noteInfoEl.createDiv({ cls: "setting-item-name", text: noteName });
        noteInfoEl.createDiv({
          cls: "setting-item-description",
          text: `Path: ${pinnedNote.path}`,
        });

        // Add move buttons below the name/path
        const moveButtons = infoEl.createDiv({
          cls: "pinbox-move-buttons",
        });

        this.createPinnedNoteControls(moveButtons, index);

        const controlEl = settingItem.createDiv({
          cls: "pinbox-setting-item-control",
        });

        const pinnedNoteControlContainer = controlEl.createDiv({
          cls: "pinbox-control-container",
        });

        this.createFormatEditor(pinnedNoteControlContainer, {
          getCurrentValue: () => pinnedNote.customFormat,
          onValueChange: async (value) => {
            const currentPinnedNote = this.plugin.settings.pinnedNotes[index];
            if (currentPinnedNote) {
              await this.handleFormatChange(
                (v) => (currentPinnedNote.customFormat = v),
                value,
                false
              );
            }
          },
          getResetValue: () => this.plugin.settings.globalDefaultFormat,
          onResetConfirmed: async () => {
            const currentPinnedNote = this.plugin.settings.pinnedNotes[index];
            if (currentPinnedNote) {
              await this.handleFormatChange(
                (v) => (currentPinnedNote.customFormat = v),
                this.plugin.settings.globalDefaultFormat,
                true
              );
            }
          },
          resetTooltipText: "Reset format to global default",
          getPreviewData: () => ({
            content: "Sample content for this note",
            note: pinnedNote,
            filePath: pinnedNote.path,
          }),
          getCopyValue: () => pinnedNote.customFormat,
        });
      });
    }

    containerEl.createEl("hr");

    new Setting(containerEl)
      .setName("Show bookmarked notes in share menu")
      .setDesc(
        "Adds your Obsidian bookmarked notes to the share menu for quick appending. Requires the 'Bookmarks' core plugin."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableObsidianBookmark)
          .onChange(async (value) => {
            this.plugin.settings.enableObsidianBookmark = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Go to note after saving")
      .setDesc(
        "Automatically open the note after successfully appending shared text."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.goToNoteAfterSave)
          .onChange(async (value) => {
            this.plugin.settings.goToNoteAfterSave = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable debug mode")
      .setDesc(
        "Show extra notices for debugging, e.g., when saving shared text."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    // Restore the scroll position after a short delay to allow the DOM to update
    requestAnimationFrame(() => {
      containerEl.scrollTop = scrollPosition;
    });
  }

  private createPinnedNoteControls(
    parentElement: HTMLElement,
    index: number
  ): void {
    new Setting(parentElement)
      .addExtraButton((button) => {
        button
          .setIcon("arrow-up")
          .setTooltip("Move up")
          .setDisabled(index === 0)
          .onClick(async () => {
            if (index > 0) {
              [
                this.plugin.settings.pinnedNotes[index],
                this.plugin.settings.pinnedNotes[index - 1],
              ] = [
                this.plugin.settings.pinnedNotes[index - 1],
                this.plugin.settings.pinnedNotes[index],
              ];
              await this.plugin.saveSettings();
              this.display();
            }
          });
      })
      .addExtraButton((button) => {
        button
          .setIcon("arrow-down")
          .setTooltip("Move down")
          .setDisabled(index === this.plugin.settings.pinnedNotes.length - 1)
          .onClick(async () => {
            if (index < this.plugin.settings.pinnedNotes.length - 1) {
              [
                this.plugin.settings.pinnedNotes[index],
                this.plugin.settings.pinnedNotes[index + 1],
              ] = [
                this.plugin.settings.pinnedNotes[index + 1],
                this.plugin.settings.pinnedNotes[index],
              ];
              await this.plugin.saveSettings();
              this.display();
            }
          });
      })
      .addExtraButton((button) => {
        button
          .setIcon("trash")
          .setTooltip("Unpin note")
          .onClick(async () => {
            this.plugin.settings.pinnedNotes.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          });
      });
  }
}
