export const normalizeCodigo = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .toUpperCase()
