/**
 * Text-to-Speech utility
 *
 * Ưu tiên:
 * 1. Browser speechSynthesis nếu có voice cho ngôn ngữ đó
 * 2. Server-side Google TTS API (/api/tools/tts) nếu đã cấu hình
 * 3. Free Google Translate TTS endpoint (không cần API key)
 *
 * Windows thường KHÔNG cài sẵn giọng tiếng Việt,
 * nên phải fallback sang server hoặc Google Translate TTS.
 */

// ---------------------------------------------------------------------------
// Voice cache
// ---------------------------------------------------------------------------
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReady = false;

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  voicesReady = cachedVoices.length > 0;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoices = window.speechSynthesis.getVoices();
    voicesReady = true;
  });
}

function ensureVoicesLoaded(): SpeechSynthesisVoice[] {
  if (cachedVoices.length === 0 && typeof window !== "undefined") {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------
const SPEECH_LANG_MAP: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  th: "th-TH",
  es: "es-ES",
  pt: "pt-BR",
  it: "it-IT",
  ru: "ru-RU",
};

export function toSpeechLang(lang: string): string {
  const normalized = lang.toLowerCase().split("-")[0];
  return SPEECH_LANG_MAP[normalized] || lang;
}

function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = ensureVoicesLoaded();
  const prefix = langCode.split("-")[0].toLowerCase();

  return (
    voices.find((v) => v.lang.replace("_", "-").toLowerCase() === langCode.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/** Kiểm tra trình duyệt có voice cho ngôn ngữ này không */
export function hasNativeVoice(lang: string): boolean {
  return getBestVoice(toSpeechLang(lang)) !== null;
}

// ---------------------------------------------------------------------------
// Audio element pool (tái sử dụng cho TTS fallback)
// ---------------------------------------------------------------------------
let audioEl: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
  }
  return audioEl;
}

// ---------------------------------------------------------------------------
// Server-side TTS proxy (tránh CORS — proxy qua /api/tools/tts)
// ---------------------------------------------------------------------------
function proxyTtsUrl(text: string, lang: string): string {
  const tl = lang.split("-")[0].toLowerCase();
  return `/api/tools/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(tl)}`;
}

/** Chia text thành các chunk ≤ maxLen ký tự, cắt theo câu/dấu phẩy */
function splitTextForTts(text: string, maxLen = 180): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Tìm vị trí cắt gần maxLen nhất (ưu tiên cuối câu, rồi dấu phẩy, rồi khoảng trắng)
    let cutAt = -1;
    for (let i = maxLen; i > maxLen * 0.4; i--) {
      const ch = remaining[i];
      if (ch === "." || ch === "!" || ch === "?" || ch === "…") {
        cutAt = i + 1;
        break;
      }
    }
    if (cutAt === -1) {
      for (let i = maxLen; i > maxLen * 0.4; i--) {
        if (remaining[i] === ",") {
          cutAt = i + 1;
          break;
        }
      }
    }
    if (cutAt === -1) {
      for (let i = maxLen; i > maxLen * 0.4; i--) {
        if (remaining[i] === " ") {
          cutAt = i + 1;
          break;
        }
      }
    }
    if (cutAt === -1) cutAt = maxLen;

    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  return chunks.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Phát audio qua Google Translate TTS (chained chunks)
// ---------------------------------------------------------------------------
type TtsCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

let currentAbort: AbortController | null = null;

async function playGoogleTranslateTts(
  text: string,
  lang: string,
  rate: number,
  callbacks: TtsCallbacks
): Promise<void> {
  // Abort bất kỳ phiên TTS nào đang chạy
  currentAbort?.abort();
  const abort = new AbortController();
  currentAbort = abort;

  const chunks = splitTextForTts(text, 180);
  const audio = getAudioElement();

  callbacks.onStart?.();

  for (let i = 0; i < chunks.length; i++) {
    if (abort.signal.aborted) return;

    const url = proxyTtsUrl(chunks[i], lang);
    audio.src = url;
    audio.playbackRate = rate;

    try {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          audio.pause();
          audio.removeAttribute("src");
          reject(new Error("aborted"));
        };
        abort.signal.addEventListener("abort", onAbort, { once: true });

        audio.onended = () => {
          abort.signal.removeEventListener("abort", onAbort);
          resolve();
        };
        audio.onerror = () => {
          abort.signal.removeEventListener("abort", onAbort);
          reject(new Error("audio error"));
        };

        audio.play().catch(reject);
      });
    } catch {
      if (abort.signal.aborted) return;
      callbacks.onError?.();
      return;
    }
  }

  if (!abort.signal.aborted) {
    callbacks.onEnd?.();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SpeakOptions {
  text: string;
  lang: string;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Phát TTS thông minh:
 * - Nếu trình duyệt có giọng đọc (voice) cho ngôn ngữ → dùng speechSynthesis
 * - Nếu không → dùng Google Translate TTS (miễn phí, hỗ trợ tiếng Việt)
 */
export function speak(options: SpeakOptions): void {
  const { text, lang, rate = 1, onStart, onEnd, onError } = options;
  if (!text.trim()) return;

  const speechLang = toSpeechLang(lang);
  const voice = getBestVoice(speechLang);

  if (voice) {
    // Có giọng đọc native → dùng speechSynthesis
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
  } else {
    // Không có giọng đọc → fallback Google Translate TTS
    void playGoogleTranslateTts(text, lang, rate, { onStart, onEnd, onError });
  }
}

/** Dừng mọi audio đang phát */
export function stopSpeaking(): void {
  // Dừng speechSynthesis
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  // Dừng Google Translate TTS
  currentAbort?.abort();
  const audio = audioEl;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
}

/** Tạm dừng */
export function pauseSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
  audioEl?.pause();
}

/** Tiếp tục */
export function resumeSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
  void audioEl?.play();
}
