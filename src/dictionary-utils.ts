export function normalizeRomanianWord(word: string): string {
  return word ? word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '').trim() : '';
}
