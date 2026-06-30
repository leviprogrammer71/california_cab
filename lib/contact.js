const fs = require('fs');
const path = require('path');

const recipientEmail = process.env.CONTACT_TO || 'levisumbela@thevalleypartner.com';

function getStoragePath() {
  return process.env.INQUIRIES_FILE || path.join(process.cwd(), 'data', 'inquiries.json');
}

function ensureStorageFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
}

function readInquiries(filePath) {
  ensureStorageFile(filePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
}

function writeInquiries(filePath, inquiries) {
  ensureStorageFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2), 'utf8');
}

async function syncToGitHub(inquiries, filePath) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : null);

  if (!token || !repo) return;

  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = Buffer.from(JSON.stringify(inquiries, null, 2)).toString('base64');
  const url = `https://api.github.com/repos/${repo}/contents/${relativePath}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json'
  };

  let sha = null;
  try {
    const existing = await fetch(url, { headers });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }
  } catch (error) {
    console.error('Unable to fetch existing GitHub inquiry file:', error);
  }

  try {
    await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Update inquiries from website form',
        content,
        sha
      })
    });
  } catch (error) {
    console.error('Unable to sync inquiries to GitHub:', error);
  }
}

async function saveInquiry(payload) {
  const storagePath = getStoragePath();
  const inquiries = readInquiries(storagePath);
  const entry = {
    ...payload,
    receivedAt: new Date().toISOString()
  };
  inquiries.push(entry);
  writeInquiries(storagePath, inquiries);
  await syncToGitHub(inquiries, storagePath);
  return entry;
}

async function sendNotification(payload, text) {
  const mailEndpoint = process.env.MAIL_ENDPOINT || process.env.FORMSUBMIT_ENDPOINT;
  if (!mailEndpoint) return { ok: false, reason: 'No mail endpoint configured' };

  try {
    const response = await fetch(mailEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: 'New California Cabinets inquiry',
        name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
        email: payload.email || '',
        phone: payload.phone || '',
        city: payload.city || '',
        project_type: payload.project_type || '',
        timeline: payload.timeline || '',
        message: text
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, reason: errText };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

async function handleContact(payload) {
  const entry = await saveInquiry(payload);
  const text = [
    `Name: ${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
    `Email: ${payload.email || ''}`,
    `Phone: ${payload.phone || ''}`,
    `City: ${payload.city || ''}`,
    `Project Type: ${payload.project_type || ''}`,
    `Timeline: ${payload.timeline || ''}`,
    `Message: ${payload.message || ''}`
  ].join('\n');

  try {
    await sendNotification(payload, text);
  } catch (error) {
    console.error('Mail notification failed:', error);
  }

  return {
    entry,
    storagePath: getStoragePath(),
    recipientEmail
  };
}

module.exports = {
  handleContact,
  saveInquiry,
  getStoragePath,
  recipientEmail
};
