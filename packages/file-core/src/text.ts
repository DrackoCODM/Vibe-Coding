const BLOCK_TAGS = /<\/?(p|div|h[1-6]|li|ul|ol|blockquote|pre|tr|table|br|hr)\b[^>]*>/gi;

/** Convert an HTML fragment to plain text, preserving block boundaries as newlines. */
export function htmlToPlainText(html: string): string {
  const withBreaks = html.replace(BLOCK_TAGS, (tag) => {
    const name = tag.replace(/[<>/]/g, '').split(/[\s>]/)[0].toLowerCase();
    if (name === 'br') return '\n';
    if (name === 'hr') return '\n---\n';
    if (/^h[1-6]$/.test(name)) return '\n\n';
    if (name === 'li') return '\n- ';
    return '\n\n';
  });
  const text = withBreaks
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert plain text to an HTML fragment (blank-line paragraphs, # headings). */
export function plainTextToHtml(text: string): string {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('');
}
