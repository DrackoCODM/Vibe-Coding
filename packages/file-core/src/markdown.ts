import { marked } from 'marked';
import TurndownService from 'turndown';

marked.setOptions({ gfm: true, breaks: false });

/** Convert Markdown to an HTML fragment. */
export function markdownToHtml(markdown: string): string {
  const result = marked.parse(markdown, { async: false });
  return typeof result === 'string' ? result : '';
}

/** Convert an HTML fragment to GitHub-flavoured Markdown. */
export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  return turndown.turndown(html);
}
