---
name: Universal Multilingual System
description: Language-agnostic AI processing, voice, and OCR across all VISU features
type: feature
---
- All edge functions (chat, analyze-document, analyze-image) auto-detect input language and respond in the same language
- AI returns `detected_language` (ISO 639-1) in analysis responses for downstream use
- Voice STT: accepts optional `langHint` param; empty string enables browser auto-detect
- Voice TTS: auto-detects script from text content (Devanagari, Arabic, CJK, etc.) and sets correct BCP 47 lang tag
- LANG_MAP in useVoice maps 30+ ISO 639-1 codes to BCP 47 tags
- Browser TTS with language-matched voice selection; graceful fallback if no matching voice found
- UTF-8 encoding handled natively by all systems
