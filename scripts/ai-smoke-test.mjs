#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const now = Date.now();
const email = `ai-smoke-${now}@example.com`;
const password = 'smoke1234';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
};

const run = async () => {
  console.log(`[ai-smoke] BASE_URL=${BASE_URL}`);

  await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      childName: '安栎',
      childBirthDate: '2020-06-01',
      childGender: 'boy',
      childGoal: '健康成长'
    })
  });

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const token = login?.token;
  if (!token) {
    throw new Error('login token missing');
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const growthResp = await request('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: '记录一次身高体重',
      functionCall: {
        name: 'update_growth',
        arguments: {
          heightCm: 118.4,
          weightKg: 22.6,
          measuredAt: '2026-03-22'
        }
      }
    })
  });

  const growthUndo = growthResp?.cards?.[0]?.data?.undoToken;
  if (!growthUndo) {
    throw new Error('growth undoToken missing');
  }

  const todoResp = await request('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: '新增待办：买牛奶',
      functionCall: {
        name: 'add_todo',
        arguments: {
          text: '买牛奶',
          priority: 'medium',
          dueDate: '2026-03-23'
        }
      }
    })
  });

  const todoUndo = todoResp?.cards?.[0]?.data?.undoToken;
  if (!todoUndo) {
    throw new Error('todo undoToken missing');
  }

  const diagPending = await request('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: '记录诊断',
      functionCall: {
        name: 'add_diagnosis',
        arguments: {
          diagnosisText: '轻度维生素D不足',
          adviceText: '继续补充维D 4周',
          riskFlag: 'warning'
        }
      }
    })
  });

  if (!diagPending?.cards?.[0]?.data?.pendingConfirm) {
    throw new Error('diagnosis should require confirmation but did not');
  }

  const diagConfirmed = await request('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: '确认写入诊断',
      confirmMedicalWrite: true,
      functionCall: {
        name: 'add_diagnosis',
        arguments: {
          diagnosisText: '轻度维生素D不足',
          adviceText: '继续补充维D 4周',
          riskFlag: 'warning'
        }
      }
    })
  });

  const diagUndo = diagConfirmed?.cards?.[0]?.data?.undoToken;
  if (!diagUndo) {
    throw new Error('diagnosis undoToken missing after confirm');
  }

  await request('/api/ai/undo', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ undoToken: todoUndo })
  });

  console.log('[ai-smoke] PASS');
  console.log(
    JSON.stringify(
      {
        growthUndo,
        todoUndo,
        diagUndo
      },
      null,
      2
    )
  );
};

run().catch((err) => {
  console.error('[ai-smoke] FAIL', err.message || err);
  process.exit(1);
});
