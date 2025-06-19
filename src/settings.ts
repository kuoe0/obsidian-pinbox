import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	TFile,
	TextComponent,
} from "obsidian";
import PinboxPlugin from "./main";
import { NoteSuggesterModal } from "./modals";

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

	constructor(app: App, plugin: PinboxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.addResponsiveCSS();

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

		containerEl.createEl("h3", { text: "Global Settings" });

		const globalSetting = new Setting(containerEl)
			.setName("Global Default Note Format")
			.setDesc(
				"Set the default format for new pins and bookmarked notes.Placeholders: {{content}}, {{timestamp}} (YYYY-MM-DD HH:mm:ss), {{date}} (YYYY-MM-DD), {{time}} (HH:mm:ss)."
			);

		const controlContainer = globalSetting.controlEl.createDiv({
			cls: "pinbox-control-container",
		});

		globalSetting.addTextArea((text: TextComponent) => {
			text.setValue(this.plugin.settings.globalDefaultFormat)
				.setPlaceholder(DEFAULT_PINNED_NOTE_FORMAT)
				.onChange(async (value) => {
					this.plugin.settings.globalDefaultFormat = value;
					await this.plugin.saveSettings();
					// Refresh to update placeholders in pinned notes
					this.display();
				});
			text.inputEl.style.minHeight = "6em";
			text.inputEl.style.resize = "vertical";
			text.inputEl.style.overflowY = "auto";
		});

		controlContainer.appendChild(
			globalSetting.components[globalSetting.components.length - 1]
				.inputEl
		);

		const buttonContainer = controlContainer.createDiv({
			cls: "pinbox-button-container",
		});

		globalSetting.addButton((button) => {
			button
				.setIcon("rotate-ccw")
				.setTooltip("Reset to default format")
				.onClick(async () => {
					this.plugin.settings.globalDefaultFormat =
						DEFAULT_PINNED_NOTE_FORMAT;
					await this.plugin.saveSettings();
					this.display();
				});
		});

		buttonContainer.appendChild(
			globalSetting.components[globalSetting.components.length - 1]
				.buttonEl
		);

		globalSetting.addButton((button) => {
			button
				.setIcon("copy")
				.setTooltip("Copy format to clipboard")
				.onClick(async () => {
					await navigator.clipboard.writeText(
						this.plugin.settings.globalDefaultFormat
					);
					new Notice("Format copied to clipboard!");
				});
		});

		buttonContainer.appendChild(
			globalSetting.components[globalSetting.components.length - 1]
				.buttonEl
		);

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
											?.replace(
												".md",
												""
											)} is already pinned.`
									);
									return;
								}
								// newPinnedNote already has the globalDefaultFormat set by the modal
								this.plugin.settings.pinnedNotes.push(
									newPinnedNote
								);
								await this.plugin.saveSettings();
								new Notice(`Pinned "${file.basename}"`);

								// Refresh settings tab
								this.display();
							}
						).open();
					});
			});

		containerEl.createEl("h3", { text: "Pinned Notes" });


		if (this.plugin.settings.pinnedNotes.length === 0) {
			containerEl.createEl("p", { text: "No notes are pinned yet." });
		} else {
		const settingFactory = new Setting(containerEl);
			this.plugin.settings.pinnedNotes.forEach((pinnedNote, index) => {
				const noteName =
					pinnedNote.path.split("/").pop()?.replace(".md", "") ||
					"Note";

				const settingItem = containerEl.createDiv({
					cls: "setting-item",
				});

				const infoEl = settingItem.createDiv({
					cls: "setting-item-info",
				});
				infoEl.createDiv({ cls: "setting-item-name", text: noteName });
				infoEl.createDiv({
					cls: "setting-item-description",
					text: `Path: ${pinnedNote.path}`,
				});

				// Add move buttons below the name/path
				const moveButtons = infoEl.createDiv({
					cls: "pinbox-move-buttons",
				});

				new Setting(moveButtons)
					.addExtraButton((button) => {
						button
							.setIcon("arrow-up")
							.setTooltip("Move up")
							.setDisabled(index === 0) // Disable for the first item
							.onClick(async () => {
								if (index > 0) {
									// Swap elements
									[
										this.plugin.settings.pinnedNotes[index],
										this.plugin.settings.pinnedNotes[
											index - 1
										],
									] = [
										this.plugin.settings.pinnedNotes[
											index - 1
										],
										this.plugin.settings.pinnedNotes[index],
									];
									await this.plugin.saveSettings();

									// Refresh settings tab
									this.display();
								}
							});
					})
					.addExtraButton((button) => {
						button
							.setIcon("arrow-down")
							.setTooltip("Move down")
							.setDisabled(
								index ===
									this.plugin.settings.pinnedNotes.length - 1
							) // Disable for the last item
							.onClick(async () => {
								if (
									index <
									this.plugin.settings.pinnedNotes.length - 1
								) {
									// Swap elements
									[
										this.plugin.settings.pinnedNotes[index],
										this.plugin.settings.pinnedNotes[
											index + 1
										],
									] = [
										this.plugin.settings.pinnedNotes[
											index + 1
										],
										this.plugin.settings.pinnedNotes[index],
									];
									await this.plugin.saveSettings();
									// Refresh settings tab
									this.display();
								}
							});
					})
					.addExtraButton((button) => {
						button
							.setIcon("trash")
							.setTooltip("Unpin note")
							// .setCta() // Make unpin button more prominent
							.onClick(async () => {
								this.plugin.settings.pinnedNotes.splice(
									index,
									1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					});

				const controlEl = settingItem.createDiv({
					cls: "setting-item-control",
				});

				const controlContainer = controlEl.createDiv({
					cls: "pinbox-control-container",
				});

				// Use settingFactory to create a text area for custom format
				// and move it out from the settingFactory to controlContainer.
				settingFactory.addTextArea((text: TextComponent) => {
					text.setValue(pinnedNote.customFormat);
					text.inputEl.style.overflowY = "auto";
					text.inputEl.style.minHeight = "6em";
					text.inputEl.style.resize = "vertical";
				});
				controlContainer.appendChild(
					settingFactory.components[
						settingFactory.components.length - 1
					].inputEl
				);

				const buttonContainer = controlContainer.createDiv({
					cls: "pinbox-button-container",
				});

				settingFactory.addButton((button) => {
					// Reset to global default format button
					button
						.setIcon("rotate-ccw") // Icon for reset
						.setTooltip("Reset format to global default")
						.onClick(async () => {
							this.plugin.settings.pinnedNotes[
								index
							].customFormat =
								this.plugin.settings.globalDefaultFormat;
							await this.plugin.saveSettings();
							this.display();
						});
				});
				buttonContainer.appendChild(
					settingFactory.components[
						settingFactory.components.length - 1
					].buttonEl
				);

				settingFactory.addButton((button) => {
					button
						.setIcon("copy") // Icon for copy
						.setTooltip("Copy format to clipboard")
						.onClick(async () => {
							await navigator.clipboard.writeText(
								pinnedNote.customFormat
							);
							new Notice("Format copied to clipboard!");
						});
				});

				buttonContainer.appendChild(
					settingFactory.components[
						settingFactory.components.length - 1
					].buttonEl
				);
			});

      // Remove the settingFactory components to remove it from the DOM.
      settingFactory.settingEl.remove();

		}

		containerEl.createEl("hr");

		new Setting(containerEl)
			.setName("Show bookmarked notes in share menu")
			.setDesc(
				"Adds your Obsidian bookmarked notes to the share menu for quick appending. Requires the 'Bookmarks' core plugin to be enabled."
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

	// Custom CSS for responsive design
	addResponsiveCSS() {
		this.containerEl.createEl("style", {
			text: `
        div.setting-item-info {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
          display: flex;
          flex-wrap: wrap;
        }
        div.setting-item-control {
          width: 100%;
        }

        div.pinbox-control-container {
          width: 100%;
        }
        div.pinbox-control-container > textarea {
          width: 100%;
        }

				div.pinbox-button-container {
          display: flex;
          justify-content: space-evenly;
          gap: 10px;
        }

        .pinbox-button-container > button {
          width: 100%;
        }

        /* Style for move buttons */
        .setting-item-name {
          flex-grow: 1;
        }

        .pinbox-move-buttons {
          display: flex;
        }

        /* Avoid the margin before the move buttons */
        .setting-item > *:first-child {
          margin-inline-end: 0;
        }
			`,
		});
	}
}
