export interface ComicStyle {
  id: string;
  name: string;
  promptSuffix: string;
}

export const COMIC_STYLES: Record<string, ComicStyle> = {
  western: {
    id: 'western',
    name: 'Classic Western Comic',
    promptSuffix: 'western comic book panel, vibrant bold ink lines, dynamic coloring, defined panel border, clean gutters',
  },
  manga: {
    id: 'manga',
    name: 'Manga / Manhwa',
    promptSuffix: 'manga comic panel, monochrome ink linework, halftone screentone shading, dynamic speed lines, japanese manga aesthetic',
  },
  darkFantasy: {
    id: 'darkFantasy',
    name: 'Dark Fantasy Graphic Novel',
    promptSuffix: 'dark fantasy comic panel, Mike Mignola inspired blocky ink shadows, muted gothic palette, graphic novel cross-hatching',
  },
  cartoon: {
    id: 'cartoon',
    name: 'Cyberpunk Cel-Shaded',
    promptSuffix: 'cyberpunk cel-shaded comic panel, crisp vector line art, neon rim lighting, sleek HUD glow accents, futuristic cel shading',
  },
};
