# StemPulse - Gamified AI Learning Platform ⚡

StemPulse is an AI-powered educational platform that gamifies the learning experience for STEM students. It uses Large Language Models (LLMs) to generate adaptive quizzes (including JEE/GATE level content) and creates personalized career roadmaps based on user performance.

![StemPulse Screenshot](<img width="1917" height="968" alt="image" src="https://github.com/user-attachments/assets/2631fde5-9691-4cb8-ad3c-31fb0730de70" />
)

## 🚀 Features

- **AI-Generated Quizzes:** dynamically generates questions using Llama-3 via Groq. Adapts difficulty based on grade (e.g., JEE Mains/Advanced questions for 11th/12th grade).
- **Career Guidance Engine:** Analyzes user interests and quiz scores to suggest career paths, majors, and actionable roadmaps.
- **Gamification System:** XP tracking, leveling system, daily streaks, and global leaderboards.
- **Social Learning:** Add friends and compete on leaderboards.
- **Secure Authentication:** Powered by Clerk.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion
- **Backend:** FastAPI (Python), Uvicorn
- **Database:** MongoDB Atlas
- **AI/LLM:** Groq API (Llama-3.3-70b-versatile)
- **Auth:** Clerk

## ⚙️ Installation & Run Locally

### Prerequisites
- Node.js & npm
- Python 3.10+
- MongoDB Cluster

### 1. Backend Setup (AI Engine)
```bash
cd ai-engine
# Create virtual environment
python -m venv venv
# Activate venv (Windows)
venv\Scripts\activate
# Activate venv (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

### 2. Frontend Setup 
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 🔐 Environment Variables

Create a .env file in the ai-engine folder:
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key

Create a .env.local file in the frontend folder:
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

## Deployment
Frontend: Deployed on Vercel.

Backend: Deployed on Render.

## 🤝 Contributing
Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)
Commit your Changes (git commit -m 'Add some AmazingFeature')
Push to the Branch (git push origin feature/AmazingFeature)
Open a Pull Request
