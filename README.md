# MindGuard AI - Premium Mental Health Companion

MindGuard AI is an advanced, fully-featured mental health and emotional support web application. Built with a premium, Apple-inspired modern glassmorphic design, it offers a safe, empathetic, and interactive environment for users to track their emotional state, engage in guided exercises, and get AI-assisted emotional support in real-time.

The application leverages **IBM watsonx.ai** for natural language understanding and insight generation, and **IBM Cloudant** for secure, persistent data storage.

## ✨ Core Features

### 1. 🤖 AI Chat Companion (with RAG & Safety)
- **Empathetic AI**: Powered by `ibm/granite-13b-chat-v2` via watsonx.ai, the chatbot provides compassionate, human-like conversations.
- **RAG Integration**: Automatically pulls domain knowledge from internal mental health manuals (e.g., CBT techniques, grounding exercises) to provide factual, helpful advice.
- **Safety Classifier**: Every user message is scanned by a real-time safety classification layer. If self-harm or crisis keywords are detected, the AI intercepts the conversation and provides immediate SOS resources.

### 2. 📊 Premium Mood Tracker
- **Interactive Logging**: Users can log their mood using a beautiful 9-card interactive grid, complete with intensity sliders and custom notes.
- **AI Insights**: Upon saving a mood, the watsonx.ai engine instantly generates a personalized 2-3 sentence insight validating the user's feelings.
- **Dynamic Dashboard**: Features a 7-day mood timeline chart, streak counters, and "Most Frequent" mood statistics.

### 3. 🧘 Interactive Self-Care & Exercises
The application includes 6 fully guided, immersive full-screen exercise mini-apps:
- **Deep Breathing**: Synchronized 4-7-8 breathing circle animation.
- **Sleep Meditation**: Guided visualization with a 10-minute timer and calming animations.
- **Focus Binaural**: Deep focus Pomodoro-style timer with visual equalizers.
- **Light Stretch**: Step-by-step desk stretching routines.
- **Mindful Break**: 3-minute guided pauses with grounding prompts.
- **Gratitude Journal**: Reflective forms that save directly to Cloudant.

### 4. 🚨 Emergency & SOS Systems
- **Crisis Detection**: Cross-platform crisis detection that immediately triggers unmissable red Emergency Banners if the user expresses distress in chats, journals, or mood notes.
- **Dedicated Emergency Hub**: A dedicated page featuring immediate, 1-tap dial buttons for global crisis hotlines (Suicide Hotline, Domestic Violence, Medical).

### 5. 📔 Private Journaling
- A clean, distraction-free journaling interface where users can write down their thoughts. 
- All entries are saved securely to Cloudant and are fully searchable.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS (Premium Glassmorphism Design)
- Framer Motion (Micro-interactions and layout transitions)
- Lucide React (Minimalist Iconography)

**Backend:**
- Node.js & Express.js
- IBM watsonx.ai Node SDK
- @ibm-cloud/cloudant (IBM Cloudant SDK)
- Nodemon

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- IBM Cloudant account & credentials
- IBM watsonx.ai project & API key

### Installation

1. **Clone the repository and install dependencies:**

   ```bash
   # Install Backend Dependencies
   cd backend
   npm install

   # Install Frontend Dependencies
   cd ../frontend
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # IBM Cloudant
   CLOUDANT_URL=your_cloudant_url
   CLOUDANT_APIKEY=your_cloudant_apikey

   # IBM watsonx.ai
   WATSONX_API_KEY=your_watsonx_api_key
   WATSONX_PROJECT_ID=your_watsonx_project_id
   ```

3. **Run the Application:**
   Open two terminal tabs.

   ```bash
   # Terminal 1: Start Backend (Runs on http://localhost:3001)
   cd backend
   npm run dev

   # Terminal 2: Start Frontend (Runs on http://localhost:5173)
   cd frontend
   npm run dev
   ```

## 🗄️ Database Structure (IBM Cloudant)
The backend automatically initializes the following required databases upon startup:
- `mindguard_sessions`: Tracks anonymous user sessions.
- `mindguard_conversations`: Stores chat histories for context.
- `mindguard_moods`: Stores daily mood logs and AI insights.
- `mindguard_exercises`: Tracks completed self-care sessions and durations.
- `mindguard_journals`: Stores user journal entries.
- `mindguard_resources`: Cached helpline and medical resource data.
- `mindguard_safety_events`: Logs detected crisis events for safety auditing.

## 🎨 Design Philosophy
MindGuard AI avoids the generic "chatbot" look. It uses a custom design system inspired by premium lifestyle apps (like Headspace and Calm), prioritizing:
- Large breathing spaces
- Beautiful typography
- Soft, blurred glassmorphic cards
- Accessible, high-contrast text
- Warm, human-centered language 

---
*Built to provide accessible, intelligent, and private emotional support for everyone.*
