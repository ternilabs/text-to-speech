export type StorageEstimateResult = {
  quota: number;
  usage: number;
  remaining: number;
  requiredBytes: number;
};

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export const formatBytes = (bytes: number) => {
  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(1)} GB`;
  }
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
  if (bytes >= KB) {
    return `${Math.round(bytes / KB)} KB`;
  }
  return `${Math.max(0, Math.round(bytes))} B`;
};

export const checkStorageEstimate = async (
  requiredBytes: number,
  minFreeBytes: number,
): Promise<StorageEstimateResult | null> => {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }

  const { quota, usage } = await navigator.storage.estimate();
  if (typeof quota !== "number" || typeof usage !== "number") {
    return null;
  }

  const remaining = Math.max(0, quota - usage);
  const threshold = Math.max(minFreeBytes, requiredBytes);

  if (remaining < threshold) {
    return { quota, usage, remaining, requiredBytes };
  }

  return null;
};
