import { App, FuzzySuggestModal, TFile, Notice } from "obsidian";

export class NoteSuggesterModal extends FuzzySuggestModal<TFile> {
	onChooseFileCallback: (file: TFile) => Promise<void>;

	constructor(app: App, onChooseFile: (file: TFile) => Promise<void>) {
		super(app);
		this.onChooseFileCallback = onChooseFile;
		this.setPlaceholder("Search for a note to pin...");
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(item: TFile): string {
		return item.path;
	}

	async onChooseItem(item: TFile): Promise<void> {
		await this.onChooseFileCallback(item);
	}
}
