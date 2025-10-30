// Centralized environment variables accessor
// Tries multiple sources to support different build tools and local/dev fallbacks

/* eslint-disable @typescript-eslint/no-explicit-any */
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const nodeEnv = (typeof globalThis !== 'undefined' && (globalThis as any).process && (globalThis as any).process.env) || {};
const browserEnv = (typeof window !== 'undefined' && (window as any).__ENV__) || {};

const resolveEnv = (keys: string[], fallback: string): string => {
  for (const key of keys) {
    if (metaEnv[key]) return metaEnv[key] as string;
    if (nodeEnv[key]) return nodeEnv[key] as string;
    if (browserEnv[key]) return browserEnv[key] as string;
  }
  return fallback;
};

export const BACKEND_URL: string = resolveEnv(
  ['VITE_BACKEND_URL', 'BACKEND_URL'],
  'https://tustockya-api.onrender.com' 
);

export const API_BASE_URL: string = resolveEnv(
  ['VITE_API_BASE_URL', 'API_BASE_URL'],
  BACKEND_URL
);

export default {
  BACKEND_URL,
  API_BASE_URL,
};


