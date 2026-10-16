import type { GdraftDocument } from './types';

export const GDRAFT_VERSION = 1 as const;

export function createEmptyGdraft(title = 'Untitled'): GdraftDocument {
  const now = new Date().toISOString();
  return {
    version: GDRAFT_VERSION,
    meta: { title, createdAt: now, updatedAt: now },
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  };
}

export function serializeGdraft(doc: GdraftDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseGdraft(text: string): GdraftDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid .gdraft file: not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid .gdraft file: expected an object');
  }
  const doc = parsed as Partial<GdraftDocument>;
  if (doc.version !== GDRAFT_VERSION) {
    throw new Error(`Unsupported .gdraft version: ${String(doc.version)}`);
  }
  if (typeof doc.content !== 'object' || doc.content === null) {
    throw new Error('Invalid .gdraft file: missing content');
  }
  return {
    version: GDRAFT_VERSION,
    meta: {
      title: typeof doc.meta?.title === 'string' ? doc.meta.title : 'Untitled',
      createdAt:
        typeof doc.meta?.createdAt === 'string' ? doc.meta.createdAt : new Date().toISOString(),
      updatedAt:
        typeof doc.meta?.updatedAt === 'string' ? doc.meta.updatedAt : new Date().toISOString(),
    },
    content: doc.content,
  };
}

export function withUpdatedAt(doc: GdraftDocument): GdraftDocument {
  return { ...doc, meta: { ...doc.meta, updatedAt: new Date().toISOString() } };
}
