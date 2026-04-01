const { Router } = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = Router();

const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

async function generateWithFallback(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('API key sozlanmagan');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastErr;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded') || msg.includes('quota')) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function checkKey(res) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'Gemini API key sozlanmagan' });
    return false;
  }
  return true;
}

router.post('/summary', async (req, res) => {
  if (!checkKey(res)) return;
  const { title, author, category, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Kitob nomi kerak' });
  try {
    const prompt = `Sen O'zbek tilida javob beradigan kutubxona yordamchisisan.
Quyidagi kitob haqida qisqacha ma'lumot ber:

Kitob nomi: ${title}
Muallif: ${author || "Noma'lum"}
Janr: ${category || "Noma'lum"}
Tavsif: ${description || 'Mavjud emas'}

Quyidagi formatda javob ber (O'zbek tilida):
**Qisqacha xulosa:** (2-3 jumla)
**Asosiy mavzular:** (3 ta bullet point)
**Kim uchun mos:** (1 jumla)
**Baho:** (5 dan nechi yulduz va sababi)`;

    const result = await generateWithFallback(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
    console.error('Gemini summary error:', err.message);
    res.status(500).json({ error: 'AI xizmatida xatolik: ' + err.message });
  }
});

router.post('/chat', async (req, res) => {
  if (!checkKey(res)) return;
  const { message, bookTitle, bookAuthor, bookDescription, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Xabar kerak' });
  try {
    const bookContext = bookTitle
      ? `Kitob: "${bookTitle}" — ${bookAuthor || ''}. ${bookDescription || ''}`
      : 'Umumiy adabiyot haqida suhbat.';

    const historyText = (history || [])
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'Foydalanuvchi' : 'AI'}: ${h.text}`)
      .join('\n');

    const prompt = `Sen kutubxona AI yordamchisisisan. O'zbek tilida javob berasan.
${bookContext}

${historyText ? 'Oldingi suhbat:\n' + historyText + '\n' : ''}
Foydalanuvchi: ${message}
AI:`;

    const result = await generateWithFallback(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    res.status(500).json({ error: 'AI xizmatida xatolik: ' + err.message });
  }
});

router.post('/recommend', async (req, res) => {
  if (!checkKey(res)) return;
  const { mood, level, goal, books } = req.body;
  try {
    const bookList = (books || []).slice(0, 30)
      .map(b => `- "${b.title}" (${b.author}, ${b.category})`)
      .join('\n');

    const prompt = `Sen kitob tavsiya qiluvchi AI assistantsan. O'zbek tilida javob ber.

Foydalanuvchi haqida:
- Kayfiyat: ${mood || "noma'lum"}
- Daraja: ${level || "o'rta"}
- Maqsad: ${goal || "o'qish"}

Mavjud kitoblar:
${bookList}

Yuqoridagi kitoblar ichidan ENG MOS 3 tasini tanlа va quyidagi JSON formatida qaytаr:
{"recommendations":[{"title":"kitob nomi","reason":"nеga mos (1 jumla)"},{"title":"kitob nomi","reason":"nеga mos (1 jumla)"},{"title":"kitob nomi","reason":"nеga mos (1 jumla)"}],"message":"foydalanuvchiga umumiy tavsiya xabari (1-2 jumla)"}
Faqat JSON qaytаr, boshqa hech narsa yozma.`;

    const result = await generateWithFallback(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI JSON qaytarmadi');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Gemini recommend error:', err.message);
    res.status(500).json({ error: 'AI xizmatida xatolik: ' + err.message });
  }
});

router.post('/search', async (req, res) => {
  if (!checkKey(res)) return;
  const { query, books } = req.body;
  if (!query) return res.status(400).json({ error: "Qidiruv so'zi kerak" });
  try {
    const bookList = (books || []).slice(0, 40)
      .map((b, i) => `${i + 1}. "${b.title}" — ${b.author} (${b.category})`)
      .join('\n');

    const prompt = `Sen kutubxona qidiruv assistantisan. O'zbek tilida javob ber.

Foydalanuvchi qidiruvi: "${query}"

Kitoblar ro'yxati:
${bookList}

Qidiruv so'ziga ENG MOS 5 ta kitob nomini quyidagi JSON formatida qaytаr:
{"results":["kitob nomi 1","kitob nomi 2","kitob nomi 3","kitob nomi 4","kitob nomi 5"]}
Faqat JSON qaytаr.`;

    const result = await generateWithFallback(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI JSON qaytarmadi');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Gemini search error:', err.message);
    res.status(500).json({ error: 'AI xizmatida xatolik: ' + err.message });
  }
});

module.exports = router;
