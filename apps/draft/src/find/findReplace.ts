import type { Editor } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

export interface TextRange {
  from: number;
  to: number;
}

export interface FindOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build the regex used to search document text. */
export function buildSearchRegex(query: string, options: FindOptions = {}): RegExp | null {
  if (query === '') return null;
  const pattern = options.wholeWord ? `\\b(?:${escapeRegExp(query)})\\b` : escapeRegExp(query);
  return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
}

/**
 * Find every match of `query` in the document by walking its text nodes,
 * so returned ranges map 1:1 onto document positions.
 */
export function findDocMatches(doc: PMNode, query: string, options: FindOptions = {}): TextRange[] {
  const regex = buildSearchRegex(query, options);
  if (!regex) return [];
  const ranges: TextRange[] = [];
  let text = '';
  const segments: { start: number; end: number; docStart: number }[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    segments.push({ start: text.length, end: text.length + node.text.length, docStart: pos });
    text += node.text;
  });
  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const first = segments.find((s) => start >= s.start && start < s.end);
    const last = [...segments].reverse().find((s) => end > s.start && end <= s.end);
    if (!first || !last) continue;
    ranges.push({
      from: first.docStart + (start - first.start),
      to: last.docStart + (end - last.start),
    });
  }
  return ranges;
}

/** Index of the first match at or after `from`, wrapping around. */
export function nextMatchIndex(ranges: TextRange[], from: number): number {
  if (ranges.length === 0) return -1;
  const wrapped = ranges.findIndex((range) => range.from >= from);
  return wrapped === -1 ? 0 : wrapped;
}

/** Index of the last match before `from`, wrapping around. */
export function previousMatchIndex(ranges: TextRange[], from: number): number {
  if (ranges.length === 0) return -1;
  for (let i = ranges.length - 1; i >= 0; i -= 1) {
    if (ranges[i].to <= from) return i;
  }
  return ranges.length - 1;
}

/** Select the match at `index` inside the editor. */
export function selectMatch(editor: Editor, ranges: TextRange[], index: number): boolean {
  const range = ranges[index];
  if (!range) return false;
  const current = editor.state.selection;
  if (current.from === range.from && current.to === range.to) return true;
  const selection = TextSelection.create(editor.state.doc, range.from, range.to);
  editor.view.dispatch(editor.state.tr.setSelection(selection).scrollIntoView());
  void editor.commands.focus();
  return true;
}

/** Replace every match; returns how many replacements were made. */
export function replaceAll(
  editor: Editor,
  query: string,
  replacement: string,
  options: FindOptions = {},
): number {
  const ranges = findDocMatches(editor.state.doc, query, options);
  if (ranges.length === 0) return 0;
  let tr = editor.state.tr;
  let count = 0;
  for (let i = ranges.length - 1; i >= 0; i -= 1) {
    const range = ranges[i];
    tr = tr.replaceWith(range.from, range.to, tr.doc.type.schema.text(replacement));
    count += 1;
  }
  editor.view.dispatch(tr);
  return count;
}

/** Replace the single match at `index`; returns true when replaced. */
export function replaceCurrent(
  editor: Editor,
  ranges: TextRange[],
  index: number,
  replacement: string,
): boolean {
  const range = ranges[index];
  if (!range) return false;
  const node = editor.state.doc.type.schema.text(replacement);
  editor.view.dispatch(editor.state.tr.replaceWith(range.from, range.to, node));
  return true;
}
