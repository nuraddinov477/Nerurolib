import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import '../styles/AdminSimpleBooks.css';

function AdminSimpleBooks() {
  const { addBook } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const bookCovers = ['📕', '📗', '📘', '📙', '📔', '📓', '📒', '📚'];

  // Demo kitoblar - PDF siz, faqat matn
  const demoBooks = [
    {
      title: 'O\'tkan kunlar',
      author: 'Abdulla Qodiriy',
      category: 'O\'zbek klassikasi',
      description: 'O\'tkan kunlar - Abdulla Qodiriyning mashhur romani. 1919-1920 yillarda yozilgan. O\'zbek adabiyotining eng yirik asarlaridan biri.',
      content: `O'TKAN KUNLAR\n\nAbdulla Qodiriy\n\nBIRINCI BOB\n\nToshkent shahri Eski shahar qismida, Kukcha darvozasi yaqinida, tor ko'chalardan birida, kichkina, ammo toza va ozoda bir hovli bor edi. Bu hovlining eshigi doim yopiq turardi. Hovli ichida bir-ikki daraxt, bir necha gul ko'chatlari o'sib turardi.\n\nBu hovlida Otabek ismli bir yigit yashar edi. U o'ttiz yoshlarda, o'rta bo'yli, to'la gavdali, qora sochli, qora ko'zli, oq yuzli bir yigit edi. Otabek savdogar edi. U Rossiya, Qozoq, Qirg'iz yerlariga borib, mol-mulk sotib, sotib kelardi.\n\nOtabekning onasi Xolbeka xonim edi. Xolbeka xonim yetmish yoshlarda, oq sochli, oq yuzli, mehribon bir kampir edi. U o'g'li Otabekni juda yaxshi ko'rardi.\n\nOtabekning xotini Kumush edi. Kumush yigirma besh yoshlarda, o'rta bo'yli, nozik gavdali, qora sochli, qora ko'zli, oq yuzli, chiroyli bir ayol edi. Kumush Otabekni juda yaxshi ko'rardi.\n\nOtabek va Kumushning ikki farzandi bor edi. Katta o'g'li Anvar, kichik qizi Zebiniso edi. Anvar o'n yoshda, Zebiniso sakkiz yoshda edi.\n\nOtabek oilasi tinch-totuv, xotirjam hayot kechirar edi. Ular bir-birlarini yaxshi ko'rishardi. Ular doim birga bo'lishardi.\n\n(Demo matn - to'liq kitob uchun PDF fayl kerak)`
    },
    {
      title: 'Mehrobdan chayon',
      author: 'Abdulla Qodiriy',
      category: 'O\'zbek klassikasi',
      description: 'Mehrobdan chayon - Abdulla Qodiriyning ikkinchi romani. 1920-1922 yillarda yozilgan.',
      content: `MEHROBDAN CHAYON\n\nAbdulla Qodiriy\n\nBIRINCI BOB\n\nBuxoro shahri. Qadimiy shahar. Sharq gavhari. Islom dunyosining markazi.\n\nBuxoro shahrida, Ark yaqinida, katta bir hovli bor edi. Bu hovlida Mirzakarim ismli bir savdogar yashar edi.\n\nMirzakarim boy savdogar edi. Uning ko'p mol-mulki, ko'p puli bor edi. U Buxoroning eng boy savdogarlaridan biri edi.\n\nMirzakarimning xotini Oyxon edi. Oyxon chiroyli, aqlli, mehribon bir ayol edi. U Mirzakarimni juda yaxshi ko'rardi.\n\nMirzakarim va Oyxonning bir qizi bor edi. Qizining ismi Kumush edi. Kumush o'n sakkiz yoshda, juda chiroyli, juda aqlli bir qiz edi.\n\n(Demo matn - to'liq kitob uchun PDF fayl kerak)`
    },
    {
      title: 'Kecha va kunduz',
      author: 'Cho\'lpon',
      category: 'O\'zbek klassikasi',
      description: 'Kecha va kunduz - Cho\'lponning mashhur romani. O\'zbek adabiyotining eng yaxshi asarlaridan.',
      content: `KECHA VA KUNDUZ\n\nCho'lpon\n\nBIRINCI BOB\n\nToshkent shahri. Yangi shahar. Evropacha binolar. Keng ko'chalar.\n\nBu shaharning bir ko'chasida, chiroyli bir uyda, Komil ismli bir yigit yashar edi.\n\nKomil yigirma besh yoshda, baland bo'yli, to'la gavdali, qora sochli, qora ko'zli bir yigit edi. U o'qimishli, madaniyatli bir yigit edi.\n\nKomil o'qituvchi edi. U maktabda bolalarga dars berardi. U o'z ishini yaxshi ko'rardi.\n\n(Demo matn - to'liq kitob uchun PDF fayl kerak)`
    },
    {
      title: 'Qo\'shchinor chiroqlari',
      author: 'Abdulla Qahhor',
      category: 'O\'zbek klassikasi',
      description: 'Qo\'shchinor chiroqlari - Abdulla Qahhorning hikoyalar to\'plami.',
      content: `QO'SHCHINOR CHIROQLARI\n\nAbdulla Qahhor\n\nANOR\n\nQishloqda, kichkina bir uyda, Anor ismli bir qiz yashar edi.\n\nAnor o'n ikki yoshda, kichkina, nozik, qora sochli, qora ko'zli bir qiz edi. U juda aqlli, juda mehnatsevar bir qiz edi.\n\nAnorning otasi Rahmon aka edi. Rahmon aka dehqon edi. U ertalabdan kechgacha dalada ishlardi.\n\n(Demo matn - to'liq kitob uchun PDF fayl kerak)`
    },
    {
      title: 'Xamsa',
      author: 'Alisher Navoiy',
      category: 'She\'riyat',
      description: 'Xamsa - Alisher Navoiyning besh dostondan iborat asari. O\'zbek adabiyotining eng buyuk asari.',
      content: `XAMSA\n\nAlisher Navoiy\n\nHAYRATUL-ABROR\n\nBismillahir rohmanir rohiym\n\nEy, falak gardunini gardun qilg'uchi,\nOlam ahlin jahon ichra ilg'uchi.\n\nSen ki, haq yo'lida yo'l topquchilarg'a,\nYo'l ko'rsatguchi, yo'l ochquchilarg'a.\n\n(Demo matn - to'liq kitob uchun PDF fayl kerak)`
    }
  ];

  const generateDemoBooks = async () => {
    setLoading(true);

    const books = demoBooks.map((demo, index) => ({
      title: demo.title,
      author: demo.author,
      category: demo.category,
      price: 0,
      cover: bookCovers[index % bookCovers.length],
      description: demo.description,
      stock: 999
    }));

    for (const book of books) {
      await addBook(book);
    }

    setResult({ success: true, count: books.length, books });
    setLoading(false);
  };

  return (
    <div className="simple-books-container">
      <div className="simple-header">
        <h2>📚 O'zbek Kitoblar (Demo)</h2>
        <p>Tashqi havolarsiz, saytda ishlaydi</p>
      </div>

      <div className="simple-info">
        <div className="info-box">
          <h3>ℹ️ Bu Nima?</h3>
          <p>Bu demo kitoblar - hech qanday tashqi havola kerak emas!</p>
          <ul>
            <li>✅ Saytda ochiladi</li>
            <li>✅ Tez ishlaydi</li>
            <li>✅ Xatosiz</li>
            <li>✅ Bepul</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>📖 Mavjud Kitoblar:</h3>
          <ul>
            {demoBooks.map((book, i) => (
              <li key={i}>
                {bookCovers[i]} <strong>{book.title}</strong> - {book.author}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button 
        className="btn btn-generate"
        onClick={generateDemoBooks}
        disabled={loading}
      >
        {loading ? '⏳ Yuklanmoqda...' : '📚 Demo Kitoblarni Yuklash'}
      </button>

      {result && (
        <div className="simple-result">
          <div className="result-success">
            <h3>✅ Muvaffaqiyatli!</h3>
            <p>{result.count} ta demo kitob qo'shildi</p>
          </div>
          
          <div className="result-list">
            {result.books.map((book, index) => (
              <div key={index} className="result-item">
                <span className="item-cover">{book.cover}</span>
                <div className="item-info">
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>
                <span className="item-badge">DEMO</span>
              </div>
            ))}
          </div>

          <div className="next-info">
            <h4>✅ Keyingi Qadamlar:</h4>
            <ol>
              <li>📚 "Kitoblar" sahifasiga o'ting</li>
              <li>📖 Kitobni tanlang</li>
              <li>🔍 "O'qishni boshlash" tugmasini bosing</li>
              <li>📄 Kitob saytda ochiladi!</li>
            </ol>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setResult(null)}
          >
            ✔️ OK
          </button>
        </div>
      )}

      <div className="simple-note">
        <h4>⚠️ Eslatma:</h4>
        <p>Bu <strong>demo versiya</strong> - kitoblarning qisqa qismi. To'liq kitoblar uchun PDF fayllar kerak.</p>
        <p><strong>PDF qo'shish:</strong> PDF fayllarni Google Drive ga yuklang va havolalarni kiriting.</p>
      </div>
    </div>
  );
}

export default AdminSimpleBooks;
