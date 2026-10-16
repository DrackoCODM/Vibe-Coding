import type { Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import {
  findDocMatches,
  nextMatchIndex,
  previousMatchIndex,
  replaceAll,
  replaceCurrent,
  selectMatch,
  type FindOptions,
  type TextRange,
} from '../find/findReplace';

export interface FindBarProps {
  editor: Editor | null;
  open: boolean;
  showReplace: boolean;
  onClose: () => void;
}

export function FindBar({ editor, open, showReplace, onClose }: FindBarProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<TextRange[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = (): FindOptions => ({ caseSensitive, wholeWord });

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  useEffect(() => {
    if (!editor || !open) return;
    const onUpdate = () => {
      const found = findDocMatches(editor.state.doc, query, options());
      setMatches(found);
      setCurrentIndex((index) => (index >= found.length ? 0 : index));
    };
    onUpdate();
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, open, query, caseSensitive, wholeWord]);

  const search = (nextQuery: string, nextOptions: FindOptions, from?: number) => {
    if (!editor) return;
    const found = findDocMatches(editor.state.doc, nextQuery, nextOptions);
    setMatches(found);
    if (found.length === 0) {
      setCurrentIndex(0);
      return;
    }
    const anchor = from ?? editor.state.selection.from;
    const index = nextMatchIndex(found, anchor);
    setCurrentIndex(index);
    selectMatch(editor, found, index);
  };

  const goNext = () => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    if (editor) selectMatch(editor, matches, next);
  };

  const goPrevious = () => {
    if (matches.length === 0) return;
    const prev = previousMatchIndex(matches, matches[currentIndex]?.from ?? 0);
    setCurrentIndex(prev);
    if (editor) selectMatch(editor, matches, prev);
  };

  const handleReplace = () => {
    if (!editor || matches.length === 0) return;
    replaceCurrent(editor, matches, currentIndex, replacement);
    const found = findDocMatches(editor.state.doc, query, options());
    setMatches(found);
    setCurrentIndex((index) => Math.min(index, Math.max(0, found.length - 1)));
  };

  const handleReplaceAll = () => {
    if (!editor || query === '') return;
    replaceAll(editor, query, replacement, options());
    const found = findDocMatches(editor.state.doc, query, options());
    setMatches(found);
    setCurrentIndex(0);
  };

  if (!open) return null;

  const countLabel =
    matches.length === 0 ? 'No results' : `${currentIndex + 1} of ${matches.length}`;

  return (
    <div
      role="search"
      aria-label="Find and replace"
      className="flex flex-wrap items-center gap-2 border-b border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <input
        ref={inputRef}
        type="text"
        aria-label="Find"
        placeholder="Find"
        className="w-44 rounded border border-gray-300 px-2 py-0.5 dark:border-gray-600 dark:bg-gray-800"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value, options());
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) goPrevious();
            else goNext();
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
      />
      <span
        aria-live="polite"
        data-testid="find-count"
        className="min-w-20 text-gray-500 dark:text-gray-400"
      >
        {countLabel}
      </span>
      <button
        type="button"
        aria-label="Previous match"
        className="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-50 dark:border-gray-600"
        disabled={matches.length === 0}
        onClick={goPrevious}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Next match"
        className="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-50 dark:border-gray-600"
        disabled={matches.length === 0}
        onClick={goNext}
      >
        ↓
      </button>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          aria-label="Match case"
          checked={caseSensitive}
          onChange={(e) => {
            setCaseSensitive(e.target.checked);
            search(query, { ...options(), caseSensitive: e.target.checked });
          }}
        />
        <span>Match case</span>
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          aria-label="Whole words"
          checked={wholeWord}
          onChange={(e) => {
            setWholeWord(e.target.checked);
            search(query, { ...options(), wholeWord: e.target.checked });
          }}
        />
        <span>Whole words</span>
      </label>
      {showReplace && (
        <>
          <input
            type="text"
            aria-label="Replace with"
            placeholder="Replace with"
            className="w-44 rounded border border-gray-300 px-2 py-0.5 dark:border-gray-600 dark:bg-gray-800"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleReplace();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-50 dark:border-gray-600"
            disabled={matches.length === 0}
            onClick={handleReplace}
          >
            Replace
          </button>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-40 dark:border-gray-600"
            disabled={query === ''}
            onClick={handleReplaceAll}
          >
            Replace all
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="Close find bar"
        className="ml-auto rounded border border-gray-300 px-2 py-0.5 dark:border-gray-600"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}
