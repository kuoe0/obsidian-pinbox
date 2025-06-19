import { Plugin, TAbstractFile, TFile, Notice, Menu } from "obsidian";
import { PinboxSettingTab, PinboxSettings, DEFAULT_SETTINGS } from "./settings";

export default class PinboxPlugin extends Plugin {
	settings: PinboxSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new PinboxSettingTab(this.app, this));

		// Register share menu on the mobile app
		this.registerEvent(
			//@ts-ignore
			this.app.workspace.on(
				"receive-text-menu",
				(menu: Menu, shareText: string) => {
					if (this.settings.pinnedNotePaths.length === 0) return;

					menu.addSeparator();
					this.settings.pinnedNotePaths.forEach((notePath) => {
						menu.addItem((item) => {
							const noteName = notePath
								.split("/")
								.pop()
								?.replace(".md", "");
							item.setTitle(`Append to ${noteName}`)
								.setIcon("pin")
								.onClick(async () => {
									// TODO: Feature: Attempt to fetch the page title if shareText is a link. This would require HTTP requests and HTML parsing.
									const now = new Date();
									const timestamp = `${now.getFullYear()}-${(
										now.getMonth() + 1
									)
										.toString()
										.padStart(2, "0")}-${now
										.getDate()
										.toString()
										.padStart(2, "0")} ${now
										.getHours()
										.toString()
										.padStart(2, "0")}:${now
										.getMinutes()
										.toString()
										.padStart(2, "0")}`;

									// TODO: Feature: Support custom formatting (e.g. add tags, etc.) for each pinned note in settings. This would involve extending PinboxSettings.
									const formattedText = `\n\n---\n${shareText}\n@${timestamp}\n\n---\n`;

									if (this.settings.debugMode) {
										new Notice(
											`Saving to ${noteName}...\n${formattedText.substring(
												0,
												100
											)}...`
										);
									}

									try {
										await this.app.vault.adapter.append(
											notePath,
											formattedText
										);
										new Notice(`Link saved to ${noteName}`);

										if (this.settings.goToNoteAfterSave) {
											const abstractFile =
												this.app.vault.getAbstractFileByPath(
													notePath
												);
											if (abstractFile instanceof TFile) {
												const leaf =
													this.app.workspace.getLeaf(
														false
													);
												await leaf.openFile(
													abstractFile
												);
											} else {
												new Notice(
													`Error: Pinned note "${noteName}" not found at path: ${notePath}`
												);
											}
										}
									} catch (error) {
										new Notice(
											`Failed to save to ${noteName}. See console for details.`
										);
										console.error(
											"Pin-to-Share Error:",
											error
										);
									}
								});
						});
					});

					// TODO: Feature: Add bookmark pinning options if a corresponding setting is enabled.
				}
			)
		);

		this.registerEvent(
			this.app.vault.on("rename", this.handleFileRename.bind(this))
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleFileRename(file: TAbstractFile, oldPath: string) {
		if (!(file instanceof TFile)) return;

		const index = this.settings.pinnedNotePaths.indexOf(oldPath);
		if (index > -1) {
			this.settings.pinnedNotePaths[index] = file.path;
			await this.saveSettings();
			new Notice(`Pinned note path updated to "${file.path}".`);
		}
	}
}
