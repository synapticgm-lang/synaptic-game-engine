/**
 * ACC-1a: convert px font sizes to rem at build time, so the Accessibility text-size
 * setting (root font-size on <html>) scales every font, including Tailwind arbitrary
 * classes like text-[10px] and fixed sizes in index.css. Only `font-size` is touched;
 * layout px values stay as they are. Own code (about 20 lines); no library needed.
 */
const PX = /(-?\d*\.?\d+)px\b/g;

export function fontPxToRemValue(value, base = 16) {
  return value.replace(PX, (_, n) => {
    const rem = Number(n) / base;
    return `${Number(rem.toFixed(4))}rem`;
  });
}

const plugin = (opts = {}) => {
  const base = opts.base ?? 16;
  return {
    postcssPlugin: 'sgm-font-px-to-rem',
    Declaration(decl) {
      if (decl.prop !== 'font-size' || !decl.value.includes('px')) return;
      const sel = decl.parent && decl.parent.selector;
      if (sel && /(^|,)\s*(html|:root)\s*(,|$)/.test(sel)) return;
      decl.value = fontPxToRemValue(decl.value, base);
    },
  };
};
plugin.postcss = true;
export default plugin;
