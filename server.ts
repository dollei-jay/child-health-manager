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
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = NODE_ENV === 'production';

async function startServer() {
  fs.writeFileSync('trace.log', 'Starting server...\n');
  const app = express();

  if (IS_PRODUCTION) {
    if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim().length < 32) {
      throw new Error('Production requires JWT_SECRET with at least 32 characters.');
    }

    const weakSecrets = [
      'your-super-secret-jwt-key-for-local-nas',
      'changeme',
      '123456',
      'password'
    ];

    if (weakSecrets.includes(String(process.env.JWT_SECRET).trim().toLowerCase())) {
      throw new Error('Production JWT_SECRET is too weak. Please use a high-entropy secret.');
    }
  }

  app.use(cors());
  app.use(express.json());
  fs.appendFileSync('trace.log', 'Middleware added.\n');

  // Initialize SQLite Database
  const dbPath = IS_PRODUCTION ? './data/database.sqlite' : './database.sqlite';

  if (IS_PRODUCTION) {
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
        selectedChildId INTEGER,
        createdAt TEXT
      )`);

      db.run(`ALTER TABLE users ADD COLUMN selectedChildId INTEGER`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS child_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        childName TEXT,
        childBirthDate TEXT,
        childGender TEXT,
        childGoal TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      // migrate legacy single-child data into child_profiles
      db.run(
        `INSERT INTO child_profiles (userId, childName, childBirthDate, childGender, childGoal, createdAt, updatedAt)
         SELECT u.id, u.childName, u.childBirthDate, u.childGender, u.childGoal, COALESCE(u.createdAt, datetime('now')), datetime('now')
         FROM users u
         WHERE u.childName IS NOT NULL
           AND TRIM(u.childName) <> ''
           AND NOT EXISTS (SELECT 1 FROM child_profiles c WHERE c.userId = u.id)`
      );

      db.run(
        `UPDATE users
         SET selectedChildId = (
           SELECT c.id FROM child_profiles c WHERE c.userId = users.id ORDER BY c.id ASC LIMIT 1
         )
         WHERE selectedChildId IS NULL`
      );

      db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        childProfileId INTEGER,
        text TEXT,
        completed INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        dueDate TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`ALTER TABLE todos ADD COLUMN childProfileId INTEGER`, () => {});

      // Backward-compatible migration for existing databases
      db.run(`ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium'`, () => {});
      db.run(`ALTER TABLE todos ADD COLUMN dueDate TEXT`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS weekly_plan (
        userId INTEGER,
        childProfileId INTEGER,
        planData TEXT,
        updatedAt TEXT,
        UNIQUE(userId, childProfileId),
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`ALTER TABLE weekly_plan ADD COLUMN childProfileId INTEGER`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS checklist (
        userId INTEGER,
        childProfileId INTEGER,
        checkedItems TEXT,
        updatedAt TEXT,
        UNIQUE(userId, childProfileId),
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`ALTER TABLE checklist ADD COLUMN childProfileId INTEGER`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS grocery_list (
        userId INTEGER,
        childProfileId INTEGER,
        listData TEXT,
        updatedAt TEXT,
        UNIQUE(userId, childProfileId),
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`ALTER TABLE grocery_list ADD COLUMN childProfileId INTEGER`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS growth_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        childProfileId INTEGER,
        date TEXT,
        height REAL,
        weight REAL,
        bmi TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`ALTER TABLE growth_records ADD COLUMN childProfileId INTEGER`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS weekly_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        weekStart TEXT,
        summary TEXT,
        blockers TEXT,
        nextFocus TEXT,
        score INTEGER,
        updatedAt TEXT,
        UNIQUE(userId, weekStart),
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT,
        status TEXT,
        ip TEXT,
        detail TEXT,
        createdAt TEXT
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

  const toDateString = (date: Date) => date.toISOString().slice(0, 10);

  const getWeekStartMonday = (base: Date = new Date()) => {
    const d = startOfDay(base);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Sunday->-6, Monday->0
    d.setDate(d.getDate() + diff);
    return d;
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

  // Basic login rate limit (in-memory)
  const LOGIN_WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000); // 15 min
  const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);
  const loginAttempts = new Map<string, number[]>();

  const getClientIp = (req: any) => {
    const raw = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'unknown';
    return String(raw).split(',')[0].trim();
  };

  const makeLoginKey = (req: any, email: string) => `${getClientIp(req)}|${email}`;

  const checkLoginRateLimit = (key: string) => {
    const now = Date.now();
    const arr = (loginAttempts.get(key) || []).filter((ts) => now - ts <= LOGIN_WINDOW_MS);
    loginAttempts.set(key, arr);

    if (arr.length >= LOGIN_MAX_ATTEMPTS) {
      const retryAfterMs = LOGIN_WINDOW_MS - (now - arr[0]);
      return { blocked: true, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    return { blocked: false, retryAfterSec: 0 };
  };

  const recordLoginFailure = (key: string) => {
    const now = Date.now();
    const arr = (loginAttempts.get(key) || []).filter((ts) => now - ts <= LOGIN_WINDOW_MS);
    arr.push(now);
    loginAttempts.set(key, arr);
  };

  const clearLoginFailures = (key: string) => {
    loginAttempts.delete(key);
  };

  setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of loginAttempts.entries()) {
      const filtered = arr.filter((ts) => now - ts <= LOGIN_WINDOW_MS);
      if (filtered.length === 0) loginAttempts.delete(key);
      else loginAttempts.set(key, filtered);
    }
  }, 5 * 60 * 1000).unref();

  const isValidDateString = (value: any) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const logAudit = (dbConn: any, payload: { userId?: number | null; action: string; status: 'success' | 'fail'; ip?: string; detail?: string }) => {
    const { userId = null, action, status, ip = '', detail = '' } = payload;
    const createdAt = new Date().toISOString();

    dbConn.run(
      `INSERT INTO audit_logs (userId, action, status, ip, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, status, String(ip).slice(0, 120), String(detail).slice(0, 400), createdAt],
      () => {}
    );
  };

  const normalizeText = (value: any, max = 300) => {
    const text = String(value ?? '').trim();
    return text.slice(0, max);
  };

  const normalizeOptionalDate = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const dateStr = String(value);
    return isValidDateString(dateStr) ? dateStr : null;
  };

  const getSelectedChildId = (userId: number): Promise<number | null> => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT selectedChildId FROM users WHERE id = ?`, [userId], (err: any, userRow: any) => {
        if (err) return reject(err);

        const selected = Number(userRow?.selectedChildId);
        if (!Number.isNaN(selected) && selected > 0) return resolve(selected);

        db.get(`SELECT id FROM child_profiles WHERE userId = ? ORDER BY id ASC LIMIT 1`, [userId], (childErr: any, childRow: any) => {
          if (childErr) return reject(childErr);
          if (!childRow?.id) return resolve(null);

          db.run(`UPDATE users SET selectedChildId = ? WHERE id = ?`, [childRow.id, userId], () => {
            resolve(Number(childRow.id));
          });
        });
      });
    });
  };

  // --- API ROUTES ---

  // Register
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, childName, childBirthDate, childGender, childGoal } = req.body || {};

    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedGender = childGender === 'boy' ? 'boy' : 'girl';
    const normalizedBirthDate = isValidDateString(childBirthDate) ? childBirthDate : null;

    try {
      const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
      const createdAt = new Date().toISOString();

      db.run(
        `INSERT INTO users (email, password, childName, childBirthDate, childGender, childGoal, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedEmail,
          hashedPassword,
          normalizeText(childName, 50),
          normalizedBirthDate,
          normalizedGender,
          normalizeText(childGoal, 120),
          createdAt
        ],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }

          const userId = Number(this.lastID);
          const initialChildName = normalizeText(childName, 50);

          const finishLogin = () => {
            const user = { id: userId, email: normalizedEmail };
            const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, user });
          };

          if (!initialChildName) {
            return finishLogin();
          }

          db.run(
            `INSERT INTO child_profiles (userId, childName, childBirthDate, childGender, childGoal, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, initialChildName, normalizedBirthDate, normalizedGender, normalizeText(childGoal, 120), createdAt, createdAt],
            function (childErr) {
              if (!childErr && this?.lastID) {
                db.run(`UPDATE users SET selectedChildId = ? WHERE id = ?`, [this.lastID, userId], () => {
                  finishLogin();
                });
                return;
              }
              // fallback: even if child profile insert fails, allow login
              finishLogin();
            }
          );
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const loginKey = makeLoginKey(req, normalizedEmail);
    const limitCheck = checkLoginRateLimit(loginKey);
    if (limitCheck.blocked) {
      const ip = getClientIp(req);
      logAudit(db, { action: 'login', status: 'fail', ip, detail: `email=${normalizedEmail}; reason=rate_limited; retryAfter=${limitCheck.retryAfterSec}s` });
      res.setHeader('Retry-After', String(limitCheck.retryAfterSec));
      return res.status(429).json({ error: `Too many login attempts. Retry in ${limitCheck.retryAfterSec}s.` });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [normalizedEmail], async (err, user: any) => {
      const ip = getClientIp(req);
      if (err) return res.status(500).json({ error: err.message });
      if (!user) {
        recordLoginFailure(loginKey);
        logAudit(db, { action: 'login', status: 'fail', ip, detail: `email=${normalizedEmail}; reason=user_not_found` });
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(normalizedPassword, user.password);
      if (!validPassword) {
        recordLoginFailure(loginKey);
        logAudit(db, { userId: user.id, action: 'login', status: 'fail', ip, detail: `email=${normalizedEmail}; reason=bad_password` });
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      clearLoginFailures(loginKey);
      logAudit(db, { userId: user.id, action: 'login', status: 'success', ip, detail: `email=${normalizedEmail}` });

      const tokenPayload = { id: user.id, email: user.email };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: tokenPayload });
    });
  });

  // Child Profiles
  app.get('/api/children', authenticateToken, (req: any, res) => {
    db.all(
      `SELECT id, childName, childBirthDate, childGender, childGoal, createdAt, updatedAt
       FROM child_profiles WHERE userId = ? ORDER BY id ASC`,
      [req.user.id],
      (err, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(`SELECT selectedChildId FROM users WHERE id = ?`, [req.user.id], (userErr: any, userRow: any) => {
          if (userErr) return res.status(500).json({ error: userErr.message });
          return res.json({ items: rows || [], selectedChildId: userRow?.selectedChildId || null });
        });
      }
    );
  });

  app.post('/api/children', authenticateToken, (req: any, res) => {
    const { childName, childBirthDate, childGender, childGoal } = req.body || {};
    const name = normalizeText(childName, 50);
    if (!name) return res.status(400).json({ error: 'childName is required' });

    const now = new Date().toISOString();
    const gender = childGender === 'boy' ? 'boy' : 'girl';
    const birthDate = isValidDateString(childBirthDate) ? childBirthDate : null;

    db.run(
      `INSERT INTO child_profiles (userId, childName, childBirthDate, childGender, childGoal, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, birthDate, gender, normalizeText(childGoal, 120), now, now],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const newId = Number(this.lastID);
        db.run(`UPDATE users SET selectedChildId = COALESCE(selectedChildId, ?) WHERE id = ?`, [newId, req.user.id], () => {});
        logAudit(db, { userId: req.user.id, action: 'child_create', status: 'success', ip: getClientIp(req), detail: `childId=${newId}` });
        return res.json({ id: newId });
      }
    );
  });

  app.put('/api/children/:id', authenticateToken, (req: any, res) => {
    const childId = Number(req.params.id);
    if (Number.isNaN(childId) || childId <= 0) return res.status(400).json({ error: 'invalid child id' });

    const { childName, childBirthDate, childGender, childGoal } = req.body || {};
    const name = normalizeText(childName, 50);
    if (!name) return res.status(400).json({ error: 'childName is required' });

    const gender = childGender === 'boy' ? 'boy' : 'girl';
    const birthDate = isValidDateString(childBirthDate) ? childBirthDate : null;
    const now = new Date().toISOString();

    db.run(
      `UPDATE child_profiles
       SET childName = ?, childBirthDate = ?, childGender = ?, childGoal = ?, updatedAt = ?
       WHERE id = ? AND userId = ?`,
      [name, birthDate, gender, normalizeText(childGoal, 120), now, childId, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (!this.changes) return res.status(404).json({ error: 'child profile not found' });

        logAudit(db, { userId: req.user.id, action: 'child_update', status: 'success', ip: getClientIp(req), detail: `childId=${childId}` });
        return res.json({ success: true });
      }
    );
  });

  app.post('/api/children/:id/select', authenticateToken, (req: any, res) => {
    const childId = Number(req.params.id);
    if (Number.isNaN(childId) || childId <= 0) return res.status(400).json({ error: 'invalid child id' });

    db.get(`SELECT id FROM child_profiles WHERE id = ? AND userId = ?`, [childId, req.user.id], (err: any, row: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'child profile not found' });

      db.run(`UPDATE users SET selectedChildId = ? WHERE id = ?`, [childId, req.user.id], function (uErr) {
        if (uErr) return res.status(500).json({ error: uErr.message });
        logAudit(db, { userId: req.user.id, action: 'child_select', status: 'success', ip: getClientIp(req), detail: `childId=${childId}` });
        return res.json({ success: true });
      });
    });
  });

  app.delete('/api/children/:id', authenticateToken, (req: any, res) => {
    const deleteChildId = Number(req.params.id);
    const targetChildId = req.body?.targetChildId ? Number(req.body.targetChildId) : null;

    if (Number.isNaN(deleteChildId) || deleteChildId <= 0) {
      return res.status(400).json({ error: 'invalid child id' });
    }

    db.all(`SELECT id FROM child_profiles WHERE userId = ? ORDER BY id ASC`, [req.user.id], (listErr: any, rows: any[]) => {
      if (listErr) return res.status(500).json({ error: listErr.message });

      const ids = (rows || []).map((r) => Number(r.id)).filter((n) => !Number.isNaN(n));
      if (!ids.includes(deleteChildId)) return res.status(404).json({ error: 'child profile not found' });
      if (ids.length <= 1) return res.status(400).json({ error: 'Cannot delete the only child profile' });

      let targetId = targetChildId;
      if (!targetId || Number.isNaN(targetId) || targetId <= 0 || targetId === deleteChildId || !ids.includes(targetId)) {
        targetId = ids.find((id) => id !== deleteChildId) || null;
      }

      if (!targetId) return res.status(400).json({ error: 'No valid target child profile for migration' });

      const now = new Date().toISOString();

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const finalize = (err?: any) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message || String(err) });
          }
          db.run('COMMIT', (commitErr: any) => {
            if (commitErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: commitErr.message });
            }
            logAudit(db, {
              userId: req.user.id,
              action: 'child_delete',
              status: 'success',
              ip: getClientIp(req),
              detail: `deleteChildId=${deleteChildId}; targetChildId=${targetId}`
            });
            return res.json({ success: true, migratedTo: targetId, deletedChildId: deleteChildId, updatedAt: now });
          });
        };

        db.run(`UPDATE todos SET childProfileId = ? WHERE userId = ? AND childProfileId = ?`, [targetId, req.user.id, deleteChildId], (e1: any) => {
          if (e1) return finalize(e1);
          db.run(`UPDATE weekly_plan SET childProfileId = ? WHERE userId = ? AND childProfileId = ?`, [targetId, req.user.id, deleteChildId], (e2: any) => {
            if (e2) return finalize(e2);
            db.run(`UPDATE checklist SET childProfileId = ? WHERE userId = ? AND childProfileId = ?`, [targetId, req.user.id, deleteChildId], (e3: any) => {
              if (e3) return finalize(e3);
              db.run(`UPDATE grocery_list SET childProfileId = ? WHERE userId = ? AND childProfileId = ?`, [targetId, req.user.id, deleteChildId], (e4: any) => {
                if (e4) return finalize(e4);
                db.run(`UPDATE growth_records SET childProfileId = ? WHERE userId = ? AND childProfileId = ?`, [targetId, req.user.id, deleteChildId], (e5: any) => {
                  if (e5) return finalize(e5);
                  db.run(`DELETE FROM child_profiles WHERE id = ? AND userId = ?`, [deleteChildId, req.user.id], (e6: any) => {
                    if (e6) return finalize(e6);
                    db.run(`UPDATE users SET selectedChildId = ? WHERE id = ? AND selectedChildId = ?`, [targetId, req.user.id, deleteChildId], (e7: any) => {
                      if (e7) return finalize(e7);
                      return finalize();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  // Backward-compatible Profile API (returns selected child)
  app.get('/api/profile', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);

      db.get(`SELECT id, email, createdAt FROM users WHERE id = ?`, [req.user.id], (uErr, user: any) => {
        if (uErr) return res.status(500).json({ error: uErr.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!selectedChildId) {
          return res.json({
            ...user,
            selectedChildId: null,
            childName: '',
            childBirthDate: null,
            childGender: 'girl',
            childGoal: ''
          });
        }

        db.get(
          `SELECT childName, childBirthDate, childGender, childGoal FROM child_profiles WHERE id = ? AND userId = ?`,
          [selectedChildId, req.user.id],
          (cErr, child: any) => {
            if (cErr) return res.status(500).json({ error: cErr.message });
            return res.json({
              ...user,
              selectedChildId,
              childName: child?.childName || '',
              childBirthDate: child?.childBirthDate || null,
              childGender: child?.childGender || 'girl',
              childGoal: child?.childGoal || ''
            });
          }
        );
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch profile' });
    }
  });

  // Backward-compatible update profile (writes selected child)
  app.put('/api/profile', authenticateToken, async (req: any, res) => {
    const { childName, childBirthDate, childGender, childGoal } = req.body || {};

    const normalizedGender = childGender === 'boy' ? 'boy' : 'girl';
    const normalizedBirthDate = isValidDateString(childBirthDate) ? childBirthDate : null;
    const normalizedName = normalizeText(childName, 50);

    if (!normalizedName) return res.status(400).json({ error: 'childName is required' });

    try {
      let selectedChildId = await getSelectedChildId(req.user.id);
      const now = new Date().toISOString();

      if (!selectedChildId) {
        db.run(
          `INSERT INTO child_profiles (userId, childName, childBirthDate, childGender, childGoal, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, normalizedName, normalizedBirthDate, normalizedGender, normalizeText(childGoal, 120), now, now],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const newId = Number(this.lastID);
            db.run(`UPDATE users SET selectedChildId = ? WHERE id = ?`, [newId, req.user.id], (uErr) => {
              if (uErr) return res.status(500).json({ error: uErr.message });
              logAudit(db, { userId: req.user.id, action: 'profile_update', status: 'success', ip: getClientIp(req), detail: `created childId=${newId}` });
              return res.json({ success: true });
            });
          }
        );
        return;
      }

      db.run(
        `UPDATE child_profiles
         SET childName = ?, childBirthDate = ?, childGender = ?, childGoal = ?, updatedAt = ?
         WHERE id = ? AND userId = ?`,
        [normalizedName, normalizedBirthDate, normalizedGender, normalizeText(childGoal, 120), now, selectedChildId, req.user.id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          logAudit(db, { userId: req.user.id, action: 'profile_update', status: 'success', ip: getClientIp(req), detail: `updated childId=${selectedChildId}` });
          return res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to update profile' });
    }
  });

  // Get Todos
  app.get('/api/todos', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.json([]);

      db.all(`SELECT * FROM todos WHERE userId = ? AND childProfileId = ? ORDER BY createdAt DESC`, [req.user.id, selectedChildId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const todos = rows.map((row: any) => ({
          ...row,
          completed: row.completed === 1
        }));
        res.json(todos);
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch todos' });
    }
  });

  // Create Todo
  app.post('/api/todos', authenticateToken, async (req: any, res) => {
    const { text, priority = 'medium', dueDate = null } = req.body || {};
    const createdAt = new Date().toISOString();

    const normalizedText = normalizeText(text, 200);
    if (!normalizedText) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const allowedPriorities = ['low', 'medium', 'high'];
    const normalizedPriority = allowedPriorities.includes(priority) ? priority : 'medium';
    const normalizedDueDate = normalizeOptionalDate(dueDate);

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `INSERT INTO todos (userId, childProfileId, text, completed, priority, dueDate, createdAt) VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [req.user.id, selectedChildId, normalizedText, normalizedPriority, normalizedDueDate, createdAt],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          logAudit(db, { userId: req.user.id, action: 'todo_create', status: 'success', ip: getClientIp(req), detail: `todoId=${this.lastID}; childId=${selectedChildId}` });
          res.json({ id: this.lastID, text: normalizedText, completed: false, priority: normalizedPriority, dueDate: normalizedDueDate, createdAt });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to create todo' });
    }
  });

  // Update Todo
  app.put('/api/todos/:id', authenticateToken, async (req: any, res) => {
    const { completed, text, priority, dueDate } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (typeof completed === 'boolean') {
      fields.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (typeof text === 'string') {
      const normalizedText = normalizeText(text, 200);
      if (!normalizedText) {
        return res.status(400).json({ error: 'Todo text cannot be empty' });
      }
      fields.push('text = ?');
      values.push(normalizedText);
    }

    if (typeof priority === 'string') {
      const allowedPriorities = ['low', 'medium', 'high'];
      const normalizedPriority = allowedPriorities.includes(priority) ? priority : 'medium';
      fields.push('priority = ?');
      values.push(normalizedPriority);
    }

    if (typeof dueDate === 'string' || dueDate === null) {
      fields.push('dueDate = ?');
      values.push(normalizeOptionalDate(dueDate));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      values.push(req.params.id, req.user.id, selectedChildId);

      db.run(
        `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND userId = ? AND childProfileId = ?`,
        values,
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to update todo' });
    }
  });

  // Delete Todo
  app.delete('/api/todos/:id', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `DELETE FROM todos WHERE id = ? AND userId = ? AND childProfileId = ?`,
        [req.params.id, req.user.id, selectedChildId],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          logAudit(db, { userId: req.user.id, action: 'todo_delete', status: 'success', ip: getClientIp(req), detail: `todoId=${req.params.id}; childId=${selectedChildId}` });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to delete todo' });
    }
  });

  // --- VITE MIDDLEWARE ---
  
  // Weekly Plan
  app.get('/api/weekly-plan', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.json({ planData: null });

      db.get(
        `SELECT planData FROM weekly_plan WHERE userId = ? AND (childProfileId = ? OR childProfileId IS NULL) ORDER BY childProfileId DESC LIMIT 1`,
        [req.user.id, selectedChildId],
        (err, row: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(row ? { planData: row.planData } : { planData: null });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch weekly plan' });
    }
  });

  app.post('/api/weekly-plan', authenticateToken, async (req: any, res) => {
    const { planData } = req.body || {};
    const updatedAt = new Date().toISOString();

    if (typeof planData !== 'string' || planData.length > 40000) {
      return res.status(400).json({ error: 'Invalid weekly plan payload' });
    }

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `INSERT INTO weekly_plan (userId, childProfileId, planData, updatedAt) VALUES (?, ?, ?, ?)
         ON CONFLICT(userId, childProfileId) DO UPDATE SET planData = excluded.planData, updatedAt = excluded.updatedAt`,
        [req.user.id, selectedChildId, planData, updatedAt],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to save weekly plan' });
    }
  });

  // Checklist
  app.get('/api/checklist', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.json({ checkedItems: null });

      db.get(
        `SELECT checkedItems FROM checklist WHERE userId = ? AND (childProfileId = ? OR childProfileId IS NULL) ORDER BY childProfileId DESC LIMIT 1`,
        [req.user.id, selectedChildId],
        (err, row: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(row ? { checkedItems: row.checkedItems } : { checkedItems: null });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch checklist' });
    }
  });

  app.post('/api/checklist', authenticateToken, async (req: any, res) => {
    const { checkedItems } = req.body || {};
    const updatedAt = new Date().toISOString();

    if (typeof checkedItems !== 'string' || checkedItems.length > 50000) {
      return res.status(400).json({ error: 'Invalid checklist payload' });
    }

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `INSERT INTO checklist (userId, childProfileId, checkedItems, updatedAt) VALUES (?, ?, ?, ?)
         ON CONFLICT(userId, childProfileId) DO UPDATE SET checkedItems = excluded.checkedItems, updatedAt = excluded.updatedAt`,
        [req.user.id, selectedChildId, checkedItems, updatedAt],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to save checklist' });
    }
  });

  // Grocery List
  app.get('/api/grocery-list', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.json({ listData: null });

      db.get(
        `SELECT listData FROM grocery_list WHERE userId = ? AND (childProfileId = ? OR childProfileId IS NULL) ORDER BY childProfileId DESC LIMIT 1`,
        [req.user.id, selectedChildId],
        (err, row: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(row ? { listData: row.listData } : { listData: null });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch grocery list' });
    }
  });

  app.post('/api/grocery-list', authenticateToken, async (req: any, res) => {
    const { listData } = req.body || {};
    const updatedAt = new Date().toISOString();

    if (typeof listData !== 'string' || listData.length > 30000) {
      return res.status(400).json({ error: 'Invalid grocery list payload' });
    }

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `INSERT INTO grocery_list (userId, childProfileId, listData, updatedAt) VALUES (?, ?, ?, ?)
         ON CONFLICT(userId, childProfileId) DO UPDATE SET listData = excluded.listData, updatedAt = excluded.updatedAt`,
        [req.user.id, selectedChildId, listData, updatedAt],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to save grocery list' });
    }
  });

  // Growth Records
  app.get('/api/growth-records', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.json([]);

      db.all(`SELECT * FROM growth_records WHERE userId = ? AND childProfileId = ? ORDER BY date DESC`, [req.user.id, selectedChildId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to fetch growth records' });
    }
  });

  app.post('/api/growth-records', authenticateToken, async (req: any, res) => {
    const { date, height, weight, bmi } = req.body || {};
    const createdAt = new Date().toISOString();

    if (!isValidDateString(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const h = Number(height);
    const w = Number(weight);
    const b = Number(bmi);

    if (Number.isNaN(h) || h < 40 || h > 250) {
      return res.status(400).json({ error: 'height out of valid range' });
    }

    if (Number.isNaN(w) || w < 2 || w > 300) {
      return res.status(400).json({ error: 'weight out of valid range' });
    }

    if (Number.isNaN(b) || b < 5 || b > 60) {
      return res.status(400).json({ error: 'bmi out of valid range' });
    }

    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `INSERT INTO growth_records (userId, childProfileId, date, height, weight, bmi, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, selectedChildId, date, Number(h.toFixed(1)), Number(w.toFixed(1)), Number(b.toFixed(1)).toFixed(1), createdAt],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          logAudit(db, { userId: req.user.id, action: 'growth_record_create', status: 'success', ip: getClientIp(req), detail: `recordId=${this.lastID}; date=${date}; childId=${selectedChildId}` });
          res.json({ id: this.lastID, date, height: Number(h.toFixed(1)), weight: Number(w.toFixed(1)), bmi: Number(b.toFixed(1)).toFixed(1), createdAt });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to create growth record' });
    }
  });

  app.delete('/api/growth-records/:id', authenticateToken, async (req: any, res) => {
    try {
      const selectedChildId = await getSelectedChildId(req.user.id);
      if (!selectedChildId) return res.status(400).json({ error: 'No child profile selected' });

      db.run(
        `DELETE FROM growth_records WHERE id = ? AND userId = ? AND childProfileId = ?`,
        [req.params.id, req.user.id, selectedChildId],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          logAudit(db, { userId: req.user.id, action: 'growth_record_delete', status: 'success', ip: getClientIp(req), detail: `recordId=${req.params.id}; childId=${selectedChildId}` });
          res.json({ success: true });
        }
      );
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'failed to delete growth record' });
    }
  });

  // Weekly Review (计划闭环)
  app.get('/api/weekly-review', authenticateToken, (req: any, res) => {
    const weekStartRaw = String(req.query.weekStart || '').trim();
    const fallbackWeekStart = toDateString(getWeekStartMonday(new Date()));
    const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(weekStartRaw) ? weekStartRaw : fallbackWeekStart;

    db.get(
      `SELECT weekStart, summary, blockers, nextFocus, score, updatedAt FROM weekly_reviews WHERE userId = ? AND weekStart = ?`,
      [req.user.id, weekStart],
      (err, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
          return res.json({
            weekStart,
            summary: '',
            blockers: '',
            nextFocus: '',
            score: 80,
            updatedAt: null
          });
        }
        return res.json(row);
      }
    );
  });

  app.post('/api/weekly-review', authenticateToken, (req: any, res) => {
    const { weekStart, summary = '', blockers = '', nextFocus = '', score = 80 } = req.body || {};

    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(String(weekStart))) {
      return res.status(400).json({ error: 'weekStart is required in YYYY-MM-DD format' });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ error: 'score must be a number between 0 and 100' });
    }

    const updatedAt = new Date().toISOString();

    db.run(
      `INSERT INTO weekly_reviews (userId, weekStart, summary, blockers, nextFocus, score, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(userId, weekStart) DO UPDATE SET
         summary = excluded.summary,
         blockers = excluded.blockers,
         nextFocus = excluded.nextFocus,
         score = excluded.score,
         updatedAt = excluded.updatedAt`,
      [req.user.id, String(weekStart), String(summary), String(blockers), String(nextFocus), Math.round(numericScore), updatedAt],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ success: true, updatedAt });
      }
    );
  });

  // Audit Logs (basic)
  app.get('/api/audit-logs', authenticateToken, (req: any, res) => {
    const limitRaw = Number(req.query.limit || 50);
    const limit = Number.isNaN(limitRaw) ? 50 : Math.min(200, Math.max(1, limitRaw));

    db.all(
      `SELECT id, action, status, ip, detail, createdAt FROM audit_logs WHERE userId = ? ORDER BY id DESC LIMIT ?`,
      [req.user.id, limit],
      (err, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ items: rows || [] });
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

  if (!IS_PRODUCTION) {
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
