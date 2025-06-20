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

	private createFormatEditor(
		ownerSetting: Setting,
		targetControlContainer: HTMLElement,
		getCurrentValue: () => string,
		onValueChange: (newValue: string) => Promise<void>,
		getResetValue: () => string,
		onResetConfirmed: () => Promise<void>,
		resetTooltipText: string,
		getCopyValue?: () => string
	): void {
		let textArea: TextComponent;
		ownerSetting.addTextArea((text: TextComponent) => {
			textArea = text;
			text.inputEl.classList.add("pinbox-format-editor");
			text.setValue(getCurrentValue())
				.setPlaceholder(getResetValue()) // Use reset value as placeholder
				.onChange(async (value) => {
					await onValueChange(value);
				});
		});
		targetControlContainer.appendChild(textArea!.inputEl);

		// Button Container
		const buttonContainer = targetControlContainer.createDiv({
			cls: "pinbox-button-container",
		});

		// Reset Button
		let resetButtonEl: HTMLButtonElement;
		ownerSetting.addButton((button) => {
			button
				.setIcon("rotate-ccw")
				.setTooltip(resetTooltipText)
				.onClick(async () => {
					await onResetConfirmed();
				});
			resetButtonEl = button.buttonEl;
		});
		buttonContainer.appendChild(resetButtonEl!);

		// Copy Button
		let copyButtonEl: HTMLButtonElement;
		ownerSetting.addButton((button) => {
			button
				.setIcon("copy")
				.setTooltip("Copy format to clipboard")
				.onClick(async () => {
					const valueToCopy = getCopyValue
						? getCopyValue()
						: getCurrentValue();
					await navigator.clipboard.writeText(valueToCopy);
					new Notice("Format copied to clipboard!");
				});
			copyButtonEl = button.buttonEl;
		});
		buttonContainer.appendChild(copyButtonEl!);
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

	display(): void {
		const { containerEl } = this;
		// Store the current scroll position
		const scrollPosition = containerEl.scrollTop;

		containerEl.empty();

		containerEl.createEl("p", {
			text: "Pinbox allows you to pin notes for quick access when sharing links or text on Android/iOS.",
		});

		containerEl.createEl("p", {
			text: "If you like this plugin, please consider supporting my work:",
		});

		const coffeeDiv = containerEl.createDiv({ cls: "coffee-div" });
		const coffeeLinkEl = coffeeDiv.createEl("a", {
			attr: {
				href: "https://www.buymeacoffee.com/kuoe0",
				target: "_blank",
			},
		});

		coffeeLinkEl.createEl("img", {
			attr: {
				class: "coffee-button",
				src: "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png",
				alt: "Buy Me A Coffee",
			},
		});

		const globalSetting = new Setting(containerEl)
			.setName("Global default format")
			.setDesc(
				"Set the default format for new pins and bookmarked notes.Placeholders: {{content}}, {{timestamp}} (YYYY-MM-DD HH:mm:ss), {{date}} (YYYY-MM-DD), {{time}} (HH:mm:ss)."
			);

		const globalControlContainer = globalSetting.controlEl.createDiv({
			cls: "pinbox-control-container",
		});

		this.createFormatEditor(
			globalSetting,
			globalControlContainer,
			() => this.plugin.settings.globalDefaultFormat,
			/* onValueChange= */ async (value) => {
				await this.handleFormatChange(
					(v) => (this.plugin.settings.globalDefaultFormat = v),
					value,
					false
				);
			},
			() => DEFAULT_PINNED_NOTE_FORMAT, // getResetValue (also for placeholder)
			/* onResetConfirmed= */ async () => {
				await this.handleFormatChange(
					(_) =>
						(this.plugin.settings.globalDefaultFormat =
							DEFAULT_PINNED_NOTE_FORMAT),
					DEFAULT_PINNED_NOTE_FORMAT,
					true
				);
			},
			"Reset to default format"
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

		new Setting(containerEl).setName("Pinned notes").setHeading();

		if (this.plugin.settings.pinnedNotes.length === 0) {
			containerEl.createEl("p", { text: "No notes are pinned yet." });
		} else {
			const settingFactory = new Setting(containerEl); // Used as a factory for components
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

				this.createPinnedNoteControls(moveButtons, index);

				const controlEl = settingItem.createDiv({
					cls: "setting-item-control",
				});

				const pinnedNoteControlContainer = controlEl.createDiv({
					cls: "pinbox-control-container",
				});

				this.createFormatEditor(
					settingFactory,
					pinnedNoteControlContainer,
					() => pinnedNote.customFormat,
					/* onValueChange= */ async (value) => {
						// Ensure we are updating the correct note in the array
						const currentPinnedNote =
							this.plugin.settings.pinnedNotes[index];
						if (currentPinnedNote) {
							await this.handleFormatChange(
								(v) => (currentPinnedNote.customFormat = v),
								value,
								false // No full refresh, text area updates itself
							);
						}
					},
					() => this.plugin.settings.globalDefaultFormat, // getResetValue (for placeholder)
					async () => {
						// onResetConfirmed
						const currentPinnedNote =
							this.plugin.settings.pinnedNotes[index];
						if (currentPinnedNote) {
							await this.handleFormatChange(
								(v) => (currentPinnedNote.customFormat = v),
								this.plugin.settings.globalDefaultFormat,
								true
							);
						}
					},
					"Reset format to global default",
					() => pinnedNote.customFormat // getCopyValue
				);
			});

			// Remove the settingFactory's main element as it was only used for component creation
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
					.setDisabled(
						index === this.plugin.settings.pinnedNotes.length - 1
					)
					.onClick(async () => {
						if (
							index <
							this.plugin.settings.pinnedNotes.length - 1
						) {
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
