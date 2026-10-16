import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { getEditorExtensions } from '../editor/extensions';
import { countWords, getDocText } from '../editor/stats';
import {
  buildSearchRegex,
  findDocMatches,
  nextMatchIndex,
  previousMatchIndex,
  replaceAll,
  replaceCurrent,
  selectMatch,
} from './findReplace';

let editor: Editor;

function makeEditor(content: string): Editor {
  editor = new Editor({ extensions: getEditorExtensions(), content });
  return editor;
}

afterEach(() => {
  editor?.destroy();
});

describe('countWords', () => {
  it('counts words and characters', () => {
    expect(countWords('hello world')).toMatchObject({
      words: 2,
      characters: 11,
      charactersNoSpaces: 10,
    });
  });

  it('handles empty and whitespace-only text', () => {
    expect(countWords('').words).toBe(0);
    expect(countWords('   \n ').words).toBe(0);
  });

  it('treats multiple whitespace as one separator', () => {
    expect(countWords('a \n\t b').words).toBe(2);
  });
});

describe('getDocText', () => {
  it('joins paragraphs with newlines', () => {
    const doc = makeEditor('<p>one</p><p>two</p>');
    expect(getDocText(doc.state.doc)).toBe('one\ntwo');
  });
});

describe('buildSearchRegex', () => {
  it('is null for empty query', () => {
    expect(buildSearchRegex('')).toBeNull();
  });

  it('is case-insensitive by default and sensitive on demand', () => {
    expect(buildSearchRegex('cat')?.test('CAT')).toBe(true);
    expect(buildSearchRegex('cat', { caseSensitive: true })?.test('CAT')).toBe(false);
  });

  it('matches whole words only when requested', () => {
    expect(buildSearchRegex('cat', { wholeWord: true })?.test('concatenate')).toBe(false);
    expect(buildSearchRegex('cat', { wholeWord: true })?.test('the cat sat')).toBe(true);
  });

  it('escapes regex metacharacters', () => {
    expect(buildSearchRegex('a.b')?.test('axb')).toBe(false);
    expect(buildSearchRegex('a.b')?.test('a.b')).toBe(true);
  });
});

describe('findDocMatches', () => {
  it('finds matches across text nodes with real positions', () => {
    const doc = makeEditor('<p>hello <strong>hello</strong></p><p>hello</p>');
    const ranges = findDocMatches(doc.state.doc, 'hello');
    expect(ranges).toHaveLength(3);
    for (const range of ranges) {
      expect(doc.state.doc.textBetween(range.from, range.to)).toBe('hello');
    }
  });

  it('returns empty for empty query or no matches', () => {
    const doc = makeEditor('<p>hello</p>');
    expect(findDocMatches(doc.state.doc, '')).toHaveLength(0);
    expect(findDocMatches(doc.state.doc, 'zzz')).toHaveLength(0);
  });

  it('respects case sensitivity', () => {
    const doc = makeEditor('<p>Hello hello</p>');
    expect(findDocMatches(doc.state.doc, 'hello')).toHaveLength(2);
    expect(findDocMatches(doc.state.doc, 'hello', { caseSensitive: true })).toHaveLength(1);
  });
});

describe('match navigation', () => {
  it('finds the next match at or after a position, wrapping forward', () => {
    const ranges = [
      { from: 5, to: 8 },
      { from: 20, to: 23 },
    ];
    expect(nextMatchIndex(ranges, 0)).toBe(0);
    expect(nextMatchIndex(ranges, 21)).toBe(0);
    expect(nextMatchIndex([], 0)).toBe(-1);
  });

  it('finds the previous match before a position, wrapping backward', () => {
    const ranges = [
      { from: 5, to: 8 },
      { from: 20, to: 23 },
    ];
    expect(previousMatchIndex(ranges, 20)).toBe(0);
    expect(previousMatchIndex(ranges, 5)).toBe(1);
    expect(previousMatchIndex([], 0)).toBe(-1);
  });
});

describe('selectMatch', () => {
  it('selects the range in the editor', () => {
    const doc = makeEditor('<p>alpha beta alpha</p>');
    const ranges = findDocMatches(doc.state.doc, 'alpha');
    expect(selectMatch(doc, ranges, 1)).toBe(true);
    expect(doc.state.selection.from).toBe(ranges[1].from);
    expect(doc.state.selection.to).toBe(ranges[1].to);
  });

  it('is a no-op for an invalid index', () => {
    const doc = makeEditor('<p>alpha</p>');
    const ranges = findDocMatches(doc.state.doc, 'alpha');
    expect(selectMatch(doc, ranges, 99)).toBe(false);
  });
});

describe('replace', () => {
  it('replaces all matches across blocks', () => {
    const doc = makeEditor('<p>cat cat</p><p>cat</p>');
    expect(replaceAll(doc, 'cat', 'dog')).toBe(3);
    expect(getDocText(doc.state.doc)).toBe('dog dog\ndog');
  });

  it('replaces only the requested match', () => {
    const doc = makeEditor('<p>cat cat</p>');
    const ranges = findDocMatches(doc.state.doc, 'cat');
    expect(replaceCurrent(doc, ranges, 1, 'dog')).toBe(true);
    expect(getDocText(doc.state.doc)).toBe('cat dog');
  });

  it('does nothing without matches', () => {
    const doc = makeEditor('<p>cat</p>');
    expect(replaceAll(doc, 'bird', 'dog')).toBe(0);
    expect(replaceCurrent(doc, [], 0, 'dog')).toBe(false);
    expect(getDocText(doc.state.doc)).toBe('cat');
  });
});
