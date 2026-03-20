#!/usr/bin/env node

/**
 * child-health-manager API smoke test
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/api-smoke-test.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function main() {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `smoke-${unique}@example.com`;
  const password = 'SmokePass123!';

  log('1', `register ${email}`);
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password,
      childName: '测试宝贝',
      childBirthDate: '2018-01-01',
      childGender: 'girl',
      childGoal: '健康成长'
    }
  });
  assertOk(reg.ok, `register failed: ${reg.status} ${JSON.stringify(reg.data)}`);

  log('2', 'login');
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  assertOk(login.ok, `login failed: ${login.status} ${JSON.stringify(login.data)}`);
  const token = login.data?.token;
  assertOk(!!token, 'missing token from login');

  log('3', 'profile');
  const profile = await request('/api/profile', { token });
  assertOk(profile.ok, `profile failed: ${profile.status}`);

  log('4', 'create todo');
  const todo = await request('/api/todos', {
    method: 'POST',
    token,
    body: {
      text: '冒烟测试待办',
      priority: 'high',
      dueDate: new Date().toISOString().slice(0, 10)
    }
  });
  assertOk(todo.ok, `create todo failed: ${todo.status} ${JSON.stringify(todo.data)}`);

  log('5', 'list todos');
  const todos = await request('/api/todos', { token });
  assertOk(todos.ok && Array.isArray(todos.data), 'list todos failed');

  log('6', 'create growth record');
  const growth = await request('/api/growth-records', {
    method: 'POST',
    token,
    body: {
      date: new Date().toISOString().slice(0, 10),
      height: 120.5,
      weight: 24.2,
      bmi: '16.7'
    }
  });
  assertOk(growth.ok, `create growth failed: ${growth.status} ${JSON.stringify(growth.data)}`);

  log('7', 'get reminders');
  const reminders = await request('/api/reminders', { token });
  assertOk(reminders.ok, `reminders failed: ${reminders.status} ${JSON.stringify(reminders.data)}`);

  log('8', 'get report');
  const report = await request('/api/reports/weekly?days=7', { token });
  assertOk(report.ok, `report failed: ${report.status} ${JSON.stringify(report.data)}`);

  log('OK', 'smoke test passed');
}

main().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});
