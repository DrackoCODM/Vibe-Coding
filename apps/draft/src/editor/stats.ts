import type { Node as PMNode } from '@tiptap/pm/model';

export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
}

/** Count words/characters of a plain string (Unicode-aware whitespace split). */
export function countWords(text: string): WordStats {
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/u).length;
  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/gu, '').length,
  };
}

/** Extract the full plain text of a ProseMirror document. */
export function getDocText(doc: PMNode): string {
  return doc.textBetween(0, doc.content.size, '\n');
}
