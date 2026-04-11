import { AILogic } from './ai-logic';
import { normalizeRomanianWord } from './dictionary-utils';
import { Trie } from './trie';

const dictionary = new Set<string>();
const trie = new Trie();

self.onmessage = async (e: MessageEvent) => {
  const { type, urls, word, state, rack, difficulty, requestId } = e.data;

  if (type === 'load') {
    for (const url of urls) {
      try {
        self.postMessage({ type: 'status', message: 'Citim baza de date...', requestId });
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const text = await resp.text();
        self.postMessage({ type: 'status', message: 'Prelucrăm cuvintele...', requestId });
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const w = normalizeRomanianWord(lines[i]);
          if (w.length >= 2) {
            dictionary.add(w);
            trie.insert(w);
          }
          if (i % 50000 === 0) self.postMessage({ type: 'progress', count: dictionary.size, requestId });
        }
        self.postMessage({ type: 'complete', count: dictionary.size, requestId });
        return;
      } catch (e) {
        console.error('Worker error:', e);
        self.postMessage({ type: 'error', error: String(e), requestId });
      }
    }
  } else if (type === 'validate') {
    const w = normalizeRomanianWord(word);
    self.postMessage({ type: 'validate', word, isValid: dictionary.has(w), requestId });
  } else if (type === 'findBestMove') {
    const gameState = {
      ...state,
      cloneBoard: () => state.board.map((row: any) => row.map((cell: any) => cell ? { ...cell } : null))
    };
    const ai = new AILogic(gameState, trie, dictionary, difficulty);
    const result = ai.findBestMove(rack);
    self.postMessage({ type: 'findBestMove', result, requestId });
  }
};
