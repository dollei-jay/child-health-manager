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
        priority TEXT DEFAULT 'medium',
        dueDate TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      // Backward-compatible migration for existing databases
      db.run(`ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium'`, () => {});
      db.run(`ALTER TABLE todos ADD COLUMN dueDate TEXT`, () => {});

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

    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const toFixedMaybe = (value: any, digits = 1) => {
    const num = Number(value);
    if (Number.isNaN(num)) return null;
    return Number(num.toFixed(digits));
  };

  const parseMaybeJson = (value: any, fallback: any) => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const countWeeklyPlanTasks = (planData: any[]) => {
    if (!Array.isArray(planData)) return 0;
    return planData.reduce((acc, day: any) => {
      const food = day?.food && typeof day.food === 'object' ? day.food : {};
      const foodCount = Object.values(food).filter((item: any) => typeof item === 'string' && item.trim()).length;
      const exerciseCount = Array.isArray(day?.exercise) ? day.exercise.filter((item: any) => typeof item === 'string' && item.trim()).length : 0;
      return acc + foodCount + exerciseCount;
    }, 0);
  };

  const countGroceryItems = (groceryData: Record<string, string[]>) => {
    if (!groceryData || typeof groceryData !== 'object') return 0;
    return Object.values(groceryData).reduce((acc, val: any) => {
      if (!Array.isArray(val)) return acc;
      return acc + val.filter(item => typeof item === 'string' && item.trim()).length;
    }, 0);
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
    const { text, priority = 'medium', dueDate = null } = req.body;
    const createdAt = new Date().toISOString();

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const allowedPriorities = ['low', 'medium', 'high'];
    const normalizedPriority = allowedPriorities.includes(priority) ? priority : 'medium';

    db.run(
      `INSERT INTO todos (userId, text, completed, priority, dueDate, createdAt) VALUES (?, ?, 0, ?, ?, ?)`,
      [req.user.id, String(text).trim(), normalizedPriority, dueDate, createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, text: String(text).trim(), completed: false, priority: normalizedPriority, dueDate, createdAt });
      }
    );
  });

  // Update Todo
  app.put('/api/todos/:id', authenticateToken, (req: any, res) => {
    const { completed, text, priority, dueDate } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (typeof completed === 'boolean') {
      fields.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (typeof text === 'string') {
      fields.push('text = ?');
      values.push(text.trim());
    }

    if (typeof priority === 'string') {
      const allowedPriorities = ['low', 'medium', 'high'];
      const normalizedPriority = allowedPriorities.includes(priority) ? priority : 'medium';
      fields.push('priority = ?');
      values.push(normalizedPriority);
    }

    if (typeof dueDate === 'string' || dueDate === null) {
      fields.push('dueDate = ?');
      values.push(dueDate);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, req.user.id);

    db.run(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      values,
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

  // Weekly Report
  app.get('/api/reports/weekly', authenticateToken, (req: any, res) => {
    const daysRaw = Number(req.query.days || 7);
    const days = Number.isNaN(daysRaw) ? 7 : Math.min(30, Math.max(7, daysRaw));

    const today = startOfDay(new Date());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    const startISO = startDate.toISOString().slice(0, 10);
    const endISO = today.toISOString().slice(0, 10);

    const todosSql = `SELECT id, text, completed, priority, dueDate, createdAt FROM todos WHERE userId = ? ORDER BY createdAt DESC`;
    const growthSql = `SELECT id, date, height, weight, bmi, createdAt FROM growth_records WHERE userId = ? ORDER BY date DESC`;
    const weeklyPlanSql = `SELECT planData FROM weekly_plan WHERE userId = ?`;
    const grocerySql = `SELECT listData FROM grocery_list WHERE userId = ?`;
    const checklistSql = `SELECT checkedItems FROM checklist WHERE userId = ?`;

    db.all(todosSql, [req.user.id], (todoErr: any, todosRows: any[]) => {
      if (todoErr) return res.status(500).json({ error: todoErr.message });

      db.all(growthSql, [req.user.id], (growthErr: any, growthRows: any[]) => {
        if (growthErr) return res.status(500).json({ error: growthErr.message });

        db.get(weeklyPlanSql, [req.user.id], (planErr: any, planRow: any) => {
          if (planErr) return res.status(500).json({ error: planErr.message });

          db.get(grocerySql, [req.user.id], (groceryErr: any, groceryRow: any) => {
            if (groceryErr) return res.status(500).json({ error: groceryErr.message });

            db.get(checklistSql, [req.user.id], (checkErr: any, checklistRow: any) => {
              if (checkErr) return res.status(500).json({ error: checkErr.message });

              const todos = Array.isArray(todosRows)
                ? todosRows.map((row: any) => ({
                    ...row,
                    completed: row.completed === 1
                  }))
                : [];

              const activeTodos = todos.filter((t: any) => !t.completed).length;
              const completedTodos = todos.filter((t: any) => t.completed).length;
              const overdueTodos = todos.filter((t: any) => {
                if (t.completed || !t.dueDate) return false;
                const due = new Date(t.dueDate);
                if (Number.isNaN(due.getTime())) return false;
                return startOfDay(due) < today;
              }).length;

              const weeklyPlanData = parseMaybeJson(planRow?.planData, []);
              const groceryData = parseMaybeJson(groceryRow?.listData, {});
              const checklistData = parseMaybeJson(checklistRow?.checkedItems, {});

              const weeklyPlanTasks = countWeeklyPlanTasks(weeklyPlanData);
              const groceryItems = countGroceryItems(groceryData);

              const checkinCount = Object.entries(checklistData).filter(([key, checked]) => {
                if (!checked || typeof key !== 'string') return false;
                const datePart = key.substring(0, 10);
                return datePart >= startISO && datePart <= endISO;
              }).length;

              const checkinsByDay: Record<string, number> = {};
              Object.entries(checklistData).forEach(([key, checked]) => {
                if (!checked || typeof key !== 'string') return;
                const datePart = key.substring(0, 10);
                if (datePart < startISO || datePart > endISO) return;
                checkinsByDay[datePart] = (checkinsByDay[datePart] || 0) + 1;
              });
              const perfectDays = Object.values(checkinsByDay).filter((count) => count >= 5).length;

              const growthSortedAsc = Array.isArray(growthRows)
                ? [...growthRows].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                : [];

              const growthInRange = growthSortedAsc.filter((item: any) => item.date >= startISO && item.date <= endISO);
              const latestGrowth = growthSortedAsc.length ? growthSortedAsc[growthSortedAsc.length - 1] : null;

              let trend7d = {
                weightDeltaKg: null as number | null,
                heightDeltaCm: null as number | null,
                bmiDelta: null as number | null
              };

              if (growthInRange.length >= 2) {
                const first = growthInRange[0];
                const last = growthInRange[growthInRange.length - 1];
                trend7d = {
                  weightDeltaKg: toFixedMaybe(Number(last.weight) - Number(first.weight), 1),
                  heightDeltaCm: toFixedMaybe(Number(last.height) - Number(first.height), 1),
                  bmiDelta: toFixedMaybe(Number(last.bmi) - Number(first.bmi), 1)
                };
              }

              const recommendations: string[] = [];

              if (overdueTodos > 0) {
                recommendations.push(`当前有 ${overdueTodos} 项逾期待办，建议先清理高优先项并补上截止日期。`);
              }

              if (checkinCount < Math.floor(days * 3.5)) {
                recommendations.push('本周期打卡偏少，建议把每日打卡拆成“早餐/运动/早睡”三项优先完成。');
              }

              if (growthInRange.length < 2) {
                recommendations.push('生长趋势样本不足，建议每周至少记录 1 次身高/体重。');
              } else if ((trend7d.weightDeltaKg ?? 0) > 0.8) {
                recommendations.push('体重增速偏快，建议优先提升户外活动时长并减少高糖零食频次。');
              } else {
                recommendations.push('当前生长数据节奏总体可控，继续保持“稳定记录 + 周计划执行”。');
              }

              if (weeklyPlanTasks === 0) {
                recommendations.push('周计划尚未配置，建议先套用标准模板再按家庭节奏微调。');
              }

              if (recommendations.length < 3) {
                recommendations.push('保持“先计划、再执行、后复盘”的闭环，每周固定一次报告复盘。');
              }

              return res.json({
                period: {
                  start: startISO,
                  end: endISO,
                  days
                },
                overview: {
                  activeTodos,
                  completedTodos,
                  overdueTodos,
                  weeklyPlanTasks,
                  groceryItems,
                  checkins: checkinCount,
                  perfectDays
                },
                growth: {
                  latest: latestGrowth
                    ? {
                        date: latestGrowth.date,
                        height: Number(latestGrowth.height),
                        weight: Number(latestGrowth.weight),
                        bmi: Number(latestGrowth.bmi)
                      }
                    : null,
                  trend7d
                },
                recommendations: recommendations.slice(0, 5),
                generatedAt: new Date().toISOString()
              });
            });
          });
        });
      });
    });
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
