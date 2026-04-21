import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

async function tryGenerate(genAI, text, targetCards, modelIndex = 0, retries = 2) {
  const modelName = MODELS[modelIndex] || MODELS[0];
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `You are an expert educator creating high-quality flashcards for spaced repetition study.

Analyze the following text and create exactly ${targetCards} flashcards. Each flashcard should:
- Test a single, specific concept or fact
- Have a clear, concise question
- Have a precise, informative answer (2-4 sentences max)
- Cover the most important concepts in the material
- Range from basic recall to deeper understanding
- Avoid trivial or overly obvious questions

Return ONLY a valid JSON array with no extra text. Each element should have "question" and "answer" fields.

Example format:
[
  {"question": "What is the photoelectric effect?", "answer": "The photoelectric effect is the emission of electrons from a material when light of sufficient frequency shines on it. Einstein explained it by proposing that light consists of discrete packets of energy called photons."},
  {"question": "What determines the kinetic energy of emitted photoelectrons?", "answer": "The kinetic energy of emitted photoelectrons depends on the frequency of the incident light, not its intensity. Higher frequency light produces electrons with greater kinetic energy."}
]

TEXT TO ANALYZE:
${text.substring(0, 30000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    const isRateLimit = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('503');

    // Try a different model
    if (isRateLimit && modelIndex + 1 < MODELS.length) {
      console.log(`Model ${modelName} failed, trying ${MODELS[modelIndex + 1]}...`);
      return tryGenerate(genAI, text, targetCards, modelIndex + 1, retries);
    }

    // Retry with delay
    if (isRateLimit && retries > 0) {
      console.log(`Rate limited, waiting 10s before retry... (${retries} left)`);
      await new Promise((r) => setTimeout(r, 10000));
      return tryGenerate(genAI, text, targetCards, 0, retries - 1);
    }

    throw err;
  }
}

export async function POST(request) {
  try {
    const { text, numCards } = await request.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Text content is too short to generate meaningful flashcards.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetCards = numCards || 15;

    let responseText = await tryGenerate(genAI, text, targetCards);

    // Clean the response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let cards;
    try {
      cards = JSON.parse(responseText);
    } catch {
      // Try to extract JSON array from the response
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) {
        cards = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('AI returned an invalid flashcard format');
    }

    // Validate and clean cards
    const validCards = cards
      .filter((c) => c.question && c.answer)
      .map((c, i) => ({
        id: `card_${Date.now()}_${i}`,
        question: c.question.trim(),
        answer: c.answer.trim(),
      }));

    return NextResponse.json({ cards: validCards });
  } catch (error) {
    console.error('Generation error:', error);

    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('503');
    if (isRateLimit) {
      return NextResponse.json(
        { error: 'Google AI is currently experiencing high demand or rate limits. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards.' },
      { status: 500 }
    );
  }
}
