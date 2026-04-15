import { useState, useCallback, useRef } from "react";

// Map ISO 639-1 codes to BCP 47 language tags for Speech APIs
const LANG_MAP: Record<string, string> = {
  en: "en-US", hi: "hi-IN", fr: "fr-FR", de: "de-DE", es: "es-ES",
  ar: "ar-SA", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", pt: "pt-BR",
  ru: "ru-RU", it: "it-IT", nl: "nl-NL", ta: "ta-IN", te: "te-IN",
  bn: "bn-IN", mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN",
  pa: "pa-IN", ur: "ur-PK", th: "th-TH", vi: "vi-VN", tr: "tr-TR",
  pl: "pl-PL", uk: "uk-UA", sv: "sv-SE", da: "da-DK", fi: "fi-FI",
  no: "nb-NO", el: "el-GR", he: "he-IL", id: "id-ID", ms: "ms-MY",
  ro: "ro-RO", cs: "cs-CZ", hu: "hu-HU", sw: "sw-KE",
};

function getBcp47(langCode?: string): string {
  if (!langCode) return "en-US";
  if (LANG_MAP[langCode]) return LANG_MAP[langCode];
  // Try as-is if it looks like a BCP 47 tag
  if (langCode.includes("-")) return langCode;
  return "en-US";
}

// Simple language detection heuristic for choosing STT language
function detectScriptLanguage(text: string): string | null {
  if (!text || text.length < 3) return null;
  // Check dominant script in first 200 chars
  const sample = text.slice(0, 200);
  if (/[\u0900-\u097F]/.test(sample)) return "hi"; // Devanagari
  if (/[\u0600-\u06FF]/.test(sample)) return "ar"; // Arabic
  if (/[\u4E00-\u9FFF]/.test(sample)) return "zh"; // Chinese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return "ja"; // Japanese
  if (/[\uAC00-\uD7AF]/.test(sample)) return "ko"; // Korean
  if (/[\u0B80-\u0BFF]/.test(sample)) return "ta"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(sample)) return "te"; // Telugu
  if (/[\u0980-\u09FF]/.test(sample)) return "bn"; // Bengali
  if (/[\u0A80-\u0AFF]/.test(sample)) return "gu"; // Gujarati
  if (/[\u0D00-\u0D7F]/.test(sample)) return "ml"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(sample)) return "pa"; // Punjabi
  if (/[\u0400-\u04FF]/.test(sample)) return "ru"; // Cyrillic
  if (/[\u0E00-\u0E7F]/.test(sample)) return "th"; // Thai
  return null; // Default to auto-detect
}

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Accept optional language hint for STT
  const startListening = useCallback((langHint?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error("Speech recognition not supported in this browser"));
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      // Use language hint or default — empty string enables auto-detect on some browsers
      recognition.lang = langHint ? getBcp47(langHint) : "";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        reject(new Error(event.error));
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
    });
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Accept optional language code for TTS
  const speak = useCallback((text: string, langCode?: string) => {
    // Strip markdown for cleaner speech
    const cleanText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-•]\s/g, "")
      .replace(/\n+/g, ". ");

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Auto-detect language from text content if not provided
    const detectedLang = langCode || detectScriptLanguage(cleanText);
    const bcp47 = getBcp47(detectedLang || undefined);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = bcp47;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(bcp47.split("-")[0]));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking };
};
