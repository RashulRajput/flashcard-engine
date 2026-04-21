# Synapse AI Flashcard Engine

**Live Deployment Here:** [https://flashy-gold.vercel.app/](https://flashy-gold.vercel.app/)

Synapse AI Flashcard Engine is a web application designed to automatically generate high-quality study flashcards from PDF documents. By leveraging Google's Gemini AI, it extracts core concepts and formulates them into smart question-and-answer pairs, ready to be studied using an integrated spaced-repetition system.

## 🚀 Key Features

- **Automated PDF Ingestion**: Simply upload a PDF text or lecture notes; the app accurately parses text using PDF.js.
- **AI-Powered Generation**: Uses Google Gemini to comprehend the context and automatically generate meaningful flashcards.
- **Spaced Repetition System**: Maximize your learning retention with built-in spaced repetition algorithms.
- **Modern UI**: A rich, responsive aesthetic with sleek glassmorphism themes and smooth micro-animations.

## 🛠️ Technology Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **UI/Components**: React
- **AI Integration**: `@google/generative-ai`
- **PDF Parsing**: `pdfjs-dist`
- **Deployment**: Vercel

## 💻 Running Locally

To run this project locally on your machine, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/RashulRajput/flashcard-engine.git
cd flashcard-engine
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 License
This project is open-source and available under the MIT License.
