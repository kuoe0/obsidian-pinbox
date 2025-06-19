import { App, PluginSettingTab, Setting } from "obsidian";
import PinboxPlugin from "./main";
import { NoteSuggesterModal } from "./modals";

export interface PinboxSettings {
	pinnedNotePaths: string[];
}

export const DEFAULT_SETTINGS: PinboxSettings = {
	pinnedNotePaths: [],
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

		containerEl.createEl("h2", { text: "Pinbox Settings" });
		containerEl.createEl("p", {
			text: "Pinbox allows you to pin notes for quick access when sharing links or text on Android/iOS.",
		});

		new Setting(containerEl)
			.setName("Pin a new note")
			.setDesc("Add a note to your quick-share list.")
			.addButton((button) => {
				button
					.setButtonText("Pin Note")
					.setCta()
					.onClick(() => {
						new NoteSuggesterModal(this.app, this.plugin, () => {
							this.display();
						}).open();
					});
			});

    // TODO: Support to reorder pinned notes
		containerEl.createEl("h3", { text: "Pinned Notes" });

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
		containerEl.createEl("p", {
			text: "If you like this plugin, please consider supporting my work:",
		});

		const coffeeDiv = containerEl.createDiv({ cls: "coffee-div" });
		const coffeeLink = `
            <a href="https://www.buymeacoffee.com/kuoe0" target="_blank">
              <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
            </aㄜ
        `;
		coffeeDiv.innerHTML = coffeeLink;
	}
}
