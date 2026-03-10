// ==================== UTILITY FUNCTIONS ====================

export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

export function formatDate(dateString, lang = 'en') {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isEn = lang === 'en';

  if (diffDays === 0) {
    const timeStr = date.toLocaleTimeString(isEn ? 'en-US' : 'bn-BD', { hour: '2-digit', minute: '2-digit' });
    return isEn ? `Today, ${timeStr}` : `আজ, ${timeStr}`;
  } else if (diffDays === 1) {
    return isEn ? 'Yesterday' : 'গতকাল';
  } else if (diffDays < 7) {
    return date.toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { weekday: 'long' });
  } else {
    return date.toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function getFileType(fileName) {
  if (!fileName) return 'other';
  const ext = fileName.split('.').pop().toLowerCase();
  const types = {
    image: ['jpg','jpeg','png','gif','webp','svg','bmp','ico','tiff','heic','heif'],
    video: ['mp4','mkv','avi','mov','webm','flv','wmv','m4v','3gp','mpeg','mpg'],
    audio: ['mp3','wav','ogg','flac','aac','m4a','wma','opus'],
    document: ['doc','docx','odt','rtf','txt','md'],
    pdf: ['pdf'],
    spreadsheet: ['xls','xlsx','csv','ods'],
    presentation: ['ppt','pptx','odp'],
    code: ['js','ts','py','java','cpp','c','h','html','css','scss','sass','less','json','xml','php','rb','go','rs','swift','kt','vue','jsx','tsx','sql','sh','bash','ps1','yaml','yml','toml','ini','conf','env'],
    archive: ['zip','rar','7z','tar','gz','bz2','xz','iso'],
  };
  for (const [type, extensions] of Object.entries(types)) {
    if (extensions.includes(ext)) return type;
  }
  return 'other';
}

export function getFileIcon(fileName, isFolder = false) {
  if (isFolder) return 'fa-folder';
  const type = getFileType(fileName);
  const icons = {
    image: 'fa-file-image', video: 'fa-file-video', audio: 'fa-file-audio',
    document: 'fa-file-word', pdf: 'fa-file-pdf', spreadsheet: 'fa-file-excel',
    presentation: 'fa-file-powerpoint', code: 'fa-file-code', archive: 'fa-file-archive',
    other: 'fa-file',
  };
  return icons[type] || icons.other;
}

export function getFileTypeLabel(fileName, isFolder = false, lang = 'en') {
  if (isFolder) return lang === 'en' ? 'Folder' : 'ফোল্ডার';
  const type = getFileType(fileName);
  const labels = {
    en: { image:'Image',video:'Video',audio:'Audio',document:'Document',pdf:'PDF',spreadsheet:'Spreadsheet',presentation:'Presentation',code:'Code',archive:'Archive',other:'File' },
    bn: { image:'ছবি',video:'ভিডিও',audio:'অডিও',document:'ডকুমেন্ট',pdf:'পিডিএফ',spreadsheet:'স্প্রেডশিট',presentation:'প্রেজেন্টেশন',code:'কোড',archive:'আর্কাইভ',other:'ফাইল' },
  };
  return labels[lang][type] || labels[lang].other;
}

export function truncateName(name, maxLength = 25) {
  if (!name || name.length <= maxLength) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const baseName = name.slice(0, name.length - ext.length);
  const truncatedBase = baseName.slice(0, maxLength - ext.length - 3);
  return truncatedBase + '...' + ext;
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateDaysLeft(startDate, totalDays) {
  if (!startDate) return totalDays;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - diffDays);
}

export function isTrialExpired(createdAt) {
  return calculateDaysLeft(createdAt, 7) <= 0;
}

export function isPendingApprovalExpired(paymentDate) {
  return calculateDaysLeft(paymentDate, 3) <= 0;
}

export function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('device-fingerprint', 2, 2);
  const fingerprint = [
    navigator.userAgent, navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatStorageLimit(limitGB, lang = 'en') {
  if (!limitGB || limitGB === Infinity) return lang === 'en' ? 'Unlimited' : 'আনলিমিটেড';
  if (limitGB >= 1024) return `${(limitGB / 1024).toFixed(0)} TB`;
  return `${limitGB} GB`;
}

export function sortItems(items, sort = 'name', order = 'asc') {
  return [...items].sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
      case 'date': cmp = new Date(b.uploadDate || b.createdAt || 0) - new Date(a.uploadDate || a.createdAt || 0); break;
      case 'size': cmp = (b.size || 0) - (a.size || 0); break;
    }
    return order === 'desc' ? -cmp : cmp;
  });
}

export function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif',
    webp:'image/webp', svg:'image/svg+xml', mp4:'video/mp4', webm:'video/webm',
    mkv:'video/x-matroska', avi:'video/x-msvideo', mp3:'audio/mpeg',
    wav:'audio/wav', ogg:'audio/ogg', pdf:'application/pdf',
    txt:'text/plain', html:'text/html', css:'text/css',
    js:'application/javascript', json:'application/json',
    xml:'application/xml', zip:'application/zip',
    rar:'application/x-rar-compressed',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ==================== ENCRYPTION ====================

export async function deriveKeyFromPin(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
}

export async function encryptData(data, key) {
  if (!key) throw new Error('Encryption key not available');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  return new Blob([combined], { type: 'application/octet-stream' });
}

export async function decryptData(encryptedBlob, key) {
  if (!key) throw new Error('Encryption key not available');
  const buffer = await encryptedBlob.arrayBuffer();
  const iv = buffer.slice(0, 12);
  const data = buffer.slice(12);
  try {
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, data);
    return new Blob([decryptedBuffer]);
  } catch (error) {
    throw new Error('Decryption failed. Wrong PIN?');
  }
}

export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
