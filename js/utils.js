export function escapeHtml(str = '') {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function showToast(message) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

export function getGrade(percent) {
  if (percent >= 95) return 10;
  if (percent >= 85) return 9;
  if (percent >= 75) return 8;
  if (percent >= 65) return 7;
  if (percent >= 55) return 6;
  if (percent >= 45) return 5;
  if (percent >= 35) return 4;
  if (percent >= 25) return 3;
  if (percent >= 15) return 2;
  return 1;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function saveToLocal(key, data) {
  localStorage.setItem(`vortex_${key}`, JSON.stringify(data));
}

export function loadFromLocal(key, defaultValue = []) {
  const saved = localStorage.getItem(`vortex_${key}`);
  return saved ? JSON.parse(saved) : defaultValue;
}