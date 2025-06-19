import { App, FuzzySuggestModal, TFile, Notice } from 'obsidian';
import PinboxPlugin from './main';

export class NoteSuggesterModal extends FuzzySuggestModal<TFile> {
    plugin: PinboxPlugin;
    onSelectCallback: () => void;

    constructor(app: App, plugin: PinboxPlugin, onSelect: () => void) {
        super(app);
        this.plugin = plugin;
        this.onSelectCallback = onSelect;
        this.setPlaceholder("Search for a note to pin...");
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    async onChooseItem(item: TFile): Promise<void> {
        if (this.plugin.settings.pinnedNotePaths.includes(item.path)) {
            new Notice(`${item.basename} is already pinned.`);
            return;
        }
        this.plugin.settings.pinnedNotePaths.push(item.path);
        await this.plugin.saveSettings();
        new Notice(`Pinned "${item.basename}"`);
        this.onSelectCallback();
    }
}