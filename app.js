const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// 初始化資料庫
const db = new sqlite3.Database('./product_prices.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS product_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- 格式: YYYY-MM
    piglet_10kg REAL,
    milk_purchase_ret REAL,
    raw_sheep_milk REAL,
    live_chicken REAL,
    white_egg REAL
  )`);
});

const PORT = 5000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 首頁查詢邏輯
app.get('/', (req, res) => {
  const { rocYear, month, TorocYear, Tomonth } = req.query;

  // 直接用西元年
  const startYear = rocYear && !isNaN(rocYear) ? Number(rocYear) : new Date().getFullYear();
  const endYear = TorocYear && !isNaN(TorocYear) ? Number(TorocYear) : new Date().getFullYear();
  const startMonth = month && !isNaN(month) ? month.toString().padStart(2, '0') : '01';
  const endMonth = Tomonth && !isNaN(Tomonth) ? Tomonth.toString().padStart(2, '0') : '12';

  const startDate = `${startYear}-${startMonth}`;
  const endDate = `${endYear}-${endMonth}`;

  db.all(
    `SELECT * FROM product_prices WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        console.error('查詢錯誤:', err);
        return res.status(500).render('error', { message: '資料庫查詢失敗，請稍後再試。' });
      }
      res.render('index', { prices: rows, keyword: '', startYear: rocYear, startMonth, endYear: TorocYear, endMonth });
    }
  );
});

// 新增價格資料
app.post('/add-price', (req, res) => {
  const {
    rocYear,
    month,
    piglet_10kg,
    milk_purchase_ret,
    raw_sheep_milk,
    live_chicken,
    white_egg,
  } = req.body;


  // 輸入驗證
  if (!rocYear || !month || isNaN(rocYear) || isNaN(month)) {
    return res.status(400).render('error', { message: '請提供有效的年份和月份。' });
  }

  // 直接用西元年
  const year = Number(rocYear);
  const formattedMonth = month.toString().padStart(2, '0');
  const date = `${year}-${formattedMonth}`;

  const prices = [
    piglet_10kg,
    milk_purchase_ret,
    raw_sheep_milk,
    live_chicken,
    white_egg,
  ].map((price) => (price && !isNaN(price) && price >= 0 ? Number(price) : null));

  const sql = `
    INSERT INTO product_prices (
      date, piglet_10kg, milk_purchase_ret, raw_sheep_milk, live_chicken, white_egg
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [date, ...prices], (err) => {
    if (err) {
      console.error('新增錯誤:', err);
      return res.status(500).render('error', { message: '無法新增資料，請檢查輸入。' });
    }
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});