import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fontPxToRem from './postcss-font-px-to-rem.js';

export default {
  plugins: [tailwindcss(), fontPxToRem(), autoprefixer()],
};
