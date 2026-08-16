import { useId } from 'react';
import type { DiceMaterial, ShopItem } from '@/game/cosmeticCatalog';

export type DieSides = 4 | 6 | 8 | 10 | 12 | 20;

/** Faceted d20 vertices (viewBox 0 0 36 40). */
const T = '18,2';
const UL = '8,12';
const UR = '28,12';
const ML = '4,21';
const C = '18,19';
const MR = '32,21';
const LL = '8,31';
const LR = '28,31';
const B = '18,38';

const SILHOUETTE = `${T} ${UL} ${ML} ${LL} ${B} ${LR} ${MR} ${UR}`;

const DIE_SILHOUETTE: Record<DieSides, string> = {
  4: '18,4 33,36 3,36',
  6: '7,7 29,7 29,33 7,33',
  8: '18,3 33,20 18,37 3,20',
  10: '18,3 33,14 27,37 9,37 3,14',
  12: '18,3 32,11 32,29 18,37 4,29 4,11',
  20: SILHOUETTE,
};

export function liveDiceItem(): ShopItem {
  if (typeof document === 'undefined') {
    return {
      id: 'dice.live',
      slot: 'dice',
      name: 'Live',
      blurb: '',
      priceGbp: '',
      priceUsd: '',
      diceSkin: { accent: '#64748b', face: '#1e293b' },
    };
  }
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const material = root.dataset.sgmDice as DiceMaterial | undefined;
  return {
    id: 'dice.live',
    slot: 'dice',
    name: 'Live',
    blurb: '',
    priceGbp: '',
    priceUsd: '',
    diceSkin: {
      accent: cs.getPropertyValue('--sgm-dice-accent').trim() || '#64748b',
      face: cs.getPropertyValue('--sgm-dice-face').trim() || '#1e293b',
      material: material || undefined,
    },
  };
}

const FACES: { pts: string; shade: number }[] = [
  { pts: `${T} ${UL} ${UR}`, shade: 0.22 },
  { pts: `${UL} ${UR} ${C}`, shade: 0.04 },
  { pts: `${UL} ${ML} ${C}`, shade: -0.12 },
  { pts: `${UR} ${MR} ${C}`, shade: 0.1 },
  { pts: `${ML} ${LL} ${C}`, shade: -0.22 },
  { pts: `${MR} ${LR} ${C}`, shade: -0.06 },
  { pts: `${LL} ${LR} ${C}`, shade: -0.16 },
  { pts: `${ML} ${LL} ${B}`, shade: -0.34 },
  { pts: `${MR} ${LR} ${B}`, shade: -0.2 },
  { pts: `${LL} ${LR} ${B}`, shade: -0.42 },
];

const EDGES = [
  `${T} ${UL}`,
  `${T} ${UR}`,
  `${UL} ${UR}`,
  `${UL} ${C}`,
  `${UR} ${C}`,
  `${UL} ${ML}`,
  `${UR} ${MR}`,
  `${ML} ${C}`,
  `${MR} ${C}`,
  `${ML} ${LL}`,
  `${MR} ${LR}`,
  `${LL} ${C}`,
  `${LR} ${C}`,
  `${LL} ${LR}`,
  `${LL} ${B}`,
  `${LR} ${B}`,
];

type Palette = {
  body: string;
  deep: string;
  grain: string;
  shine: string;
  rim: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function shade(hex: string, amt: number): string {
  return mix(hex, amt >= 0 ? '#ffffff' : '#000000', Math.min(0.85, Math.abs(amt)));
}

const MATERIAL_BY_ID: Record<string, DiceMaterial> = {
  'dice.grove': 'wood',
  'dice.umbrance': 'obsidian',
  'dice.spire': 'ivory',
  'dice.forgehall': 'brass',
  'dice.warcamp': 'iron',
  'dice.hoard': 'scale',
  'dice.ashrise': 'ember',
  'dice.chassis': 'circuit',
  'dice.radiance': 'marble',
  'dice.pact': 'sulfur',
  'dice.ossuary': 'bone',
  'dice.glamour': 'iridescent',
  'dice.scrapheap': 'scrap',
  'dice.abyss': 'tide',
  'dice.nocturne': 'velvet',
  'dice.system-holo': 'holo',
  'dice.bone-iron': 'bone',
  'dice.frost-crystal': 'frost',
  'dice.neon-edge': 'neon',
};

const MATERIAL_BASE: Record<DiceMaterial, { body: string; grain: string; shine: string }> = {
  wood: { body: '#6b3f1a', grain: '#2a1608', shine: '#d4a574' },
  obsidian: { body: '#12081c', grain: '#2e1065', shine: '#e9d5ff' },
  ivory: { body: '#f3e6c8', grain: '#c4a574', shine: '#fffaf0' },
  brass: { body: '#b45309', grain: '#431407', shine: '#fde68a' },
  iron: { body: '#4b5563', grain: '#1c1917', shine: '#e5e7eb' },
  scale: { body: '#854d0e', grain: '#422006', shine: '#facc15' },
  ember: { body: '#1c0a0a', grain: '#7f1d1d', shine: '#fb7185' },
  circuit: { body: '#0f172a', grain: '#155e75', shine: '#67e8f9' },
  marble: { body: '#f5e6c8', grain: '#a8a29e', shine: '#fffbeb' },
  sulfur: { body: '#7f1d1d', grain: '#450a0a', shine: '#fca5a5' },
  bone: { body: '#e7e5e4', grain: '#78716c', shine: '#fafaf9' },
  iridescent: { body: '#86198f', grain: '#0f766e', shine: '#f0abfc' },
  scrap: { body: '#713f12', grain: '#3f2a0c', shine: '#facc15' },
  tide: { body: '#115e59', grain: '#042f2e', shine: '#99f6e4' },
  velvet: { body: '#4c0519', grain: '#1f0208', shine: '#fb7185' },
  holo: { body: '#083344', grain: '#0e7490', shine: '#a5f3fc' },
  frost: { body: '#0c4a6e', grain: '#0369a1', shine: '#e0f2fe' },
  neon: { body: '#1a041f', grain: '#86198f', shine: '#f0abfc' },
};

function paletteFor(material: DiceMaterial | undefined, face: string, accent: string): Palette {
  const base = material ? MATERIAL_BASE[material] : { body: face, grain: shade(face, -0.4), shine: accent };
  return {
    body: mix(base.body, face, 0.28),
    deep: mix(base.grain, face, 0.15),
    grain: base.grain,
    shine: mix(base.shine, accent, 0.35),
    rim: accent,
  };
}

function MaterialFill({
  material,
  p,
  uid,
}: {
  material: DiceMaterial | undefined;
  p: Palette;
  uid: string;
}) {
  return (
    <>
      <rect width="36" height="40" fill={`url(#${uid}-body)`} />
      {material === 'wood' && (
        <>
          <path d="M4 10 C12 8 16 14 22 12 C28 10 32 16 34 14" fill="none" stroke={p.grain} strokeWidth="1.15" opacity="0.85" />
          <path d="M3 16 C10 14 15 20 21 18 C27 16 31 22 35 19" fill="none" stroke={p.grain} strokeWidth="1.3" opacity="0.75" />
          <path d="M4 22 C11 20 17 26 24 23 C29 21 32 27 34 25" fill="none" stroke={p.grain} strokeWidth="1.1" opacity="0.7" />
          <path d="M5 28 C13 26 18 32 26 29 C30 28 33 33 34 31" fill="none" stroke={p.grain} strokeWidth="1.05" opacity="0.65" />
          <ellipse cx="14" cy="20" rx="2.2" ry="1.6" fill={p.deep} stroke={p.grain} strokeWidth="0.6" />
          <path d="M8 8 C14 18 16 24 12 34" fill="none" stroke={p.shine} strokeWidth="0.45" opacity="0.35" />
        </>
      )}
      {material === 'obsidian' && (
        <>
          <rect width="36" height="40" fill={`url(#${uid}-glass)`} />
          <path d="M10 8 L16 18 L13 28" fill="none" stroke={p.shine} strokeWidth="0.55" opacity="0.55" />
          <path d="M22 6 L20 16 L26 30" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.55" />
          <ellipse cx="24" cy="11" rx="3.2" ry="1.4" fill={p.shine} opacity="0.45" />
        </>
      )}
      {material === 'ivory' && (
        <>
          <path d="M6 12 C14 16 18 10 28 14" fill="none" stroke={p.grain} strokeWidth="0.55" opacity="0.45" />
          <path d="M8 24 C16 20 22 28 30 22" fill="none" stroke={p.grain} strokeWidth="0.5" opacity="0.35" />
          <ellipse cx="22" cy="10" rx="4" ry="1.6" fill={p.shine} opacity="0.4" />
        </>
      )}
      {material === 'brass' && (
        <>
          {[
            [11, 14], [18, 11], [24, 15], [10, 21], [17, 20], [25, 22], [13, 28], [21, 29],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.15" fill={p.deep} stroke={p.shine} strokeWidth="0.35" opacity="0.7" />
          ))}
          <path d="M8 9 L26 13" fill="none" stroke={p.shine} strokeWidth="1.1" opacity="0.45" />
        </>
      )}
      {material === 'iron' && (
        <>
          {[
            [10, 13], [20, 10], [27, 16], [8, 22], [16, 19], [26, 24], [12, 30], [22, 32], [18, 26],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 0.9 : 0.55} fill={p.deep} opacity="0.8" />
          ))}
          <path d="M7 11 L14 18" fill="none" stroke={p.shine} strokeWidth="0.7" opacity="0.35" />
          <path d="M5 26 C10 28 14 24 18 30" fill="none" stroke="#65a30d" strokeWidth="0.7" opacity="0.45" />
        </>
      )}
      {material === 'scale' && (
        <>
          {[
            [10, 14], [18, 12], [26, 14],
            [8, 20], [15, 19], [22, 19], [29, 20],
            [11, 26], [18, 25], [25, 26],
            [14, 32], [22, 32],
          ].map(([cx, cy], i) => (
            <path
              key={i}
              d={`M${cx - 3.2} ${cy} A3.2 2.6 0 0 1 ${cx + 3.2} ${cy}`}
              fill={i % 2 ? p.shine : p.body}
              stroke={p.grain}
              strokeWidth="0.45"
              opacity="0.85"
            />
          ))}
        </>
      )}
      {material === 'ember' && (
        <>
          <ellipse cx="18" cy="20" rx="8" ry="10" fill={`url(#${uid}-ember)`} />
          {[
            [12, 14], [22, 12], [16, 24], [24, 22], [14, 30],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i === 2 ? 1.1 : 0.7} fill={p.shine} opacity="0.85" />
          ))}
        </>
      )}
      {material === 'circuit' && (
        <>
          {/* Logo cue: energy-thread d20 with skull inside (cyan + amber). */}
          <path d="M8 12 H18 V20 H28" fill="none" stroke={p.shine} strokeWidth="0.7" opacity="0.7" />
          <path d="M10 28 H16 V18" fill="none" stroke="#fbbf24" strokeWidth="0.65" opacity="0.65" />
          <path d="M22 10 V16 H30" fill="none" stroke={p.rim} strokeWidth="0.65" />
          {/* Skull: orbits + nasal + teeth */}
          <ellipse cx="18" cy="17" rx="6.2" ry="7.2" fill="#020617" opacity="0.55" stroke={p.shine} strokeWidth="0.55" />
          <ellipse cx="15.2" cy="16" rx="1.7" ry="2.1" fill={p.shine} opacity="0.95" />
          <ellipse cx="20.8" cy="16" rx="1.7" ry="2.1" fill={p.shine} opacity="0.95" />
          <path d="M18 18.2 L16.6 21.5 L19.4 21.5 Z" fill="#fbbf24" opacity="0.85" />
          <path d="M14.5 23.5 H21.5 M15.2 25 H20.8 M15.8 26.4 H20.2" fill="none" stroke={p.shine} strokeWidth="0.55" opacity="0.8" />
          {[
            [8, 12], [18, 20], [28, 20], [16, 18], [22, 10], [24, 26],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.9" fill={i % 2 ? '#fbbf24' : p.shine} />
          ))}
        </>
      )}
      {material === 'marble' && (
        <>
          <path d="M7 10 C12 18 10 24 16 34" fill="none" stroke={p.grain} strokeWidth="0.7" opacity="0.55" />
          <path d="M20 6 C22 16 28 20 30 32" fill="none" stroke={p.grain} strokeWidth="0.55" opacity="0.4" />
          <path d="M12 16 C18 14 24 22 28 18" fill="none" stroke="#78716c" strokeWidth="0.45" opacity="0.35" />
          <ellipse cx="23" cy="10" rx="4.5" ry="1.8" fill={p.shine} opacity="0.45" />
        </>
      )}
      {material === 'sulfur' && (
        <>
          <path d="M12 8 L16 18 L12 26 L18 34" fill="none" stroke="#facc15" strokeWidth="0.7" opacity="0.7" />
          <path d="M24 10 L22 20 L26 30" fill="none" stroke={p.shine} strokeWidth="0.55" opacity="0.5" />
          <ellipse cx="18" cy="22" rx="7" ry="8" fill="#ef4444" opacity="0.18" />
        </>
      )}
      {material === 'bone' && (
        <>
          {[
            [11, 13], [19, 10], [26, 15], [9, 22], [17, 20], [25, 24], [13, 30], [21, 32], [15, 16],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 4 === 0 ? 0.85 : 0.5} fill={p.grain} opacity="0.45" />
          ))}
          <path d="M10 9 L14 20 L11 33" fill="none" stroke={p.grain} strokeWidth="0.45" opacity="0.5" />
        </>
      )}
      {material === 'iridescent' && (
        <>
          <rect width="36" height="40" fill={`url(#${uid}-iris)`} opacity="0.85" />
          <path d="M8 14 L28 10" fill="none" stroke="#99f6e4" strokeWidth="1.1" opacity="0.55" />
          <path d="M6 24 L30 20" fill="none" stroke="#f0abfc" strokeWidth="0.9" opacity="0.5" />
        </>
      )}
      {material === 'scrap' && (
        <>
          <path d="M8 12 L16 10 L14 18 Z" fill="#a16207" opacity="0.7" />
          <path d="M20 22 L30 20 L26 30 Z" fill="#3f6212" opacity="0.45" />
          <path d="M7 26 L22 14" fill="none" stroke={p.shine} strokeWidth="0.7" />
          <path d="M12 32 L28 18" fill="none" stroke={p.shine} strokeWidth="0.55" opacity="0.7" />
          <circle cx="18" cy="20" r="1.3" fill={p.deep} stroke={p.shine} strokeWidth="0.4" />
        </>
      )}
      {material === 'tide' && (
        <>
          <path d="M4 14 C12 10 16 18 24 14 C28 12 32 16 34 14" fill="none" stroke={p.shine} strokeWidth="1" opacity="0.55" />
          <path d="M4 22 C12 18 18 26 26 21 C30 19 33 24 35 22" fill="none" stroke={p.shine} strokeWidth="1.15" opacity="0.45" />
          <path d="M5 30 C14 26 20 34 30 29" fill="none" stroke={p.shine} strokeWidth="0.9" opacity="0.4" />
          <ellipse cx="22" cy="12" rx="3.4" ry="1.5" fill="#ecfeff" opacity="0.45" />
        </>
      )}
      {material === 'velvet' && (
        <>
          <ellipse cx="16" cy="16" rx="8" ry="6" fill={p.shine} opacity="0.16" />
          <ellipse cx="22" cy="26" rx="6" ry="5" fill="#000" opacity="0.25" />
        </>
      )}
      {material === 'holo' && (
        <>
          {[8, 13, 18, 23, 28, 33].map((y) => (
            <line key={y} x1="4" y1={y} x2="32" y2={y} stroke={p.shine} strokeWidth="0.55" opacity="0.35" />
          ))}
          <path d="M8 10 L28 30" fill="none" stroke="#f0abfc" strokeWidth="0.7" opacity="0.4" />
          <rect width="36" height="40" fill={`url(#${uid}-holo)`} opacity="0.35" />
        </>
      )}
      {material === 'frost' && (
        <>
          <path d="M18 6 L18 34 M10 12 L26 28 M26 12 L10 28 M8 20 L28 20" fill="none" stroke={p.shine} strokeWidth="0.55" opacity="0.7" />
          {[
            [12, 11], [24, 14], [16, 22], [22, 30],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.7" fill="#fff" opacity="0.85" />
          ))}
          <rect width="36" height="40" fill="#e0f2fe" opacity="0.12" />
        </>
      )}
      {material === 'neon' && (
        <>
          <rect width="36" height="40" fill="#05010a" />
          <path d={`${T} ${C} ${B}`} fill="none" stroke={p.shine} strokeWidth="0.7" opacity="0.5" />
        </>
      )}
    </>
  );
}

export function DicePreview({
  item,
  size = 36,
  die = 20,
}: {
  item?: ShopItem;
  size?: number;
  die?: DieSides;
}) {
  const rawId = useId().replace(/:/g, '');
  const uid = `d20-${rawId}`;
  const skin = item ?? liveDiceItem();
  const accent = skin.diceSkin?.accent ?? skin.preview?.accent ?? '#94a3b8';
  const face = skin.diceSkin?.face ?? skin.preview?.panel ?? '#1e293b';
  const material = skin.diceSkin?.material ?? MATERIAL_BY_ID[skin.id];
  const silhouette = DIE_SILHOUETTE[die];
  const p = paletteFor(material, face, accent);
  const glow = material === 'ember' || material === 'neon' || material === 'holo';

  return (
    <svg
      viewBox="0 0 36 40"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden
      style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.45))' }}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(p.body, 0.18)} />
          <stop offset="45%" stopColor={p.body} />
          <stop offset="100%" stopColor={p.deep} />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={p.shine} stopOpacity="0.55" />
          <stop offset="35%" stopColor={p.body} stopOpacity="0.1" />
          <stop offset="70%" stopColor={p.rim} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${uid}-iris`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#a21caf" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id={`${uid}-holo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>
        <radialGradient id={`${uid}-ember`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#e11d48" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1c0a0a" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <polygon points={silhouette} />
        </clipPath>
        {glow && (
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {glow && (
        <polygon
          points={silhouette}
          fill={p.rim}
          opacity="0.45"
          filter={`url(#${uid}-glow)`}
        />
      )}

      <g clipPath={`url(#${uid}-clip)`}>
        <MaterialFill material={material} p={p} uid={uid} />
        {FACES.map((faceTri, i) => (
          <polygon
            key={i}
            points={faceTri.pts}
            fill={faceTri.shade >= 0 ? '#fff' : '#000'}
            opacity={Math.abs(faceTri.shade) * 0.55}
          />
        ))}
      </g>

      <polygon
        points={silhouette}
        fill="none"
        stroke={material === 'neon' ? p.shine : p.rim}
        strokeWidth={material === 'neon' ? 1.8 : 1.15}
        strokeLinejoin="round"
      />
      {die === 20 && EDGES.map((pts, i) => (
        <polyline
          key={i}
          points={pts}
          fill="none"
          stroke={p.deep}
          strokeWidth="0.45"
          opacity="0.55"
        />
      ))}
      <text
        x="18"
        y={die === 20 ? 13.6 : 22}
        textAnchor="middle"
        fill={material === 'ivory' || material === 'bone' || material === 'marble' ? p.grain : p.shine}
        fontSize="5.4"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {die}
      </text>
    </svg>
  );
}
