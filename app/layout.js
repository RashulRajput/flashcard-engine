import './globals.css';

export const metadata = {
  title: 'Synapse — AI Flashcard Engine',
  description: 'Transform any PDF into intelligent, spaced-repetition flashcards powered by Gemini AI.',
  keywords: ['flashcards', 'AI', 'study', 'spaced repetition', 'PDF', 'learning'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-pattern" />
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
