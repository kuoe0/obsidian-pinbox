import { Plugin, TAbstractFile, TFile, Notice, Menu } from "obsidian";
import { PinboxSettingTab, PinboxSettings, DEFAULT_SETTINGS } from "./settings";

function isUrl(text: string): boolean {
	try {
		new URL(text);
		return true;
	} catch (_) {
		return false;
	}
}

export default class PinboxPlugin extends Plugin {
	settings: PinboxSettings;

	private async appendContentToNote(notePath: string, content: string, noteNameForDisplay: string) {
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
		const formattedText = `\n\n---\n${content}\n@${timestamp}\n\n---\n`;

		if (this.settings.debugMode) {
			new Notice(
				`Saving to ${noteNameForDisplay}...\n${formattedText.substring(
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
			new Notice(`Content saved to ${noteNameForDisplay}`);

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
						`Error: Note "${noteNameForDisplay}" not found at path: ${notePath}`
					);
				}
			}
		} catch (error) {
			new Notice(
				`Failed to save to ${noteNameForDisplay}. See console for details.`
			);
			console.error(
				"Pinbox Error:",
				error
			);
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
					const hasPinnedNotes = this.settings.pinnedNotePaths.length > 0;

					const bookmarkedFilePaths: string[] = [];
					if (this.settings.enableObsidianBookmark) {
						// @ts-ignore
						const bookmarksPlugin = this.app.internalPlugins?.plugins['bookmarks'];
						if (bookmarksPlugin && bookmarksPlugin.enabled && bookmarksPlugin.instance) {
							// @ts-ignore
							const bookmarkedItems = bookmarksPlugin.instance.getBookmarks();
							for (const item of bookmarkedItems) {
								if (item.type === 'file') {
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
						this.settings.pinnedNotePaths.forEach((notePath) => {
						menu.addItem((item) => {
							const noteName = notePath
								.split("/")
								.pop()
								?.replace(".md", "");
							item.setTitle(`Append to ${noteName}`)
								.setIcon("pin")
								.onClick(async () => {
									await this.appendContentToNote(notePath, shareText, noteName || "Pinned Note");
								});
						});
					});
					}

					if (hasBookmarkedNotes) {
						menu.addSeparator();
						bookmarkedFilePaths.forEach(notePath => {
							menu.addItem(item => {
								const noteName = notePath.split('/').pop()?.replace('.md', '');
								item.setTitle(`Append to ${noteName}`)
									.setIcon("bookmark")
									.onClick(async () => {
										await this.appendContentToNote(notePath, shareText, noteName || "Bookmarked Note");
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

		let settingsChanged = false;

		const index = this.settings.pinnedNotePaths.indexOf(oldPath);
		if (index > -1) {
			this.settings.pinnedNotePaths[index] = file.path;
			settingsChanged = true;
			new Notice(`Pinned note path "${oldPath}" updated to "${file.path}".`);
		}

		if (settingsChanged) {
			await this.saveSettings();
		}
	}

}
