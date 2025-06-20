import {
  TextAreaComponent,
  Notice,
  MarkdownRenderer,
  App,
  ButtonComponent,
} from "obsidian";
import { PinnedNote } from "src/settings";
import PinboxPlugin from "src/main"; // Import PinboxPlugin for type
import { processPlaceholders } from "src/utils";

export interface FormatEditorOptions {
  getCurrentValue: () => string;
  onValueChange: (newValue: string) => Promise<void>;
  getResetValue: () => string;
  onResetConfirmed: () => Promise<void>;
  resetTooltipText: string;
  getCopyValue?: () => string;
  app: App;
  getPreviewData?: () => {
    content: string;
    note?: PinnedNote;
    filePath?: string;
  };
  plugin: PinboxPlugin;
}
export class FormatEditor {
  // Renamed from FormatEditor to avoid conflict if needed, but keeping for now
  private textArea: TextAreaComponent;
  private previewEl: HTMLElement;
  private app: App;
  private getPreviewData:
    | (() => { content: string; note?: PinnedNote; filePath?: string })
    | undefined;
  private plugin: PinboxPlugin | undefined;

  private isPreviewing = false;
  constructor(containerEl: HTMLElement, options: FormatEditorOptions) {
    const {
      getCurrentValue,
      onValueChange,
      getResetValue,
      onResetConfirmed,
      resetTooltipText,
      getCopyValue,
      app,
      getPreviewData,
      plugin,
    } = options;
    this.app = options.app;
    this.getPreviewData = options.getPreviewData;
    this.plugin = options.plugin;

    const controlContainer = containerEl.createDiv({
      // This container holds the text area and buttons
      cls: "pinbox-control-container",
    });

    // Create the preview element and add it to the controlContainer
    // This will hold the rendered Markdown preview.
    this.previewEl = controlContainer.createDiv({
      cls: "pinbox-format-preview markdown-preview-view",
    });
    this.previewEl.style.display = this.isPreviewing ? "block" : "none";

    // Create the text area. Its inputEl will be appended to controlContainer by this method.
    // Its display style is also set based on this.isPreviewing inside createTextArea.
    this.createTextArea(
      controlContainer,
      getCurrentValue,
      onValueChange,
      getResetValue
    );

    const buttonContainer = this.createButtonContainer(controlContainer);
    this.createResetButton(buttonContainer, onResetConfirmed, resetTooltipText);
    this.createCopyButton(buttonContainer, getCurrentValue, getCopyValue);
    this.createPreviewToggleButton(buttonContainer);

    // Initial render of preview content.
    // this.previewEl is now guaranteed to be defined.
    if (this.app && this.getPreviewData && this.plugin) {
      this._renderPreview();
    }
  }

  private createTextArea(
    containerEl: HTMLElement,
    getCurrentValue: () => string,
    onValueChange: (newValue: string) => Promise<void>,
    getResetValue: () => string
  ) {
    this.textArea = new TextAreaComponent(containerEl);
    const inputEl = this.textArea.inputEl;
    inputEl.classList.add("pinbox-format-editor");
    inputEl.style.display = this.isPreviewing ? "none" : "block";
    inputEl.style.overflowY = "hidden"; // Hide scrollbar
    inputEl.style.resize = "vertical"; // Allow manual vertical resize if needed, but auto-resize will handle most cases

    const resizeTextArea = () => {
      inputEl.style.height = "auto"; // Reset height to auto to calculate new scrollHeight
      inputEl.style.height = inputEl.scrollHeight + "px"; // Set height to scrollHeight
    };

    this.textArea.setValue(getCurrentValue());
    this.textArea.setPlaceholder(getResetValue());

    this.textArea.onChange(async (value) => {
      await onValueChange(value);
      if (this.previewEl && this.app && this.getPreviewData && this.plugin) {
        this._renderPreview();
      }
      resizeTextArea(); // Resize on change
    });
    inputEl.addEventListener("input", resizeTextArea); // Resize on input (typing)
    resizeTextArea(); // Initial resize
  }

  private createButtonContainer(containerEl: HTMLElement): HTMLElement {
    return containerEl.createDiv({ cls: "pinbox-button-container" });
  }

  private createResetButton(
    containerEl: HTMLElement,
    onResetConfirmed: () => Promise<void>,
    resetTooltipText: string
  ) {
    new ButtonComponent(containerEl)
      .setIcon("rotate-ccw")
      .setTooltip(resetTooltipText)
      .onClick(async () => {
        await onResetConfirmed();
        if (this.previewEl && this.app && this.getPreviewData && this.plugin) {
          this._renderPreview(); // Re-render after reset
        }
      });
  }

  private createCopyButton(
    containerEl: HTMLElement,
    getCurrentValue: () => string,
    getCopyValue?: () => string
  ) {
    new ButtonComponent(containerEl)
      .setIcon("copy")
      .setTooltip("Copy format to clipboard")
      .onClick(async () => {
        const valueToCopy = getCopyValue ? getCopyValue() : getCurrentValue();
        await navigator.clipboard.writeText(valueToCopy);
        new Notice("Format copied to clipboard!");
      });
  }

  private createPreviewToggleButton(containerEl: HTMLElement) {
    const button = new ButtonComponent(containerEl)
      .setIcon(this.isPreviewing ? "pencil" : "eye")
      .setTooltip(this.isPreviewing ? "Edit format" : "Show preview")
      .onClick(async () => {
        this.isPreviewing = !this.isPreviewing;
        button.setIcon(this.isPreviewing ? "pencil" : "eye");
        button.setTooltip(this.isPreviewing ? "Edit format" : "Show preview");
        this.textArea.inputEl.style.display = this.isPreviewing
          ? "none"
          : "block";
        this.previewEl.style.display = this.isPreviewing ? "block" : "none";
        if (this.isPreviewing) {
          this._renderPreview();
        }
      });
  }

  private async _renderPreview(): Promise<void> {
    if (!this.previewEl || !this.app || !this.getPreviewData || !this.plugin) {
      return;
    }

    const formatString = this.textArea.getValue();
    const previewData = this.getPreviewData();
    const sampleContent = previewData.content;

    const processedText = processPlaceholders(formatString, sampleContent);

    this.previewEl.empty(); // Clear previous preview

    await MarkdownRenderer.render(
      this.app,
      processedText,
      this.previewEl,
      "",
      this.plugin
    );
  }
}
