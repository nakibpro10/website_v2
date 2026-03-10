export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://cloud.nakibpro1.workers.dev';

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CONCURRENT_UPLOADS = 3;
export const MAX_RETRY_ATTEMPTS = 3;
export const TRIAL_DAYS = 7;
export const PENDING_APPROVAL_DAYS = 3;
export const MAX_FREE_DEVICES = 2;

export const PAYMENT_NUMBERS = {
  bkash: import.meta.env.VITE_PAYMENT_BKASH || '01768038808',
  nagad: import.meta.env.VITE_PAYMENT_NAGAD || '01768038808',
  rocket: import.meta.env.VITE_PAYMENT_ROCKET || '01768038808',
  upay: import.meta.env.VITE_PAYMENT_UPAY || '01768038808',
};

export const PAYMENT_COLORS = {
  bkash: 'linear-gradient(135deg, #E2136E, #A4005D)',
  nagad: 'linear-gradient(135deg, #F6921E, #ED1C24)',
  rocket: 'linear-gradient(135deg, #8B2F8B, #5D1F5D)',
  upay: 'linear-gradient(135deg, #00A651, #007A3D)',
};

export const PREMIUM_PLANS = {
  1024: { storage: 1024, price: 1500, label: '1 TB', labelBn: '১ টিবি' },
  2048: { storage: 2048, price: 2200, label: '2 TB', labelBn: '২ টিবি' },
  3072: { storage: 3072, price: 3000, label: '3 TB', labelBn: '৩ টিবি' },
  5120: { storage: 5120, price: 3700, label: '5 TB', labelBn: '৫ টিবি' },
};

export const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP || '8801768038808';
