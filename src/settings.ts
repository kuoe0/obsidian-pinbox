import { App, Notice, PluginSettingTab, Setting, TFile } from "obsidian";
import PinboxPlugin from "./main";
import { NoteSuggesterModal } from "./modals";

export interface PinboxSettings {
	pinnedNotePaths: string[];
	debugMode: boolean;
	goToNoteAfterSave: boolean;
	enableObsidianBookmark: boolean;
}

export const DEFAULT_SETTINGS: PinboxSettings = {
	pinnedNotePaths: [],
	debugMode: false,
	goToNoteAfterSave: false,
	enableObsidianBookmark: false,
};

export class PinboxSettingTab extends PluginSettingTab {
	plugin: PinboxPlugin;

	constructor(app: App, plugin: PinboxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// TODO: Better styling for settings page
		containerEl.createEl("h2", { text: "Pinbox Settings" });
		containerEl.createEl("p", {
			text: "Pinbox allows you to pin notes for quick access when sharing links or text on Android/iOS.",
		});

		containerEl.createEl("p", {
			text: "If you like this plugin, please consider supporting my work:",
		});

		const coffeeDiv = containerEl.createDiv({ cls: "coffee-div" });
		const coffeeLink = `
            <a href="https://www.buymeacoffee.com/kuoe0" target="_blank">
              <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 30px !important;width: 108px !important;" >
            </a>
        `;
		coffeeDiv.innerHTML = coffeeLink;

		new Setting(containerEl)
			.setName("Pin a new note")
			.setDesc("Add a note to your quick-share list.")
			.addButton((button) => {
				button
					.setIcon("plus-with-circle")
					.setTooltip("Pin a new note")
					.setCta()
					.onClick(() => {
						new NoteSuggesterModal(this.app, async (file: TFile) => {
							if (this.plugin.settings.pinnedNotePaths.includes(file.path)) {
								new Notice(`${file.basename} is already pinned.`);
								return;
							}
							this.plugin.settings.pinnedNotePaths.push(file.path);
							await this.plugin.saveSettings();
							new Notice(`Pinned "${file.basename}"`);
							this.display(); // Refresh settings tab
						}).open();
					});
			});

		containerEl.createEl("h3", { text: "Pinned Notes" });
		// TODO: Support to reorder pinned notes
		containerEl.createEl("p", {
			text: "Note: Reordering of pinned notes is not yet supported. This feature is coming soon!",
		});

		if (this.plugin.settings.pinnedNotePaths.length === 0) {
			containerEl.createEl("p", { text: "No notes are pinned yet." });
		} else {
			this.plugin.settings.pinnedNotePaths.forEach((notePath, index) => {
				new Setting(containerEl)
					.setName(notePath)
					.addButton((button) => {
						button
							.setIcon("trash")
							.setTooltip("Unpin this note")
							.onClick(async () => {
								this.plugin.settings.pinnedNotePaths.splice(
									index,
									1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					});
			});
		}

		containerEl.createEl("hr");

		containerEl.createEl("h3", { text: "General Settings" });

		new Setting(containerEl)
			.setName("Show bookmarked notes in share menu")
			.setDesc("Adds your Obsidian bookmarked notes to the share menu for quick appending. Requires the 'Bookmarks' core plugin to be enabled.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableObsidianBookmark)
					.onChange(async (value) => {
						this.plugin.settings.enableObsidianBookmark = value;
						await this.plugin.saveSettings();
						this.display();
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
	}
}
