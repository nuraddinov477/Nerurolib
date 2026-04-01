require('dotenv').config();
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'pdf');

async function migrate() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const db = await open({ filename: './books.db', driver: sqlite3.Database });

  const books = await db.all('SELECT id, title, pdf_data FROM books WHERE pdf_data IS NOT NULL');
  console.log(`📚 ${books.length} ta kitobda PDF topildi`);

  let moved = 0;
  for (const book of books) {
    const filename = `book_${book.id}.pdf`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(book.pdf_data));
    await db.run('UPDATE books SET pdf_url = ?, pdf_data = NULL WHERE id = ?', [`/uploads/pdf/${filename}`, book.id]);
    console.log(`✅ "${book.title}" → ${filename}`);
    moved++;
  }

  // Bazani tozalash (bo'sh joy bo'shatish)
  await db.run('VACUUM');
  await db.close();

  console.log(`\n🎉 ${moved} ta PDF ko'chirildi`);
  console.log('📦 Baza VACUUM qilindi (hajmi kamaydi)');
}

migrate().catch(console.error);
