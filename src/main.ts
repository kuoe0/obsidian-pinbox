import { Plugin, TAbstractFile, TFile, Notice, Menu } from 'obsidian';
import { PinboxSettingTab, PinboxSettings, DEFAULT_SETTINGS } from './settings';

export default class PinboxPlugin extends Plugin {
    settings: PinboxSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new PinboxSettingTab(this.app, this));

        // Register share menu on the mobile app
        this.registerEvent(
            //@ts-ignore
            this.app.workspace.on('receive-text-menu', (menu: Menu, shareText: string) => {
                if (this.settings.pinnedNotePaths.length === 0) return;

                menu.addSeparator();
                this.settings.pinnedNotePaths.forEach(notePath => {
                    menu.addItem((item) => {
                        const noteName = notePath.split('/').pop()?.replace('.md', '');
                        item
                           .setTitle(`Append to ${noteName}`)
                           .setIcon('pin')
                           .onClick(async () => {
                                // TODO: Support custom formatting or metadata (date/time, etc.) with default formatting for each pinned note.
                                // TODO: Add date/time or other metadata if needed
                                // TODO: If it's a URL，format it as Markdown link (if we can fetch the title , use it)
                                const formattedText = `\n${shareText}\n---\n`;

                                // TODO: add debug mode option in settings to enable debug notice
                                new Notice(`Saving...\n${formattedText}`);

                                try {
                                    await this.app.vault.adapter.append(notePath, formattedText);
                                    new Notice(`Link saved to ${noteName}`);
                                } catch (error) {
                                    new Notice(`Failed to save to ${noteName}. See console for details.`);
                                    console.error("Pin-to-Share Error:", error);
                                }

                                // TODO: Add an option to show bookmarks in the menu if enabled
                                // TODO: Add an option to go to the note after saving if enabled
                            });
                    });
                });

                // TODO: add bookmark pinning options if enabled
            })
        );

        this.registerEvent(this.app.vault.on('rename', this.handleFileRename.bind(this)));
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
