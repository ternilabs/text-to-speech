import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { ZipPassThrough } from "fflate";
import { encodeMp3WithFallbackSignal } from "../tts/audio/mp3";
import { validateMp3 } from "../tts/audio/validate";
import { encodeWav } from "../tts/audio/wav";
import { createTtsWorkerClient } from "../tts/workerClient";
import type { DeviceOption, OutputFormat } from "../tts/types";
import type { BulkRow } from "./csv";
import { createUniqueFilenameStems } from "./filename";
import {
  buildResultsManifest,
  type BulkRowOutcome,
} from "./results";
import { createZipWriter } from "./zip";

export type BulkExportInput = {
  rows: BulkRow[];
  voice: string;
  device: DeviceOption;
  format: OutputFormat;
  speed?: number;
  filename?: string;
};

type ProgressState = {
  current: number;
  total: number;
  percent: number;
};

type ZipWriter = Awaited<ReturnType<typeof createZipWriter>>;
type TtsWorkerClient = ReturnType<typeof createTtsWorkerClient>;

const createInitialProgress = (total = 0): ProgressState => ({
  current: 0,
  total,
  percent: 0,
});

const createProgress = (current: number, total: number): ProgressState => ({
  current,
  total,
  percent: total > 0 ? Math.round((current / total) * 100) : 0,
});

const createZipFilename = () => `tts-bulk-${Date.now()}.zip`;

const toBytes = (buffer: ArrayBuffer | Uint8Array) =>
  buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

const addZipEntry = (writer: ZipWriter, filename: string, bytes: ArrayBuffer | Uint8Array) => {
  const entry = new ZipPassThrough(filename);
  writer.zip.add(entry);
  entry.push(toBytes(bytes), true);
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.message === "bulk-cancelled";

export function useBulkExport(): {
  isExporting: boolean;
  isCancelling: boolean;
  progress: ProgressState;
  warnings: string[];
  error: string | null;
  generateZip(input: BulkExportInput): Promise<void>;
  cancel(): void;
} {
  const [isExporting, setIsExporting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(createInitialProgress);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const zipWriterRef = useRef<ZipWriter | null>(null);
  const workerClientRef = useRef<TtsWorkerClient | null>(null);

  const appendWarning = useCallback((message: string) => {
    setWarnings((current) => [...current, message]);
  }, []);

  const cancel = useCallback(() => {
    const abortController = abortControllerRef.current;
    if (!abortController || abortController.signal.aborted) {
      return;
    }

    setIsCancelling(true);
    abortController.abort();
    workerClientRef.current?.cancel();
  }, []);

  const generateZip = useCallback(
    async (input: BulkExportInput) => {
      if (isExporting) {
        setError("Bulk export is already running.");
        return;
      }

      if (input.rows.length === 0) {
        setError("No CSV rows are loaded.");
        return;
      }

      const abortController = new AbortController();
      const { signal } = abortController;
      const outcomes: BulkRowOutcome[] = [];
      const filenameStems = createUniqueFilenameStems(input.rows);
      const workerClient = createTtsWorkerClient({
        onFallback: (message) => appendWarning(message.message),
      });

      abortControllerRef.current = abortController;
      workerClientRef.current = workerClient;
      setIsExporting(true);
      setIsCancelling(false);
      setProgress(createInitialProgress(input.rows.length));
      setWarnings([]);
      setError(null);

      try {
        await workerClient.load(input.device);
        const zipWriter = await createZipWriter(input.filename ?? createZipFilename());
        zipWriterRef.current = zipWriter;

        for (let index = 0; index < input.rows.length; index += 1) {
          const row = input.rows[index];
          const warningsForRow: string[] = [];
          let outputFormat: OutputFormat | null = null;
          let outputFilename: string | null = null;
          let rowError: string | null = null;

          if (signal.aborted) {
            throw new Error("bulk-cancelled");
          }

          try {
            const audio = await workerClient.generate({
              text: row.text,
              voice: input.voice,
              device: input.device,
              speed: input.speed,
            });
            const wavBuffer = encodeWav(audio);

            if (signal.aborted) {
              throw new Error("bulk-cancelled");
            }

            if (input.format === "mp3") {
              const mp3 = await encodeMp3WithFallbackSignal(audio);
              const isValidMp3 = mp3.ok ? await validateMp3(mp3.bytes) : false;

              if (mp3.ok && isValidMp3) {
                outputFormat = "mp3";
                outputFilename = `${filenameStems[index]}.mp3`;
                addZipEntry(zipWriter, outputFilename, mp3.bytes);
              } else {
                outputFormat = "wav";
                outputFilename = `${filenameStems[index]}.wav`;
                warningsForRow.push("mp3_failed_fallback_wav");
                addZipEntry(zipWriter, outputFilename, wavBuffer);
              }
            } else {
              outputFormat = "wav";
              outputFilename = `${filenameStems[index]}.wav`;
              addZipEntry(zipWriter, outputFilename, wavBuffer);
            }
          } catch (rowException) {
            if (signal.aborted || isAbortError(rowException)) {
              throw new Error("bulk-cancelled");
            }

            rowError = rowException instanceof Error ? rowException.message : "Unable to generate audio.";
          } finally {
            outcomes.push({
              rowIndex: row.rowIndex,
              id: row.id,
              textLength: row.text.length,
              status: rowError ? "error" : "ok",
              requestedFormat: input.format,
              outputFormat,
              filename: outputFilename,
              warnings: warningsForRow,
              error: rowError,
            });
            setProgress(createProgress(index + 1, input.rows.length));
          }
        }

        addZipEntry(
          zipWriter,
          "results.json",
          new TextEncoder().encode(
            buildResultsManifest({
              generatedAt: new Date().toISOString(),
              formatRequested: input.format,
              rows: outcomes,
            }),
          ),
        );
        await zipWriter.finalize();
      } catch (exportException) {
        if (signal.aborted || isAbortError(exportException)) {
          await zipWriterRef.current?.abort();
          setError(null);
          throw new Error("Bulk export cancelled.");
        }

        await zipWriterRef.current?.abort();
        const nextError =
          exportException instanceof Error ? exportException.message : "Unable to export bulk audio.";
        setError(nextError);
        throw new Error(nextError);
      } finally {
        workerClient.dispose();
        workerClientRef.current = null;
        zipWriterRef.current = null;
        abortControllerRef.current = null;
        setIsExporting(false);
        setIsCancelling(false);
      }
    },
    [appendWarning, isExporting],
  );

  return useMemo(
    () => ({
      isExporting,
      isCancelling,
      progress,
      warnings,
      error,
      generateZip,
      cancel,
    }),
    [cancel, error, generateZip, isCancelling, isExporting, progress, warnings],
  );
}
