const { Router } = require('express');
const { getDb } = require('../db/database');
const { requiresAdmin } = require('../middleware/auth');
const { execFile } = require('child_process');

// Faqat https://gutenberg.org va https://gutendex.com URLlarini qabul qilamiz
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      /^(www\.gutenberg\.org|gutendex\.com|gutenberg\.org|www\.gutendex\.com)$/.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// curl orqali URL'ni yuklab olish (Node.js fetch WSL2 da ETIMEDOUT beradi)
function fetchUrl(url) {
  if (!isAllowedUrl(url)) {
    return Promise.reject(new Error('Ruxsat etilmagan URL'));
  }
  return new Promise((resolve, reject) => {
    execFile('curl', [
      '-sL', '--max-time', '25',
      '-A', 'Mozilla/5.0 (compatible; MirKnigBot/1.0)',
      '-H', 'Accept: text/html,*/*',
      '-w', '\n__FINAL_URL__:%{url_effective}',
      url,
    ], { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(err.message || 'curl xatosi'));
      const sep = stdout.lastIndexOf('\n__FINAL_URL__:');
      const text = sep !== -1 ? stdout.slice(0, sep) : stdout;
      const finalUrl = sep !== -1 ? stdout.slice(sep + '\n__FINAL_URL__:'.length).trim() : url;
      resolve({ text, finalUrl });
    });
  });
}

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const books = await db.all('SELECT * FROM books');
    res.json(books.map(book => ({
      ...book,
      has_pdf: !!book.pdf_data,
      external_url: book.pdf_url || null,
      pdf_data: undefined,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const book = await db.get('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    book.has_pdf = !!book.pdf_data;
    book.external_url = book.pdf_url || null;
    delete book.pdf_data;
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { title, author, category, price, cover, description, stock, pdf_data, pdf_url } = req.body;
    if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });

    let pdfBuffer = null;
    if (pdf_data) {
      const base64Data = pdf_data.includes(',') ? pdf_data.split(',')[1] : pdf_data;
      pdfBuffer = Buffer.from(base64Data, 'base64');
    }

    const result = await db.run(
      'INSERT INTO books (title, author, category, price, cover, description, stock, pdf_data, pdf_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [title, author, category || 'Other', price || 0, cover || '📕', description || '', stock || 0, pdfBuffer, pdf_url || null]
    );
    const newBook = await db.get('SELECT * FROM books WHERE id = $1', [result.lastID]);
    newBook.has_pdf = !!newBook.pdf_data || !!newBook.pdf_url;
    delete newBook.pdf_data;
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { title, author, category, price, cover, description, stock, pdf_data, pdf_url } = req.body;
    const book = await db.get('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    let pdfBuffer = book.pdf_data;
    if (pdf_data) {
      const base64Data = pdf_data.includes(',') ? pdf_data.split(',')[1] : pdf_data;
      pdfBuffer = Buffer.from(base64Data, 'base64');
    }

    await db.run(
      'UPDATE books SET title=$1, author=$2, category=$3, price=$4, cover=$5, description=$6, stock=$7, pdf_data=$8, pdf_url=$9, updated_at=NOW() WHERE id=$10',
      [
        title || book.title, author || book.author, category || book.category,
        price !== undefined ? price : book.price, cover || book.cover,
        description !== undefined ? description : book.description,
        stock !== undefined ? stock : book.stock, pdfBuffer,
        pdf_url !== undefined ? pdf_url : book.pdf_url, req.params.id
      ]
    );
    const updated = await db.get('SELECT * FROM books WHERE id = $1', [req.params.id]);
    updated.has_pdf = !!updated.pdf_data || !!updated.pdf_url;
    delete updated.pdf_data;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gutenberg import
router.post('/import/search', requiresAdmin, async (req, res) => {
  try {
    const { query, limit = 10, language = '', region = '' } = req.body;
    if (!query) return res.status(400).json({ error: 'query talab qilinadi' });

    const fullQuery = region ? `${query} ${region}` : query;
    let url = `https://gutendex.com/books/?search=${encodeURIComponent(fullQuery)}`;
    if (language) url += `&languages=${encodeURIComponent(language)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Gutenberg API javob bermadi');
    const data = await response.json();

    const covers = ['📕', '📗', '📘', '📙', '📔', '📓', '📒', '📚'];
    const books = data.results.slice(0, parseInt(limit)).map((book, i) => {
      const fmts = book.formats;
      // O'qish uchun eng yaxshi format: HTML > EPUB > TXT
      const read_url = fmts['text/html'] ||
        fmts['application/epub+zip'] ||
        fmts['text/plain; charset=utf-8'] ||
        fmts['text/plain; charset=us-ascii'] ||
        null;
      return {
        title: book.title,
        author: book.authors.length > 0 ? book.authors.map(a => a.name).join(', ') : "Noma'lum muallif",
        category: book.subjects.length > 0 ? book.subjects[0].split(' -- ')[0].slice(0, 40) : 'Klassik',
        description: book.subjects.slice(0, 3).join(', ') || 'Jahon klassik adabiyoti',
        pdf_url: read_url,
        cover: covers[i % covers.length],
        cover_img: fmts['image/jpeg'] || null,
        gutenberg_id: book.id,
        languages: book.languages,
      };
    }).filter(b => b.pdf_url);

    res.json({ books, total: data.count, query });
  } catch (err) {
    res.status(500).json({ error: 'Qidiruvda xato: ' + err.message });
  }
});

router.post('/import/do', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { books } = req.body;
    if (!books || !Array.isArray(books)) return res.status(400).json({ error: 'books array talab qilinadi' });

    const imported = [];
    for (const book of books) {
      const result = await db.run(
        'INSERT INTO books (title, author, category, price, cover, description, stock, pdf_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [book.title, book.author, book.category || 'Klassik', 0, book.cover || '📕', book.description || '', 999, book.pdf_url]
      );
      imported.push({ ...book, id: result.lastID });
    }
    res.json({ count: imported.length, books: imported });
  } catch (err) {
    res.status(500).json({ error: 'Import xatosi: ' + err.message });
  }
});

// PDF download
router.get('/:id/pdf', async (req, res) => {
  try {
    const db = getDb();
    const book = await db.get('SELECT title, pdf_data, pdf_url FROM books WHERE id = $1', [req.params.id]);
    if (!book || (!book.pdf_data && !book.pdf_url)) {
      return res.status(404).json({ error: 'PDF not available for this book' });
    }
    if (book.pdf_url && !book.pdf_data) {
      return res.status(404).json({ error: 'PDF not available' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.title}.pdf"`);
    res.send(book.pdf_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: Gutenberg HTML matnini serverdan olib berish
router.get('/:id/content', async (req, res) => {
  try {
    const db = getDb();
    const book = await db.get('SELECT title, pdf_url FROM books WHERE id = $1', [req.params.id]);
    if (!book || !book.pdf_url) {
      return res.status(404).json({ error: 'Kontent mavjud emas' });
    }

    const { text: html2, finalUrl } = await fetchUrl(book.pdf_url);
    let html = html2;
    const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);

    // Faqat asosiy matn qismini olamiz
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let body = bodyMatch ? bodyMatch[1] : html;

    // Gutenberg navigatsiya va keraksiz elementlarni olib tashlaymiz
    body = body
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/href="https?:\/\/[^"]+"/gi, 'href="#"')
      .replace(/href="(?!#)[^"]+"/gi, 'href="#"')
      // Nisbiy rasm URL larini absolyut qilamiz
      .replace(/src="(?!https?:\/\/)(?!data:)([^"]+)"/gi, `src="${baseUrl}$1"`);

    // Gutenberg boilerplate (lisenziya matni)ni olib tashlaymiz
    const startMarker = body.indexOf('*** START OF THE PROJECT GUTENBERG EBOOK');
    if (startMarker !== -1) {
      const afterMarker = body.indexOf('***', startMarker + 3);
      if (afterMarker !== -1) {
        body = body.slice(afterMarker + 3).trim();
      }
    }

    // Boshidagi orphan yopuvchi teglarni tozalaymiz
    body = body.replace(/^(\s*<\/[a-zA-Z]+>\s*)+/, '').trim();

    // Gutenberg oxiridagi boilerplate ham o'chiriladi
    const endMarker = body.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');
    if (endMarker !== -1) {
      body = body.slice(0, endMarker).trim();
    }

    // Gutenberg "pg-boilerplate" class li sectionlarni olib tashlaymiz
    body = body.replace(/<section[^>]*pg-boilerplate[^>]*>[\s\S]*?<\/section>/gi, '');

    res.json({ content: body, title: book.title });
  } catch (err) {
    console.error('[content]', err);
    res.status(500).json({ error: 'Kontent yuklanmadi: ' + (err.message || err.code || String(err)) });
  }
});

module.exports = router;
