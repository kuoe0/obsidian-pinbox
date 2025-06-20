/**
 * Processes a format string by replacing placeholders with actual content and date/time values.
 * @param format The format string containing placeholders like {{content}}, {{timestamp}}, {{date}}, {{time}}.
 * @param content The content to replace the {{content}} placeholder.
 * @returns The processed string with placeholders replaced.
 */
export function processPlaceholders(format: string, content: string): string {
	const now = new Date();
	const date = `${now.getFullYear()}-${(now.getMonth() + 1)
		.toString()
		.padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
	const time = `${now.getHours().toString().padStart(2, "0")}:${now
		.getMinutes()
		.toString()
		.padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
	const timestamp = `${date} ${time}`;

	return format
		.replace(/{{content}}/g, content)
		.replace(/{{timestamp}}/g, timestamp)
		.replace(/{{date}}/g, date)
		.replace(/{{time}}/g, time);
}