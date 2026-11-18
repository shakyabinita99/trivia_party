export const THEMES = [
  { id: 'party', name: 'Party' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'ocean', name: 'Blue' },
  { id: 'pink', name: 'Pink' },
  { id: 'festive', name: 'Festive' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

export function applyTheme(id: unknown) {
  document.documentElement.dataset.theme = isTheme(id) ? id : 'party';
}
