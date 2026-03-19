import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

fs.writeFileSync('trace.log', 'File loaded.\n');

let sqlite3, bcrypt, jwt, cors;
try {
  const require = createRequire(import.meta.url);
  sqlite3 = require('sqlite3').verbose();
  bcrypt = require('bcryptjs');
  jwt = require('jsonwebtoken');
  cors = require('cors');
} catch (err) {
  fs.writeFileSync('error.log', err.stack || err.message || String(err));
  console.error('Failed to load modules:', err);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-local-nas';

async function startServer() {
  fs.writeFileSync('trace.log', 'Starting server...\n');
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  fs.appendFileSync('trace.log', 'Middleware added.\n');

  // Initialize SQLite Database
  const dbPath = process.env.NODE_ENV === 'production' ? './data/database.sqlite' : './database.sqlite';
  
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to the SQLite database at', dbPath);
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        childName TEXT,
        childBirthDate TEXT,
        childGender TEXT,
        childGoal TEXT,
        createdAt TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        text TEXT,
        completed INTEGER DEFAULT 0,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS weekly_plan (
        userId INTEGER UNIQUE,
        planData TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS checklist (
        userId INTEGER UNIQUE,
        checkedItems TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS grocery_list (
        userId INTEGER UNIQUE,
        listData TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS growth_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        date TEXT,
        height REAL,
        weight REAL,
        bmi TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);
    }
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Register
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, childName, childBirthDate, childGender, childGoal } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdAt = new Date().toISOString();

      db.run(
        `INSERT INTO users (email, password, childName, childBirthDate, childGender, childGoal, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, childName, childBirthDate, childGender, childGoal, createdAt],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          const user = { id: this.lastID, email };
          const token = jwt.sign(user, JWT_SECRET);
          res.json({ token, user });
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

      const tokenPayload = { id: user.id, email: user.email };
      const token = jwt.sign(tokenPayload, JWT_SECRET);
      res.json({ token, user: tokenPayload });
    });
  });

  // Get Profile
  app.get('/api/profile', authenticateToken, (req: any, res) => {
    db.get(`SELECT id, email, childName, childBirthDate, childGender, childGoal, createdAt FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    });
  });

  // Update Profile
  app.put('/api/profile', authenticateToken, (req: any, res) => {
    const { childName, childBirthDate, childGender, childGoal } = req.body;
    db.run(
      `UPDATE users SET childName = ?, childBirthDate = ?, childGender = ?, childGoal = ? WHERE id = ?`,
      [childName, childBirthDate, childGender, childGoal, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // Get Todos
  app.get('/api/todos', authenticateToken, (req: any, res) => {
    db.all(`SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC`, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Convert completed from INTEGER to BOOLEAN for frontend
      const todos = rows.map((row: any) => ({
        ...row,
        completed: row.completed === 1
      }));
      res.json(todos);
    });
  });

  // Create Todo
  app.post('/api/todos', authenticateToken, (req: any, res) => {
    const { text } = req.body;
    const createdAt = new Date().toISOString();
    
    db.run(
      `INSERT INTO todos (userId, text, completed, createdAt) VALUES (?, ?, 0, ?)`,
      [req.user.id, text, createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, text, completed: false, createdAt });
      }
    );
  });

  // Update Todo
  app.put('/api/todos/:id', authenticateToken, (req: any, res) => {
    const { completed } = req.body;
    const completedInt = completed ? 1 : 0;
    
    db.run(
      `UPDATE todos SET completed = ? WHERE id = ? AND userId = ?`,
      [completedInt, req.params.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // Delete Todo
  app.delete('/api/todos/:id', authenticateToken, (req: any, res) => {
    db.run(
      `DELETE FROM todos WHERE id = ? AND userId = ?`,
      [req.params.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // --- VITE MIDDLEWARE ---
  
  // Weekly Plan
  app.get('/api/weekly-plan', authenticateToken, (req: any, res) => {
    db.get(`SELECT planData FROM weekly_plan WHERE userId = ?`, [req.user.id], (err, row: any) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row ? { planData: row.planData } : { planData: null });
    });
  });

  app.post('/api/weekly-plan', authenticateToken, (req: any, res) => {
    const { planData } = req.body;
    const updatedAt = new Date().toISOString();
    db.run(
      `INSERT INTO weekly_plan (userId, planData, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET planData = excluded.planData, updatedAt = excluded.updatedAt`,
      [req.user.id, planData, updatedAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // Checklist
  app.get('/api/checklist', authenticateToken, (req: any, res) => {
    db.get(`SELECT checkedItems FROM checklist WHERE userId = ?`, [req.user.id], (err, row: any) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row ? { checkedItems: row.checkedItems } : { checkedItems: null });
    });
  });

  app.post('/api/checklist', authenticateToken, (req: any, res) => {
    const { checkedItems } = req.body;
    const updatedAt = new Date().toISOString();
    db.run(
      `INSERT INTO checklist (userId, checkedItems, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET checkedItems = excluded.checkedItems, updatedAt = excluded.updatedAt`,
      [req.user.id, checkedItems, updatedAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // Grocery List
  app.get('/api/grocery-list', authenticateToken, (req: any, res) => {
    db.get(`SELECT listData FROM grocery_list WHERE userId = ?`, [req.user.id], (err, row: any) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row ? { listData: row.listData } : { listData: null });
    });
  });

  app.post('/api/grocery-list', authenticateToken, (req: any, res) => {
    const { listData } = req.body;
    const updatedAt = new Date().toISOString();
    db.run(
      `INSERT INTO grocery_list (userId, listData, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET listData = excluded.listData, updatedAt = excluded.updatedAt`,
      [req.user.id, listData, updatedAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // Growth Records
  app.get('/api/growth-records', authenticateToken, (req: any, res) => {
    db.all(`SELECT * FROM growth_records WHERE userId = ? ORDER BY date DESC`, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/growth-records', authenticateToken, (req: any, res) => {
    const { date, height, weight, bmi } = req.body;
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO growth_records (userId, date, height, weight, bmi, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, date, height, weight, bmi, createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, date, height, weight, bmi, createdAt });
      }
    );
  });

  app.delete('/api/growth-records/:id', authenticateToken, (req: any, res) => {
    db.run(
      `DELETE FROM growth_records WHERE id = ? AND userId = ?`,
      [req.params.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  if (process.env.NODE_ENV !== "production") {
    console.log('Creating Vite server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log('Vite server created.');
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  fs.writeFileSync('error.log', err.stack || err.message || String(err));
  console.error('Failed to start server:', err);
  process.exit(1);
});
