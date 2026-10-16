import Image from '@tiptap/extension-image';

export const ImageWithAlign = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align') ?? 'left',
        renderHTML: (attributes: Record<string, unknown>) => {
          const align = String(attributes.align ?? 'left');
          const margin =
            align === 'center'
              ? 'margin-left: auto; margin-right: auto;'
              : align === 'right'
                ? 'margin-left: auto; margin-right: 0;'
                : 'margin-left: 0; margin-right: auto;';
          return {
            'data-align': align,
            style: `display: block; ${margin}`,
          };
        },
      },
    };
  },
});

const IMAGE_MIME_PREFIX = 'image/';

export function isImageFile(file: File): boolean {
  return file.type.startsWith(IMAGE_MIME_PREFIX);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function imageFilesFromDataTransfer(data: DataTransfer): File[] {
  const files: File[] = [];
  if (data.files) {
    for (const file of Array.from(data.files)) {
      if (isImageFile(file)) files.push(file);
    }
  }
  return files;
}
