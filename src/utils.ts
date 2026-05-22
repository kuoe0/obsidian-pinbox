import { moment } from "obsidian";

/**
 * Processes a format string by replacing placeholders with actual content and date/time values.
 * @param format The format string containing placeholders like {{content}}, {{timestamp}}, {{date}}, {{time}}.
 * @param content The content to replace the {{content}} placeholder.
 * @returns The processed string with placeholders replaced.
 */
export function processPlaceholders(format?: string, content?: string): string {
  format = format ?? '';
  content = content ?? '';
  const now = moment();

  const dateDefault = now.format("YYYY-MM-DD");
  const timeDefault = now.format("HH:mm:ss");
  const timestampDefault = now.format("YYYY-MM-DD HH:mm:ss");

  let result = format
    .replace(/{{content}}/g, content)
    .replace(/{{timestamp}}/g, timestampDefault)
    .replace(/{{date}}/g, dateDefault)
    .replace(/{{time}}/g, timeDefault);

  // Dynamic Moment formatting: {{date:FORMAT}}, {{time:FORMAT}}, {{timestamp:FORMAT}}
  result = result.replace(/{{date:(.*?)}}/g, (_, fmt) => now.format(fmt));
  result = result.replace(/{{time:(.*?)}}/g, (_, fmt) => now.format(fmt));
  result = result.replace(/{{timestamp:(.*?)}}/g, (_, fmt) => now.format(fmt));

  return result;
}
