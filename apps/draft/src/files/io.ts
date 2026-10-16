export interface PickedFile {
  name: string;
  file: File;
}

function showPicker(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(file);
    });
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });
    input.click();
  });
}

/** Open a file picker and return the chosen File (or null if cancelled). */
export async function pickFileToOpen(accept: string): Promise<PickedFile | null> {
  const file = await showPicker(accept);
  return file ? { name: file.name, file } : null;
}

type SaveFilePickerOptions = {
  suggestedName: string;
  description: string;
  accept: Record<string, string[]>;
};

type WindowWithPicker = Window & {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

/** True when the File System Access API (showSaveFilePicker) is available. */
export function canUseFileSystemAccess(): boolean {
  return typeof (window as WindowWithPicker).showSaveFilePicker === 'function';
}

/** Ask for a save destination; returns the handle (Chromium) or null (use download fallback). */
export async function pickSaveDestination(
  suggestedName: string,
  description: string,
  extension: string,
): Promise<FileSystemFileHandle | null> {
  const picker = (window as WindowWithPicker).showSaveFilePicker;
  if (!picker) return null;
  try {
    return await picker({
      suggestedName,
      description,
      accept: { [`.${extension}`]: [`.${extension}`] },
    });
  } catch {
    return null;
  }
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
