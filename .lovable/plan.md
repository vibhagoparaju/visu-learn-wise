

# VISU Enhancement Plan: Calm, Intelligent Learning System

## Overview

Refine VISU from a feature-rich app into a calm, focused, habit-forming learning system. No new backend tables or auth changes — only frontend intelligence, UX polish, and tighter feature integration.

---

## 1. Calm UI Transformation

**Files:** `src/index.css`, `tailwind.config.ts`, multiple page components

- Increase whitespace across all pages (larger padding, more spacing between sections)
- Soften shadows and reduce visual noise (fewer gradients, subtler cards)
- Reduce emoji density — use sparingly for key moments only
- Simplify Dashboard: collapse stats row into a single clean card, reduce quick actions from 3 columns to a simpler layout
- One primary CTA per section instead of multiple buttons
- Softer color palette: reduce gradient intensity, use more muted tones

## 2. "Retain This Topic" Button + Auto-Flashcard Generation

**Files:** `src/pages/Study.tsx`, `src/pages/Flashcards.tsx`

- Add a "Retain this topic 🧠" button after each AI explanation in Study chat
- Clicking it calls the AI to generate 3-5 flashcards from the explanation content and inserts them into the `flashcards` table
- After a study session ends (user navigates away or after 3+ exchanges), show a subtle prompt: "Save key concepts as flashcards?"

## 3. Quick Revision Mode

**Files:** `src/pages/Flashcards.tsx`, `src/pages/Dashboard.tsx`

- Add "5-min Revision" button on Dashboard that fetches due flashcards and launches a rapid review session
- Simplified card UI: large text, tap to flip, swipe-style "Got it" / "Didn't know" buttons
- Show due card count on Dashboard (e.g., "12 cards due for review")

## 4. Memory Insights on Dashboard

**Files:** `src/pages/Dashboard.tsx`

- Replace or augment the current stats row with a "Memory Health" card showing:
  - Memory score (average mastery across all flashcard topics)
  - Strong topics count vs weak topics count
  - Next review session info

## 5. Study Flow: Topic → Explain → Question → Retain → Next

**Files:** `src/pages/Study.tsx`

- After AI explanation, auto-append a follow-up question (the chat function already supports this via prompt)
- After user answers, show feedback + "Retain" button + "Next topic" suggestion
- Ensure the loop is: Explain → Question → Feedback → Retain → Next (no passive dead-ends)

## 6. AI Response Quality Polish

**Files:** `supabase/functions/chat/index.ts`

- Tighten system prompt: enforce max 200-word explanations, reduce verbosity
- Add explicit rule: "For basic/fundamental topics, use language a 10-year-old understands"
- Ensure consistent Explanation → Example → Key Points structure
- Add rule: "After explaining, always ask ONE follow-up question to check understanding"

## 7. Continue Study Fix

**Files:** `src/pages/Dashboard.tsx`, `src/pages/StudyHistory.tsx`

- "Continue Study" quick action navigates to `/history` (already correct)
- Add "Last studied" card on Dashboard showing the most recent topic with a direct "Resume" button that opens `/study/{topic}`

## 8. Global Search Enhancement

**Files:** `src/components/GlobalSearch.tsx`

- Add result categorization with section headers: "Topics", "Documents", "Conversations"
- Add keyboard navigation (arrow keys to select, Enter to open)
- Show recent searches when search is empty

## 9. Study Planner Intelligence

**Files:** `src/services/studyPlanner.ts`, `src/pages/Dashboard.tsx`

- Enhance `generateDailyPlan` to also consider:
  - Flashcard due counts (prioritize topics with many due cards)
  - Days since last study of each topic
- Add a "5-min quick revision" task automatically when due flashcards exist

## 10. Sidebar & Navigation Cleanup

**Files:** `src/components/layout/AppSidebar.tsx`, `src/components/layout/MobileNav.tsx`

- Group nav items visually: Learning (Study, Upload) | Review (Flashcards, Quiz) | Track (Progress, History, Bookmarks) | System (Settings)
- Remove the "Pro Tip" card from sidebar (reduces noise)
- Subtle separators between groups

---

## Technical Notes

- **No database migrations** — all changes use existing tables (`flashcards`, `study_progress`, `documents`, `bookmarks`)
- **No auth changes** — existing email/password + Google Sign-In unchanged
- **Edge function update** — only the `chat` function system prompt is refined
- **All changes are frontend-only** except the chat prompt refinement

## Implementation Order

1. Calm UI transformation (CSS + layout changes)
2. AI response quality fix (edge function)
3. Retain button + auto-flashcard generation
4. Quick revision mode + due cards on dashboard
5. Study flow optimization (explain → question → retain loop)
6. Continue Study fix + last studied card
7. Search enhancement + planner intelligence
8. Sidebar cleanup

