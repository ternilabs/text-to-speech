import { encodeMp3WithFallbackSignal } from "./mp3";
import type { PcmAudio } from "@/features/tts/types";

type Mp3WorkerRequest = {
  type: "encode";
  jobId: string;
  audio: PcmAudio;
};

type Mp3WorkerResponse =
  | { type: "encoded"; jobId: string; mp3: Uint8Array }
  | { type: "error"; jobId: string; message: string };

const post = (message: Mp3WorkerResponse, transfer?: Transferable[]) => {
  self.postMessage(message, { transfer });
};

self.onmessage = async (event: MessageEvent<Mp3WorkerRequest>) => {
  const { jobId, audio } = event.data;
  const result = await encodeMp3WithFallbackSignal(audio);

  if (result.ok) {
    post({ type: "encoded", jobId, mp3: result.bytes }, [result.bytes.buffer]);
    return;
  }

  post({ type: "error", jobId, message: result.reason });
};
