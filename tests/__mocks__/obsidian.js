// Mock Obsidian API
const mockTextAreaComponent = {
  inputEl: { classList: { add: () => {} } },
  setValue: () => {},
  setPlaceholder: () => {},
  onChange: () => {},
  getValue: () => '',
};

const mockButtonComponent = {
  setIcon: function() { return this; },
  setTooltip: function() { return this; },
  onClick: function() { return this; },
};

const mockMarkdownRenderer = {
  render: async () => {},
};

// Mock FuzzySuggestModal class
class MockFuzzySuggestModal {
  constructor(app) {
    this.app = app;
  }
  
  setPlaceholder(placeholder) {
    this.placeholder = placeholder;
    return this;
  }
  
  getItems() {
    return [];
  }
  
  getItemText(item) {
    return item;
  }
  
  async onChooseItem(item) {
    // Mock implementation
  }
}

module.exports = {
  TextAreaComponent: function() { return mockTextAreaComponent; },
  ButtonComponent: function() { return mockButtonComponent; },
  MarkdownRenderer: mockMarkdownRenderer,
  Notice: function() {},
  App: function() {},
  FuzzySuggestModal: MockFuzzySuggestModal,
  TFile: class MockTFile {
    constructor(path) {
      this.path = path;
    }
  },
  PluginSettingTab: class {},
  Setting: class { 
    setName() { return this; } 
    setDesc() { return this; } 
    addButton() { return this; } 
    setHeading() { return this; } 
  },
  Menu: class {},
}; 