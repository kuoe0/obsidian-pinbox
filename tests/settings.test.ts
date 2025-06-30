import { DEFAULT_SETTINGS, DEFAULT_PINNED_NOTE_FORMAT, PinboxSettings, PinnedNote } from '../src/settings';

describe('Settings', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SETTINGS.pinnedNotes).toEqual([]);
      expect(DEFAULT_SETTINGS.debugMode).toBe(false);
      expect(DEFAULT_SETTINGS.goToNoteAfterSave).toBe(false);
      expect(DEFAULT_SETTINGS.enableObsidianBookmark).toBe(false);
      expect(DEFAULT_SETTINGS.globalDefaultFormat).toBe(DEFAULT_PINNED_NOTE_FORMAT);
    });

    it('should have the correct default format', () => {
      expect(DEFAULT_PINNED_NOTE_FORMAT).toBe('\n\n---\n{{content}}\n@ {{timestamp}}\n\n---\n');
    });
  });

  describe('PinboxSettings interface', () => {
    it('should allow valid settings object', () => {
      const validSettings: PinboxSettings = {
        pinnedNotes: [
          {
            path: 'test.md',
            customFormat: '{{content}} at {{timestamp}}',
          },
        ],
        globalDefaultFormat: '{{content}}',
        debugMode: true,
        goToNoteAfterSave: true,
        enableObsidianBookmark: true,
      };

      expect(validSettings.pinnedNotes).toHaveLength(1);
      expect(validSettings.pinnedNotes[0].path).toBe('test.md');
      expect(validSettings.debugMode).toBe(true);
    });
  });

  describe('PinnedNote interface', () => {
    it('should allow valid pinned note object', () => {
      const validPinnedNote: PinnedNote = {
        path: 'path/to/note.md',
        customFormat: '{{content}} on {{date}}',
      };

      expect(validPinnedNote.path).toBe('path/to/note.md');
      expect(validPinnedNote.customFormat).toBe('{{content}} on {{date}}');
    });

    it('should handle paths with special characters', () => {
      const pinnedNoteWithSpecialPath: PinnedNote = {
        path: 'path/with spaces/and-special-chars.md',
        customFormat: '{{content}}',
      };

      expect(pinnedNoteWithSpecialPath.path).toContain(' ');
      expect(pinnedNoteWithSpecialPath.path).toContain('-');
    });
  });

  describe('Settings validation', () => {
    it('should handle empty pinned notes array', () => {
      const settingsWithEmptyNotes: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        pinnedNotes: [],
      };

      expect(settingsWithEmptyNotes.pinnedNotes).toHaveLength(0);
    });

    it('should handle multiple pinned notes', () => {
      const settingsWithMultipleNotes: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        pinnedNotes: [
          { path: 'note1.md', customFormat: '{{content}}' },
          { path: 'note2.md', customFormat: '{{content}} at {{time}}' },
          { path: 'note3.md', customFormat: '{{content}} on {{date}}' },
        ],
      };

      expect(settingsWithMultipleNotes.pinnedNotes).toHaveLength(3);
      expect(settingsWithMultipleNotes.pinnedNotes[0].path).toBe('note1.md');
      expect(settingsWithMultipleNotes.pinnedNotes[1].path).toBe('note2.md');
      expect(settingsWithMultipleNotes.pinnedNotes[2].path).toBe('note3.md');
    });

    it('should handle boolean settings', () => {
      const settingsWithBools: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        debugMode: true,
        goToNoteAfterSave: true,
        enableObsidianBookmark: true,
      };

      expect(settingsWithBools.debugMode).toBe(true);
      expect(settingsWithBools.goToNoteAfterSave).toBe(true);
      expect(settingsWithBools.enableObsidianBookmark).toBe(true);
    });

    it('should handle custom format strings', () => {
      const customFormat = 'My custom format: {{content}} on {{date}} at {{time}}';
      const settingsWithCustomFormat: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        globalDefaultFormat: customFormat,
      };

      expect(settingsWithCustomFormat.globalDefaultFormat).toBe(customFormat);
    });
  });

  describe('Settings edge cases', () => {
    it('should handle very long format strings', () => {
      const longFormat = 'A'.repeat(1000) + '{{content}}' + 'B'.repeat(1000);
      const settingsWithLongFormat: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        globalDefaultFormat: longFormat,
      };

      expect(settingsWithLongFormat.globalDefaultFormat).toBe(longFormat);
      expect(settingsWithLongFormat.globalDefaultFormat.length).toBeGreaterThan(2000);
    });

    it('should handle format strings with special characters', () => {
      const specialFormat = '{{content}} with special chars: \n\t\r\\"\'`~!@#$%^&*()_+-=[]{}|;:,.<>?';
      const settingsWithSpecialFormat: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        globalDefaultFormat: specialFormat,
      };

      expect(settingsWithSpecialFormat.globalDefaultFormat).toBe(specialFormat);
    });

    it('should handle unicode characters in paths', () => {
      const unicodePath = 'path/with/unicode/你好世界/🌍🌎🌏.md';
      const settingsWithUnicodePath: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        pinnedNotes: [
          { path: unicodePath, customFormat: '{{content}}' },
        ],
      };

      expect(settingsWithUnicodePath.pinnedNotes[0].path).toBe(unicodePath);
    });

    it('should handle emojis in format strings', () => {
      const emojiFormat = '🚀 {{content}} 🎉 on {{date}} 🎨';
      const settingsWithEmojiFormat: PinboxSettings = {
        ...DEFAULT_SETTINGS,
        globalDefaultFormat: emojiFormat,
      };

      expect(settingsWithEmojiFormat.globalDefaultFormat).toBe(emojiFormat);
    });
  });
}); 