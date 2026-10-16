import type { ExportBlock, PmNodeLike, TextRun } from './types';

function collectRuns(node: PmNodeLike, marks: Set<string> = new Set()): TextRun[] {
  const nextMarks = new Set(marks);
  for (const mark of node.marks ?? []) nextMarks.add(mark.type);
  if (node.type === 'text' && typeof node.text === 'string') {
    return [
      {
        text: node.text,
        bold: nextMarks.has('bold'),
        italic: nextMarks.has('italic'),
        underline: nextMarks.has('underline'),
        strike: nextMarks.has('strike'),
        code: nextMarks.has('code'),
      },
    ];
  }
  if (node.type === 'footnoteRef') {
    return [
      { text: '', footnoteId: typeof node.attrs?.noteId === 'string' ? node.attrs.noteId : '' },
    ];
  }
  if (node.type === 'bookmark') {
    return [];
  }
  if (node.type === 'crossRef') {
    return [
      {
        text: typeof node.attrs?.refLabel === 'string' ? node.attrs.refLabel : '',
        underline: true,
      },
    ];
  }
  return (node.content ?? []).flatMap((child) => collectRuns(child, nextMarks));
}

function joinRuns(runs: TextRun[]): TextRun[] {
  const joined: TextRun[] = [];
  for (const run of runs) {
    const last = joined[joined.length - 1];
    if (
      last &&
      last.bold === run.bold &&
      last.italic === run.italic &&
      last.underline === run.underline &&
      last.strike === run.strike &&
      last.code === run.code &&
      last.footnoteId === run.footnoteId
    ) {
      last.text += run.text;
    } else {
      joined.push({ ...run });
    }
  }
  return joined;
}

function isEmptyRuns(runs: TextRun[]): boolean {
  return runs.every((r) => r.text.trim() === '');
}

function convertNode(
  node: PmNodeLike,
  listStack: { ordered: boolean; level: number }[],
  out: ExportBlock[],
) {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level ?? 1);
      out.push({ type: 'heading', level, runs: joinRuns(collectRuns(node)) });
      break;
    }
    case 'paragraph': {
      const runs = joinRuns(collectRuns(node));
      if (isEmptyRuns(runs) && out.length > 0) break;
      if (listStack.length > 0) {
        const list = listStack[listStack.length - 1];
        out.push({ type: 'listItem', ordered: list.ordered, level: list.level, runs });
      } else {
        out.push({ type: 'paragraph', runs });
      }
      break;
    }
    case 'bulletList':
      for (const child of node.content ?? []) {
        convertNode(child, [...listStack, { ordered: false, level: listStack.length }], out);
      }
      break;
    case 'orderedList':
      for (const child of node.content ?? []) {
        convertNode(child, [...listStack, { ordered: true, level: listStack.length }], out);
      }
      break;
    case 'taskList':
      for (const child of node.content ?? []) {
        convertNode(child, [...listStack, { ordered: false, level: listStack.length }], out);
      }
      break;
    case 'listItem':
    case 'taskItem':
      for (const child of node.content ?? []) convertNode(child, listStack, out);
      break;
    case 'blockquote':
      out.push({ type: 'blockquote', runs: joinRuns(collectRuns(node)) });
      break;
    case 'horizontalRule':
      out.push({ type: 'horizontalRule' });
      break;
    case 'pageBreak':
      out.push({ type: 'pageBreak' });
      break;
    case 'caption': {
      const label = typeof node.attrs?.label === 'string' ? node.attrs.label : 'Figure';
      out.push({ type: 'caption', label, runs: joinRuns(collectRuns(node)) });
      break;
    }
    case 'table':
      for (const row of node.content ?? []) {
        if (row.type !== 'tableRow') continue;
        const cells = (row.content ?? []).map((cell) => [
          collectRuns(cell)
            .map((r) => r.text)
            .join(''),
        ]);
        out.push({ type: 'tableRow', cells });
      }
      break;
    case 'doc':
      for (const child of node.content ?? []) convertNode(child, listStack, out);
      break;
    default:
      for (const child of node.content ?? []) convertNode(child, listStack, out);
  }
}

/** Convert a ProseMirror JSON document into export blocks. */
export function pmJsonToBlocks(doc: PmNodeLike): ExportBlock[] {
  const out: ExportBlock[] = [];
  convertNode(doc, [], out);
  return out;
}
