---
name: Centralized AI Router Layer
description: All AI calls go through src/services/ai.ts with caching, dedup, retry, and unified error handling
type: feature
---
- All AI edge function calls are centralized in `src/services/ai.ts`
- `src/services/aiCache.ts` provides LRU cache (100 entries, configurable TTL) and in-flight request deduplication
- Components (VisualExplanation, VideoExplanation, Syllabus) no longer call edge functions directly — they use exported functions from ai.ts
- Cache TTLs: documents/images/URLs 10min, visuals 5min, videos 15min, syllabus 30min
- Streaming chat is NOT cached (real-time conversation)
- All non-streaming calls go through `callAI<T>()` which handles retry, timeout, caching, and dedup automatically
