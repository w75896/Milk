const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./product_prices.db');
const app = express();

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS product_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    piglet_10kg REAL,
    milk_purchase_ret REAL,
    raw_sheep_milk REAL,
    live_chicken REAL,
    white_egg REAL
  )`);

});


const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
  // 查詢資料庫中最新的 12 筆資料
  db.all(`SELECT * FROM product_prices ORDER BY 
    CAST(SUBSTR(date, 1, INSTR(date, '年') - 1) AS INTEGER) DESC,
    CAST(SUBSTR(date, INSTR(date, '年') + 1, 2) AS INTEGER) DESC
    LIMIT 12`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    
    const data = rows.map(row => ({
      date: row.date,
      piglet_10kg: row.piglet_10kg,
      milk_purchase_ret: row.milk_purchase_ret,
      raw_sheep_milk: row.raw_sheep_milk,
      live_chicken: row.live_chicken,
      white_egg: row.white_egg
    }));
    
    res.render('index', { prices: data, keyword: '' });
  });

});

app.post('/add-price', (req, res) => {
  const {
    date,
    piglet_10kg,
    milk_purchase_ret,
    raw_sheep_milk,
    live_chicken,
    white_egg
  } = req.body;

  // SQL 插入語句
  const sql = `
    INSERT INTO prices (
      date,
      piglet_10kg,
      milk_purchase_ret,
      raw_sheep_milk,
      live_chicken,
      white_egg
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  // 執行插入
  db.run(sql, [
    date,
    piglet_10kg || null,
    milk_purchase_ret || null,
    raw_sheep_milk || null,
    live_chicken || null,
    white_egg || null
  ], function(err) {
    if (err) {
      console.error('新增價格資料時發生錯誤：', err.message);
      return res.status(500).send('伺服器錯誤，無法新增資料。');
    }
    res.redirect('/'); // 成功後回到首頁
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
