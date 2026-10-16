import { EditorContent, type Editor } from '@tiptap/react';
import { mmToPx, PAGE_SIZES } from '@gratis/shared';

export interface EditorPageProps {
  editor: Editor | null;
}

export function EditorPage({ editor }: EditorPageProps) {
  const width = mmToPx(PAGE_SIZES.a4.widthMm);
  const height = mmToPx(PAGE_SIZES.a4.heightMm);
  return (
    <div
      aria-label="Page canvas"
      className="mx-auto bg-white px-16 py-14 shadow-lg dark:bg-gray-100"
      style={{ width, minHeight: height }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
