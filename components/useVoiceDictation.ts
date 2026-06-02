"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API hook for live dictation. Returns:
 *  - supported: whether SpeechRecognition is available in this browser
 *  - listening: currently recording
 *  - interim: current in-progress transcript (live, may change as the engine refines)
 *  - error: most recent error, if any
 *  - start / stop: controls
 *
 * On `start`, the hook emits stable, finalised transcript chunks via the `onFinal`
 * callback so the consumer can append them to whatever buffer it controls (e.g.
 * the user's existing typed text). This avoids the hook having to own the textarea.
 *
 * Production swap path: if the noise-robustness of Web Speech proves inadequate
 * in real venues, replace with a `MediaRecorder` + server-side Whisper API call.
 * See `app/api/transcribe/route.ts` (not yet built) — same React surface.
 */

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceDictation({
  onFinal,
  lang = "en-GB",
}: {
  onFinal: (chunk: string) => void;
  lang?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinal);

  // Keep the latest onFinal callback without restarting recognition
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Voice input isn't supported on this browser.");
      return;
    }
    setError(null);
    setInterim("");
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;
    r.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) {
        onFinalRef.current(finalText.trim());
      }
      setInterim(interimText.trim());
    };
    r.onerror = (e) => {
      const code = e.error ?? "unknown";
      setError(
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone permission denied. Allow it in your browser, then try again."
          : code === "no-speech"
          ? "Didn't catch anything. Try again."
          : code === "audio-capture"
          ? "No microphone available."
          : `Voice input error: ${code}`,
      );
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      // Some browsers throw if start is called too quickly after a previous run.
      setError("Couldn't start. Try again.");
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
