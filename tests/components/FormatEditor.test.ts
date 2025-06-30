// ---- MOCKS (must be above imports for jest.mock hoisting) ----
const mockTextAreaComponent = {
  inputEl: typeof document !== 'undefined' ? document.createElement('textarea') : {},
  setValue: jest.fn(),
  setPlaceholder: jest.fn(),
  onChange: jest.fn(),
  getValue: jest.fn(),
};

const TextAreaComponentMock = function(container) {
  const instance = Object.assign({}, mockTextAreaComponent);
  if (container && container.appendChild) {
    container.appendChild(instance.inputEl);
  }
  return instance;
};

// ButtonComponent factory
function createMockButtonComponent() {
  let clickHandler = null;
  const mock = {
    setIcon: jest.fn().mockReturnThis(),
    setTooltip: jest.fn().mockReturnThis(),
    onClick: jest.fn(function (handler) {
      clickHandler = handler;
      return this;
    }),
    triggerClick: function (...args) {
      if (clickHandler) return clickHandler(...args);
    },
  };
  return mock;
}

// ---- END MOCKS ----

import { FormatEditor, FormatEditorOptions } from '../../src/components/FormatEditor';
import { PinnedNote } from '../../src/settings';
const { ButtonComponent, MarkdownRenderer } = require('obsidian') as any;

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock createDiv on HTMLElement prototype
global.HTMLElement.prototype.createDiv = function (opts) {
  const div = document.createElement('div');
  if (opts && typeof opts === 'object' && 'cls' in opts) {
    const cls = Array.isArray(opts.cls)
      ? opts.cls.join(' ')
      : (opts.cls || '');
    div.className = cls;
  }
  div.empty = function () { this.innerHTML = ''; };
  this.appendChild(div);
  return div;
};

// Mock Obsidian modules
jest.mock('obsidian', () => {
  const mockMarkdownRenderer = {
    render: jest.fn().mockResolvedValue(undefined),
  };

  return {
    TextAreaComponent: jest.fn(TextAreaComponentMock),
    ButtonComponent: jest.fn(() => createMockButtonComponent()),
    MarkdownRenderer: mockMarkdownRenderer,
    Notice: jest.fn(),
    App: jest.fn(),
  };
});

// Get the mocked MarkdownRenderer for testing
const mockMarkdownRenderer = MarkdownRenderer;

// Mock the plugin
const mockPlugin = {
  // Add any plugin methods that might be used
};

describe('FormatEditor', () => {
  let containerEl: HTMLElement;
  let options: FormatEditorOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    if (ButtonComponent && ButtonComponent.mockClear) ButtonComponent.mockClear();
    if (MarkdownRenderer && MarkdownRenderer.render && MarkdownRenderer.render.mockClear) MarkdownRenderer.render.mockClear();
    if (navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText.mockClear) navigator.clipboard.writeText.mockClear();
    containerEl = document.createElement('div');
    options = {
      getCurrentValue: jest.fn().mockReturnValue('Test format'),
      onValueChange: jest.fn().mockResolvedValue(undefined),
      getResetValue: jest.fn().mockReturnValue('Default format'),
      onResetConfirmed: jest.fn().mockResolvedValue(undefined),
      resetTooltipText: 'Reset to default',
      getCopyValue: jest.fn().mockReturnValue('Copy value'),
      app: {} as any,
      getPreviewData: jest.fn().mockReturnValue({
        content: 'Sample content',
        note: { path: 'test.md', customFormat: 'Test format' } as PinnedNote,
        filePath: 'test.md',
      }),
      plugin: {} as any,
    };
  });

  describe('initialization', () => {
    it('should create textarea with correct properties', () => {
      new FormatEditor(containerEl, options);

      expect(mockTextAreaComponent.setValue).toHaveBeenCalledWith('Test format');
      expect(mockTextAreaComponent.setPlaceholder).toHaveBeenCalledWith('Default format');
      expect(containerEl.querySelector('.pinbox-format-editor')).toBeTruthy();
    });

    it('should create preview element', () => {
      new FormatEditor(containerEl, options);

      const previewEl = containerEl.querySelector('.pinbox-format-preview');
      expect(previewEl).toBeTruthy();
      expect(previewEl?.classList.contains('markdown-preview-view')).toBe(true);
    });

    it('should create button container', () => {
      new FormatEditor(containerEl, options);

      const buttonContainer = containerEl.querySelector('.pinbox-button-container');
      expect(buttonContainer).toBeTruthy();
    });

    it('should set initial previewing state to false', () => {
      new FormatEditor(containerEl, options);

      expect(containerEl.classList.contains('is-previewing')).toBe(false);
    });
  });

  describe('text area functionality', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should call onValueChange when textarea value changes', async () => {
      const onChangeCallback = mockTextAreaComponent.onChange.mock.calls[0][0];
      await onChangeCallback('New value');

      expect(options.onValueChange).toHaveBeenCalledWith('New value');
    });

    it('should render preview when value changes', async () => {
      const onChangeCallback = mockTextAreaComponent.onChange.mock.calls[0][0];
      await onChangeCallback('New value');

      expect(mockMarkdownRenderer.render).toHaveBeenCalled();
    });

    it('should not render preview when required dependencies are missing', async () => {
      // Reset the render mock to ensure a clean call count
      MarkdownRenderer.render.mockClear();
      // Create a fresh mockTextAreaComponent for this test
      const localMockTextAreaComponent = {
        inputEl: typeof document !== 'undefined' ? document.createElement('textarea') : {},
        setValue: jest.fn(),
        setPlaceholder: jest.fn(),
        onChange: jest.fn(),
        getValue: jest.fn(),
      };
      // Patch the TextAreaComponent mock to return this local instance
      ButtonComponent.mockClear();
      const obsidian = require('obsidian');
      const originalTextAreaComponent = obsidian.TextAreaComponent.getMockImplementation();
      obsidian.TextAreaComponent.mockImplementation(() => localMockTextAreaComponent);
      // Create options without required dependencies
      const incompleteOptions = {
        ...options,
        app: undefined as any,
        getPreviewData: undefined,
        plugin: undefined,
      };
      const localContainer = document.createElement('div');
      new FormatEditor(localContainer, incompleteOptions);
      const onChangeCallback = localMockTextAreaComponent.onChange.mock.calls[0][0];
      await onChangeCallback('New value');
      expect(MarkdownRenderer.render).not.toHaveBeenCalled();
      // Restore the original TextAreaComponent mock
      obsidian.TextAreaComponent.mockImplementation(originalTextAreaComponent);
    });
  });

  describe('button functionality', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should create reset button with correct properties', () => {
      expect(ButtonComponent.mock.results[0].value.setIcon).toHaveBeenCalledWith('rotate-ccw');
      expect(ButtonComponent.mock.results[0].value.setTooltip).toHaveBeenCalledWith('Reset to default');
    });

    it('should create copy button with correct properties', () => {
      expect(ButtonComponent.mock.results[1].value.setIcon).toHaveBeenCalledWith('copy');
      expect(ButtonComponent.mock.results[1].value.setTooltip).toHaveBeenCalledWith('Copy format to clipboard');
    });

    it('should create preview toggle button with correct initial state', () => {
      expect(ButtonComponent.mock.results[2].value.setIcon).toHaveBeenCalledWith('eye');
      expect(ButtonComponent.mock.results[2].value.setTooltip).toHaveBeenCalledWith('Show preview');
    });
  });

  describe('preview functionality', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should render preview with processed content', async () => {
      mockTextAreaComponent.getValue.mockReturnValue('{{content}} at {{timestamp}}');

      // Trigger preview render
      const onChangeCallback = mockTextAreaComponent.onChange.mock.calls[0][0];
      await onChangeCallback('New value');

      expect(mockMarkdownRenderer.render).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Sample content'),
        expect.anything(),
        '',
        mockPlugin
      );
    });

    it('should clear previous preview before rendering new one', async () => {
      const previewEl = containerEl.querySelector('.pinbox-format-preview');
      const mockEmpty = jest.fn();
      if (previewEl) {
        previewEl.empty = mockEmpty;
      }

      const onChangeCallback = mockTextAreaComponent.onChange.mock.calls[0][0];
      await onChangeCallback('New value');

      expect(mockEmpty).toHaveBeenCalled();
    });
  });

  describe('preview toggle', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should toggle preview state when button is clicked', () => {
      // The preview toggle button is the third button created (index 2)
      const previewToggleButton = ButtonComponent.mock.results[2].value;
      previewToggleButton.triggerClick();
      // Check if the container has the previewing class
      expect(containerEl.classList.contains('is-previewing')).toBe(true);
    });

    it('should change button icon when toggling preview', () => {
      // The preview toggle button is the third button created (index 2)
      const previewToggleButton = ButtonComponent.mock.results[2].value;
      previewToggleButton.triggerClick();
      // Check if the icon was changed to pencil (edit mode)
      expect(previewToggleButton.setIcon).toHaveBeenCalledWith('pencil');
      expect(previewToggleButton.setTooltip).toHaveBeenCalledWith('Edit format');
    });
  });

  describe('copy functionality', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should copy format to clipboard when copy button is clicked', async () => {
      // The copy button is the second button created (index 1)
      const copyButton = ButtonComponent.mock.results[1].value;
      await copyButton.triggerClick();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copy value');
    });

    it('should use getCurrentValue when getCopyValue is not provided', async () => {
      // Reset the clipboard and button mocks to ensure a clean call count
      ((navigator.clipboard.writeText as unknown) as jest.Mock).mockClear();
      if (ButtonComponent && ButtonComponent.mockClear) ButtonComponent.mockClear();
      const optionsWithoutCopyValue = {
        ...options,
        getCopyValue: undefined,
      };
      const localContainer = document.createElement('div');
      new FormatEditor(localContainer, optionsWithoutCopyValue);
      const copyButton = ButtonComponent.mock.results[1].value;
      await copyButton.triggerClick();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test format');
    });
  });

  describe('reset functionality', () => {
    beforeEach(() => {
      new FormatEditor(containerEl, options);
    });

    it('should call onResetConfirmed when reset button is clicked', async () => {
      // The reset button is the first button created (index 0)
      const resetButton = ButtonComponent.mock.results[0].value;
      await resetButton.triggerClick();
      expect(options.onResetConfirmed).toHaveBeenCalled();
    });

    it('should render preview after reset', async () => {
      // The reset button is the first button created (index 0)
      const resetButton = ButtonComponent.mock.results[0].value;
      await resetButton.triggerClick();
      expect(MarkdownRenderer.render).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle missing preview data gracefully', () => {
      const optionsWithoutPreview = {
        ...options,
        getPreviewData: undefined,
      };

      expect(() => {
        new FormatEditor(containerEl, optionsWithoutPreview);
      }).not.toThrow();
    });

    it('should handle missing plugin gracefully', () => {
      const optionsWithoutPlugin = {
        ...options,
        plugin: undefined,
      };

      expect(() => {
        new FormatEditor(containerEl, optionsWithoutPlugin);
      }).not.toThrow();
    });
  });

  describe('DOM structure', () => {
    it('should create proper DOM hierarchy', () => {
      new FormatEditor(containerEl, options);

      // Check main container classes
      expect(containerEl.classList.contains('pinbox-control-container')).toBe(true);

      // Check for required elements
      expect(containerEl.querySelector('.pinbox-format-editor')).toBeTruthy();
      expect(containerEl.querySelector('.pinbox-format-preview')).toBeTruthy();
      expect(containerEl.querySelector('.pinbox-button-container')).toBeTruthy();
    });

    it('should apply correct CSS classes', () => {
      new FormatEditor(containerEl, options);

      const textarea = containerEl.querySelector('.pinbox-format-editor');
      expect(textarea).toBeTruthy();

      const preview = containerEl.querySelector('.pinbox-format-preview');
      expect(preview).toBeTruthy();
      expect(preview?.classList.contains('markdown-preview-view')).toBe(true);
    });
  });
});