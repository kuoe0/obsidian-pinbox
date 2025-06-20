import { Setting, TextComponent, Notice } from "obsidian";

export class FormatEditor {
  private textArea: TextComponent;
  private setting: Setting;

  constructor(
    setting: Setting,
    containerEl: HTMLElement,
    getCurrentValue: () => string,
    onValueChange: (newValue: string) => Promise<void>,
    getResetValue: () => string,
    onResetConfirmed: () => Promise<void>,
    resetTooltipText: string,
    getCopyValue?: () => string
  ) {
    this.setting = setting;
    const controlContainer = containerEl.createDiv({
      cls: "pinbox-control-container",
    });

    this.createTextArea(
      controlContainer,
      getCurrentValue,
      onValueChange,
      getResetValue
    );
    const buttonContainer = this.createButtonContainer(controlContainer);
    this.createResetButton(buttonContainer, onResetConfirmed, resetTooltipText);
    this.createCopyButton(buttonContainer, getCurrentValue, getCopyValue);
  }

  private createTextArea(
    containerEl: HTMLElement,
    getCurrentValue: () => string,
    onValueChange: (newValue: string) => Promise<void>,
    getResetValue: () => string
  ) {
    this.setting.addTextArea((text: TextComponent) => {
      this.textArea = text;
      text.inputEl.classList.add("pinbox-format-editor");
      text
        .setValue(getCurrentValue())
        .setPlaceholder(getResetValue())
        .onChange(async (value) => {
          await onValueChange(value);
        });
    });
    containerEl.appendChild(this.textArea.inputEl);
  }

  private createButtonContainer(containerEl: HTMLElement): HTMLElement {
    return containerEl.createDiv({ cls: "pinbox-button-container" });
  }

  private createResetButton(
    containerEl: HTMLElement,
    onResetConfirmed: () => Promise<void>,
    resetTooltipText: string
  ) {
    this.setting.addButton((button) => {
      button
        .setIcon("rotate-ccw")
        .setTooltip(resetTooltipText)
        .onClick(async () => {
          await onResetConfirmed();
        });
      containerEl.appendChild(button.buttonEl);
    });
  }

  private createCopyButton(
    containerEl: HTMLElement,
    getCurrentValue: () => string,
    getCopyValue?: () => string
  ) {
    this.setting.addButton((button) => {
      button
        .setIcon("copy")
        .setTooltip("Copy format to clipboard")
        .onClick(async () => {
          const valueToCopy = getCopyValue ? getCopyValue() : getCurrentValue();
          await navigator.clipboard.writeText(valueToCopy);
          new Notice("Format copied to clipboard!");
        });
      containerEl.appendChild(button.buttonEl);
    });
  }
}
