import { Zip } from "fflate";

type FileSystemWritableFileStream = {
  write: (data: ArrayBuffer) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
};

type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle>;
};

export const supportsZipStreaming = () =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.click();
  URL.revokeObjectURL(url);
};

const toArrayBuffer = (chunk: Uint8Array): ArrayBuffer => {
  if (chunk.buffer instanceof ArrayBuffer) {
    return chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
  }
  return new Uint8Array(chunk).buffer;
};

export const createZipWriter = async (filename: string) => {
  const canStreamToDisk = supportsZipStreaming();

  if (canStreamToDisk) {
    const handle = await (window as unknown as SavePickerWindow).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "Zip archive", accept: { "application/zip": [".zip"] } }],
    });
    const writable = await handle.createWritable();
    let writeChain = Promise.resolve();
    let isAborted = false;
    let resolveDone: () => void = () => {};
    let rejectDone: (error: Error) => void = () => {};
    const done = new Promise<void>((resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    });

    const zip = new Zip((err, data, final) => {
      if (isAborted) {
        return;
      }
      if (err) {
        rejectDone(err);
        return;
      }
      if (data) {
        const chunk = toArrayBuffer(new Uint8Array(data));
        writeChain = writeChain.then(() => writable.write(chunk));
      }
      if (final) {
        resolveDone();
      }
    });

    return {
      zip,
      abort: async () => {
        if (isAborted) {
          return;
        }
        isAborted = true;
        zip.terminate();
        try {
          await writable.abort();
        } catch {
          // Some browsers reject abort after the stream has already closed.
        }
        rejectDone(new Error("Zip export aborted"));
      },
      finalize: async () => {
        if (isAborted) {
          return;
        }
        zip.end();
        await done;
        await writeChain;
        await writable.close();
      },
    };
  }

  const chunks: ArrayBuffer[] = [];
  let isAborted = false;
  let resolveDone: () => void = () => {};
  let rejectDone: (error: Error) => void = () => {};
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const zip = new Zip((err, data, final) => {
    if (isAborted) {
      return;
    }
    if (err) {
      rejectDone(err);
      return;
    }
    if (data) {
      chunks.push(toArrayBuffer(new Uint8Array(data)));
    }
    if (final) {
      resolveDone();
    }
  });

  return {
    zip,
    abort: async () => {
      if (isAborted) {
        return;
      }
      isAborted = true;
      zip.terminate();
      chunks.length = 0;
      rejectDone(new Error("Zip export aborted"));
    },
    finalize: async () => {
      if (isAborted) {
        return;
      }
      zip.end();
      await done;
      downloadBlob(new Blob(chunks, { type: "application/zip" }), filename);
    },
  };
};
