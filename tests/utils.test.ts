import { processPlaceholders } from '../src/utils';

process.env.TZ = 'UTC';

describe('processPlaceholders', () => {
  beforeEach(() => {
    // Mock Date to return a fixed timestamp for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-12-25T10:30:45.123Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('content placeholder', () => {
    it('should replace {{content}} with the provided content', () => {
      const format = 'Shared: {{content}}';
      const content = 'Hello World';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Shared: Hello World');
    });

    it('should replace multiple {{content}} placeholders', () => {
      const format = '{{content}} - {{content}} - {{content}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Test - Test - Test');
    });

    it('should handle empty content', () => {
      const format = 'Content: {{content}}';
      const content = '';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Content: ');
    });

    it('should handle content with special characters', () => {
      const format = '{{content}}';
      const content = 'Hello\nWorld\tWith\r\nSpecial\nChars';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Hello\nWorld\tWith\r\nSpecial\nChars');
    });

    it('should handle content with regex special characters', () => {
      const format = '{{content}}';
      const content = 'Hello [World] (Test) {Value} *Star* +Plus+ ?Question? .Dot';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Hello [World] (Test) {Value} *Star* +Plus+ ?Question? .Dot');
    });
  });

  describe('timestamp placeholder', () => {
    it('should replace {{timestamp}} with current timestamp', () => {
      const format = 'Time: {{timestamp}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Time: 2023-12-25 10:30:45');
    });

    it('should replace multiple {{timestamp}} placeholders', () => {
      const format = '{{timestamp}} - {{timestamp}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('2023-12-25 10:30:45 - 2023-12-25 10:30:45');
    });

    it('should format timestamp correctly (YYYY-MM-DD HH:mm:ss)', () => {
      const format = '{{timestamp}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('date placeholder', () => {
    it('should replace {{date}} with current date', () => {
      const format = 'Date: {{date}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Date: 2023-12-25');
    });

    it('should replace multiple {{date}} placeholders', () => {
      const format = '{{date}} - {{date}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('2023-12-25 - 2023-12-25');
    });

    it('should format date correctly (YYYY-MM-DD)', () => {
      const format = '{{date}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('time placeholder', () => {
    it('should replace {{time}} with current time', () => {
      const format = 'Time: {{time}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Time: 10:30:45');
    });

    it('should replace multiple {{time}} placeholders', () => {
      const format = '{{time}} - {{time}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('10:30:45 - 10:30:45');
    });

    it('should format time correctly (HH:mm:ss)', () => {
      const format = '{{time}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('combined placeholders', () => {
    it('should replace all placeholders in a complex format', () => {
      const format = '{{content}}\n---\nDate: {{date}}\nTime: {{time}}\nTimestamp: {{timestamp}}';
      const content = 'Shared content here';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Shared content here\n---\nDate: 2023-12-25\nTime: 10:30:45\nTimestamp: 2023-12-25 10:30:45');
    });

    it('should handle format with no placeholders', () => {
      const format = 'Static text with no placeholders';
      const content = 'Test content';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Static text with no placeholders');
    });

    it('should handle empty format string', () => {
      const format = '';
      const content = 'Test content';
      const result = processPlaceholders(format, content);
      expect(result).toBe('');
    });

    it('should handle format with only placeholders', () => {
      const format = '{{content}}{{date}}{{time}}{{timestamp}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Test2023-12-2510:30:452023-12-25 10:30:45');
    });
  });

  describe('edge cases', () => {
    it('should handle very long content', () => {
      const format = '{{content}}';
      const content = 'A'.repeat(10000);
      const result = processPlaceholders(format, content);
      expect(result).toBe('A'.repeat(10000));
    });

    it('should handle content with unicode characters', () => {
      const format = '{{content}}';
      const content = 'Hello 🌍 World 你好 世界';
      const result = processPlaceholders(format, content);
      expect(result).toBe('Hello 🌍 World 你好 世界');
    });

    it('should handle content with emojis', () => {
      const format = '{{content}}';
      const content = '🚀 Rocket 🎉 Party 🎨 Art';
      const result = processPlaceholders(format, content);
      expect(result).toBe('🚀 Rocket 🎉 Party 🎨 Art');
    });

    it('should handle content with HTML-like tags', () => {
      const format = '{{content}}';
      const content = '<div>Hello</div><p>World</p>';
      const result = processPlaceholders(format, content);
      expect(result).toBe('<div>Hello</div><p>World</p>');
    });
  });

  describe('date formatting edge cases', () => {
    it('should handle single digit month and day', () => {
      jest.setSystemTime(new Date('2023-01-05T09:05:03.123Z'));
      const format = '{{date}} {{time}} {{timestamp}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('2023-01-05 09:05:03 2023-01-05 09:05:03');
    });

    it('should handle leap year', () => {
      jest.setSystemTime(new Date('2024-02-29T12:00:00.123Z'));
      const format = '{{date}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('2024-02-29');
    });

    it('should handle year boundary', () => {
      jest.setSystemTime(new Date('2023-12-31T23:59:59.123Z'));
      const format = '{{date}} {{time}}';
      const content = 'Test';
      const result = processPlaceholders(format, content);
      expect(result).toBe('2023-12-31 23:59:59');
    });
  });
}); 