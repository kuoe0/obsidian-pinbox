import { App, FuzzySuggestModal, TFile } from "obsidian";
import { PinnedNote } from "./settings"; // Removed DEFAULT_PINNED_NOTE_FORMAT import as it's passed

export class NoteSuggesterModal extends FuzzySuggestModal<TFile> {
  onChooseFileCallback: (
    file: TFile,
    newPinnedNote: PinnedNote
  ) => Promise<void>;
  currentGlobalFormat: string;

  constructor(
    app: App,
    globalDefaultFormat: string,
    onChooseFile: (file: TFile, newPinnedNote: PinnedNote) => Promise<void>
  ) {
    super(app);
    this.currentGlobalFormat = globalDefaultFormat;
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
    const newPinnedNote: PinnedNote = {
      path: item.path,
      customFormat: this.currentGlobalFormat, // Use the passed global default format
    };
    await this.onChooseFileCallback(item, newPinnedNote);
  }
}
