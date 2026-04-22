# 📚 VISU – AI-Powered Study Companion

> Upload your notes. Chat with an AI tutor. Track your mastery. Study smarter.

VISU is a full-stack AI learning app that turns your study materials into an interactive learning experience — with flashcards, quizzes, visual explanations, a daily study planner, and a friendly puppy mascot to keep you motivated.

---

## ✨ Features

### 🤖 AI Study Chat
Chat with a personalized AI tutor with streaming responses. Switch between study modes:
- **Chat** – Ask anything
- **Teach Back** – Explain a concept to lock it in
- **Quiz Mode** – AI quizzes you on the topic
- **Quick Mode** – Bite-sized 2-minute lessons

### 📄 Upload Notes
Upload PDFs or Word documents (.docx). VISU extracts topics and lets you dive straight into studying them.

### 🃏 Flashcards
AI-generated flashcards with spaced repetition. Cards are scheduled for review based on how well you know them.

### 🧠 Quizzes
Generate multiple-choice quizzes on any topic with instant feedback and explanations.

### 📈 Progress Tracking
Per-topic mastery scores. See which topics you're strong in, which need work, and track improvement over time.

### 📅 Daily Study Planner
AI generates a personalized daily study plan based on your weak topics and due flashcards.

### 🐾 Puppy Mascot
An animated mascot that reacts to your progress — celebrates streaks and keeps you motivated.

### 🌙 Dark Mode + Auth
Full light/dark theme support. Secure sign up, login, and password reset via Supabase.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Routing | React Router v6 |
| Backend / DB | Supabase (Postgres + Auth) |
| Document Parsing | pdfjs-dist, mammoth |
| State Management | TanStack Query |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

git clone https://github.com/vibhagoparaju/visu-learn-wise.git
cd visu-learn-wise
npm install

### Environment Setup

Create a `.env` file in the root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

### Run Locally

npm run dev

### Build for Production

npm run build

---

## 📁 Project Structure

src/
├── components/
│   ├── mascot/       # Puppy mascot animations
│   ├── study/        # Study UI components
│   ├── onboarding/   # First-time user walkthrough
│   └── ui/           # shadcn/ui base components
├── hooks/            # Custom hooks (auth, voice, theme, etc.)
├── integrations/     # Supabase client + types
├── lib/              # Security utils
├── pages/            # App routes
└── services/         # AI chat, XP, study planner

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch (git checkout -b feature/my-feature)
3. Commit your changes (git commit -m 'Add my feature')
4. Push and open a Pull Request

---

## 📄 License

MIT License.
