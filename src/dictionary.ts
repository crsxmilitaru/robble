import { DEFAULT_DICT_MODE, DICT_CONFIG } from './constants';
import { normalizeRomanianWord } from './dictionary-utils';
import type { DictionaryMode } from './types';
import { showToast } from './ui-utils';

export { normalizeRomanianWord };

const DICT_STORAGE_KEY = 'robble_dictionary_mode';

export function getStoredDictionaryMode(): DictionaryMode {
  const saved = localStorage.getItem(DICT_STORAGE_KEY);
  if (saved === 'standard' || saved === 'complete') {
    return saved;
  }
  return DEFAULT_DICT_MODE;
}

export function setStoredDictionaryMode(mode: DictionaryMode): void {
  localStorage.setItem(DICT_STORAGE_KEY, mode);
}

let currentMode: DictionaryMode = getStoredDictionaryMode();

export function getCurrentDictionaryMode(): DictionaryMode {
  return currentMode;
}

let worker: Worker | null = null;
const messageHandlers = new Set<(e: MessageEvent) => void>();

export function getDictionaryWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./dictionary-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const handlers = Array.from(messageHandlers);

      for (const handler of handlers) {
        handler(e);
      }
    };
  }
  return worker;
}

export function addWorkerListener(handler: (e: MessageEvent) => void): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

let requestIdCounter = 0;

export async function isValidWord(word: string): Promise<boolean> {
  const w = normalizeRomanianWord(word);

  if (!w) {
    return false;
  }

  const worker = getDictionaryWorker();
  const requestId = ++requestIdCounter;

  return new Promise((resolve) => {
    const unsub = addWorkerListener((e) => {
      if (e.data.type === 'validate' && e.data.requestId === requestId) {
        unsub();
        resolve(e.data.isValid);
      }
    });
    worker.postMessage({ type: 'validate', word, requestId });
  });
}

export async function loadDictionary(mode: DictionaryMode = getStoredDictionaryMode()): Promise<boolean> {
  currentMode = mode;
  setStoredDictionaryMode(mode);
  const statusEl = document.getElementById('load-status');
  const worker = getDictionaryWorker();
  const requestId = ++requestIdCounter;
  const urls = [DICT_CONFIG[mode].url];

  return new Promise((resolve) => {
    const unsub = addWorkerListener((e) => {
      if (e.data.requestId && e.data.requestId !== requestId) {
        return;
      }

      const { type, message, count, error } = e.data;
      switch (type) {
        case 'status':
          if (statusEl) {
            statusEl.textContent = message;
          }
          break;
        case 'progress':
          if (statusEl) {
            statusEl.textContent = `Încărcat: ${count.toLocaleString()}...`;
          }
          break;
        case 'complete':
          if (statusEl) {
            statusEl.textContent = `${count.toLocaleString()} cuvinte încărcate.`;
          }
          unsub();
          resolve(count > 10000);
          break;
        case 'error':
          showToast(`Eroare Worker: ${error.toString()}`, 'error');
          unsub();
          resolve(false);
          break;
      }
    });
    worker.postMessage({ type: 'load', urls, requestId });
  });
}

export interface Definition {
  htmlRep: string;
  sourceName: string;
}

export interface WordInfo {
  lemma: string;
  definitions: Definition[];
}

interface DexonlineDefinition {
  htmlRep: string;
  sourceName: string;
}

interface DexonlineResponse {
  type: string;
  word: string;
  definitions: DexonlineDefinition[];
}

export async function fetchDefinition(word: string): Promise<WordInfo | null> {
  const normalized = normalizeRomanianWord(word).toLowerCase();

  try {
    const response = await fetch(`https://dexonline.ro/definitie/${normalized}/json`);

    if (!response.ok) {
      return null;
    }

    const data: DexonlineResponse = await response.json();

    if (data.type === 'searchResults' && data.definitions) {
      return {
        lemma: data.word,
        definitions: data.definitions.map((d: DexonlineDefinition) => ({
          htmlRep: d.htmlRep,
          sourceName: d.sourceName
        }))
      };
    }
  } catch {
    showToast('Eroare la preluarea definiției.', 'error');
  }

  return null;
}

