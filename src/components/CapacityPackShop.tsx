import { useState } from 'react';
import { Loader2, Tv } from 'lucide-react';
import {
  type TurnPackDefinition,
  type TurnPackArtId,
  textShopPacks,
  illustratedShopPacks,
  memorableShopPacks,
} from '@/game/subscriptionTiers';
import { grantTurnPack, loadCapacityLedger, type CapacityLedger } from '@/game/capacityLedger';
import {
  canOfferRewardedTurns,
  canOfferRewardedMemorable,
  canWatchRewardedAdNow,
  rewardedAdsRemainingToday,
  rewardedTurnsPerAd,
  watchRewardedAdForTurns,
  watchRewardedAdForMemorable,
  ADULT_MAX_REWARDED_ADS_PER_DAY,
} from '@/game/rewardedAds';
import { MAX_MEMORABLE_ADS_PER_DAY, MAX_MEMORABLE_ADS_PER_WEEK } from '@/game/capacityLedger';
import { ParentPurchaseGate, requestParentPurchaseApproval } from './ParentPurchaseGate';

function packBalances(ledger: CapacityLedger) {
  return {
    text: ledger.textPackBalance ?? 0,
    illustrated: ledger.illustratedPackBalance ?? 0,
    memorable: ledger.memorablePackBalance ?? 0,
  };
}

export function CapacityPackShop({
  onGranted,
  contentMode,
  contentPin,
  verifyPin,
}: {
  onGranted?: (message: string) => void;
  contentMode?: string | null;
  contentPin?: string | null;
  verifyPin?: (pin: string) => boolean;
}) {
  const [ledger, setLedger] = useState(() => loadCapacityLedger());
  const [adBusy, setAdBusy] = useState(false);
  const [memorableAdBusy, setMemorableAdBusy] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<TurnPackDefinition | null>(null);
  const bal = packBalances(ledger);
  const showEarn = canOfferRewardedTurns(contentMode);
  const showMemorableAd = canOfferRewardedMemorable(contentMode);
  const adTurns = rewardedTurnsPerAd(contentMode);
  const adsLeft = rewardedAdsRemainingToday(contentMode, ledger);
  const canWatch = canWatchRewardedAdNow(contentMode);
  const isKid = contentMode === 'kid';

  const applyPack = (pack: TurnPackDefinition) => {
    if (!pack.shopLive) return;
    const next = grantTurnPack(pack.id);
    setLedger(next);
    const gained =
      pack.kind === 'text'
        ? `+${pack.textTurns} text turns`
        : pack.kind === 'memorable'
          ? `+${pack.memorablePlates} memorable pictures`
          : `+${pack.illustratedTurns} illustrated turns`;
    onGranted?.(`${pack.name} added — ${gained} (preview grant; payments not live).`);
  };

  const buy = (pack: TurnPackDefinition) => {
    if (!pack.shopLive) return;
    requestParentPurchaseApproval({
      contentMode,
      contentPin,
      openGate: () => {
        setPendingPack(pack);
        setGateOpen(true);
      },
      action: () => applyPack(pack),
    });
  };

  const watchAd = async () => {
    setAdBusy(true);
    setAdError(null);
    const result = await watchRewardedAdForTurns({ contentMode });
    setAdBusy(false);
    if (!result.ok) {
      setAdError(result.error ?? 'Ad failed');
      return;
    }
    setLedger(result.ledger);
    onGranted?.(
      `Ad complete — +${result.turnsGranted} turns today (provider: ${result.provider}). Watch again anytime.`
    );
  };

  const watchMemorableAd = async () => {
    setMemorableAdBusy(true);
    setAdError(null);
    const result = await watchRewardedAdForMemorable({ contentMode });
    setMemorableAdBusy(false);
    if (!result.ok) {
      setAdError(result.error ?? 'Ad failed');
      return;
    }
    setLedger(result.ledger);
    onGranted?.('Ad complete — +1 memorable picture this week (fast model). Does not reset your weekly count.');
  };

  return (
    <div className="flex flex-col gap-6">
      <ParentPurchaseGate
        contentMode={contentMode}
        contentPin={contentPin}
        verifyPin={verifyPin ?? ((p) => !!contentPin && p === contentPin)}
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingPack(null);
        }}
        onApproved={() => {
          if (pendingPack) applyPack(pendingPack);
          setPendingPack(null);
        }}
      />

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-400">
        Pack balance:{' '}
        <span className="text-cyan-300">{bal.text} text</span>
        {' · '}
        <span className="text-amber-300">{bal.memorable} pictures</span>
        {' · '}
        <span className="text-rose-300">{bal.illustrated} illustrated</span>
        <span className="text-slate-600"> — packs never expire</span>
        {ledger.textAdBonusToday > 0 && (
          <span className="text-amber-300/90"> · +{ledger.textAdBonusToday} from ads today</span>
        )}
      </div>

      {isKid && (
        <p className="text-[11px] text-amber-200/80">
          Kid Mode: watching ads is OK. Buying packs or themes needs a parent PIN.
        </p>
      )}

      {showEarn && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Earn turns
          </h2>
          <p className="mb-3 text-[11px] leading-snug text-slate-500">
            {isKid
              ? `Optional. Watch a short ad for +${adTurns} turns today — no daily cap in Kid Mode. Only completed ads grant turns.`
              : `Optional. Watch for +${adTurns} turns — up to ${ADULT_MAX_REWARDED_ADS_PER_DAY} ads/day on Free. After that, buy a pack or upgrade.`}
          </p>
          <button
            type="button"
            disabled={adBusy || !canWatch}
            onClick={() => void watchAd()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-700/50 bg-cyan-950/40 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-900/50 disabled:opacity-50"
          >
            {adBusy ? <Loader2 size={18} className="animate-spin" /> : <Tv size={18} />}
            {canWatch
              ? `Watch for +${adTurns} turns`
              : 'Daily ad limit reached'}
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            {isKid
              ? `Ads watched today: ${ledger.adsWatchedToday}`
              : `${adsLeft ?? 0} of ${ADULT_MAX_REWARDED_ADS_PER_DAY} ads left today`}
          </p>
          {adError && <p className="mt-2 text-[11px] text-red-400">{adError}</p>}
        </section>
      )}

      {showMemorableAd && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Extra memorable picture
          </h2>
          <p className="mb-3 text-[11px] leading-snug text-slate-500">
            This week’s memorable pictures are used. Watch an ad for +1 fast-model splash
            ({MAX_MEMORABLE_ADS_PER_DAY}/day, {MAX_MEMORABLE_ADS_PER_WEEK}/week). Does not reset the weekly count.
          </p>
          <button
            type="button"
            disabled={memorableAdBusy}
            onClick={() => void watchMemorableAd()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
          >
            {memorableAdBusy ? <Loader2 size={18} className="animate-spin" /> : <Tv size={18} />}
            Watch an ad for +1 memorable picture
          </button>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Turn packs
        </h2>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Extra story turns when today’s allowance runs out. Uses your current tier’s GM. Never expire.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {textShopPacks().map((pack) => (
            <CapacityPackCard key={pack.id} pack={pack} onBuy={() => buy(pack)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Memorable picture packs
        </h2>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Extra story plates after this week’s cap. Fast model only. Never expire. Weekly allowance spends first.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {memorableShopPacks().map((pack) => (
            <CapacityPackCard key={pack.id} pack={pack} onBuy={() => buy(pack)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Illustrated packs
        </h2>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Graphic-novel turns (multi-panel art). Coming soon — shelf preview only.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {illustratedShopPacks().map((pack) => (
            <CapacityPackCard key={pack.id} pack={pack} onBuy={() => buy(pack)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CapacityPackCard({
  pack,
  onBuy,
}: {
  pack: TurnPackDefinition;
  onBuy: () => void;
}) {
  const live = pack.shopLive;
  return (
    <div
      className="sgm-pack-card overflow-hidden rounded-xl border bg-slate-950/80 shadow-lg"
      style={{
        borderColor: `${pack.accent}55`,
        boxShadow: `0 0 0 1px ${pack.accent}22, 0 12px 40px -20px ${pack.accent}66`,
      }}
    >
      <PackArtFace art={pack.art} accent={pack.accent} soft={pack.accentSoft} label={pack.label} />
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-50">{pack.name}</h3>
          {pack.bestValue && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${pack.accent}33`, color: pack.accent }}
            >
              Best value
            </span>
          )}
          {!live && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Soon
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium" style={{ color: pack.accent }}>
          {pack.label}
        </p>
        <p className="text-[11px] leading-snug text-slate-400">{pack.blurb}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-sm font-medium text-cyan-300">
            £{pack.priceGbp.toFixed(2)} · ${pack.priceUsd.toFixed(2)}
          </div>
          <button
            type="button"
            disabled={!live}
            onClick={onBuy}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              live
                ? 'border-slate-600 bg-slate-800 text-slate-100 hover:border-cyan-600'
                : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
            }`}
          >
            {live ? 'Buy (soon)' : 'Coming soon'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PackArtFace({
  art,
  accent,
  soft,
  label,
}: {
  art: TurnPackArtId;
  accent: string;
  soft: string;
  label: string;
}) {
  return (
    <div
      className="sgm-pack-art relative h-28 w-full overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${accent}55 0%, transparent 55%), linear-gradient(145deg, ${soft} 0%, #020617 70%)`,
      }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(255,255,255,0.04) 11px, rgba(255,255,255,0.04) 12px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <PackGlyph art={art} accent={accent} />
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
        <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  );
}

function PackGlyph({ art, accent }: { art: TurnPackArtId; accent: string }) {
  const stroke = accent;
  const common = {
    width: 72,
    height: 72,
    viewBox: '0 0 72 72',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  } as const;

  switch (art) {
    case 'spark':
      return (
        <svg {...common} className="drop-shadow-lg">
          <path
            d="M36 8 L40 30 L58 28 L42 40 L50 58 L36 46 L22 58 L30 40 L14 28 L32 30 Z"
            fill={`${accent}99`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="36" cy="36" r="4" fill="#fff7ed" />
        </svg>
      );
    case 'chapter':
      return (
        <svg {...common} className="drop-shadow-lg">
          <path d="M16 14h28a6 6 0 0 1 6 6v34H22a6 6 0 0 0-6 6V14z" fill={`${accent}33`} stroke={stroke} strokeWidth="1.5" />
          <path d="M56 14H28a6 6 0 0 0-6 6v40a6 6 0 0 1 6-6h28V14z" fill={`${accent}66`} stroke={stroke} strokeWidth="1.5" />
          <path d="M28 28h20M28 36h16M28 44h18" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'saga':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="14" y="18" width="44" height="40" rx="3" fill={`${accent}44`} stroke={stroke} strokeWidth="1.5" />
          <path d="M22 18 V12 h28 v6" stroke={stroke} strokeWidth="1.5" />
          <path d="M24 30h24M24 38h20M24 46h16" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
          <circle cx="50" cy="50" r="8" fill={`${accent}88`} stroke={stroke} />
          <path d="M50 46v8M46 50h8" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'panels':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="10" y="14" width="24" height="20" rx="2" fill={`${accent}55`} stroke={stroke} strokeWidth="1.4" />
          <rect x="38" y="14" width="24" height="20" rx="2" fill={`${accent}33`} stroke={stroke} strokeWidth="1.4" />
          <rect x="10" y="38" width="52" height="20" rx="2" fill={`${accent}77`} stroke={stroke} strokeWidth="1.4" />
          <circle cx="22" cy="24" r="3" fill="#fef3c7" opacity="0.8" />
          <path d="M42 22h14M42 28h10" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'arc':
      return (
        <svg {...common} className="drop-shadow-lg">
          <path
            d="M12 52 Q36 8 60 52"
            stroke={stroke}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="18" y="34" width="14" height="18" rx="1.5" fill={`${accent}66`} stroke={stroke} strokeWidth="1.2" />
          <rect x="36" y="28" width="14" height="24" rx="1.5" fill={`${accent}88`} stroke={stroke} strokeWidth="1.2" />
          <circle cx="36" cy="20" r="4" fill="#ecfdf5" />
        </svg>
      );
    case 'volume':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="16" y="12" width="10" height="48" rx="1.5" fill={`${accent}99`} stroke={stroke} strokeWidth="1.2" />
          <rect x="28" y="14" width="10" height="46" rx="1.5" fill={`${accent}66`} stroke={stroke} strokeWidth="1.2" />
          <rect x="40" y="10" width="14" height="50" rx="1.5" fill={`${accent}44`} stroke={stroke} strokeWidth="1.2" />
          <path d="M43 22h8M43 28h8M43 34h6" stroke="#fce7f3" strokeWidth="1" opacity="0.6" />
          <path d="M19 20h4M31 22h4" stroke="#0f172a" strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case 'snap':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="16" y="18" width="40" height="32" rx="3" fill={`${accent}55`} stroke={stroke} strokeWidth="1.5" />
          <circle cx="36" cy="34" r="8" fill={`${accent}99`} stroke={stroke} />
          <circle cx="36" cy="34" r="3.5" fill="#fff7ed" />
          <path d="M26 18 l4-6 h12 l4 6" stroke={stroke} strokeWidth="1.4" fill={`${accent}33`} />
        </svg>
      );
    case 'album':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="18" y="22" width="36" height="28" rx="2" fill={`${accent}33`} stroke={stroke} strokeWidth="1.2" transform="rotate(-8 36 36)" />
          <rect x="16" y="18" width="36" height="28" rx="2" fill={`${accent}66`} stroke={stroke} strokeWidth="1.4" />
          <path d="M22 28h20M22 34h16" stroke="#fef3c7" strokeWidth="1.1" opacity="0.6" />
        </svg>
      );
    case 'gallery':
      return (
        <svg {...common} className="drop-shadow-lg">
          <rect x="10" y="16" width="20" height="16" rx="1.5" fill={`${accent}55`} stroke={stroke} strokeWidth="1.2" />
          <rect x="34" y="16" width="28" height="16" rx="1.5" fill={`${accent}77`} stroke={stroke} strokeWidth="1.2" />
          <rect x="10" y="36" width="28" height="20" rx="1.5" fill={`${accent}88`} stroke={stroke} strokeWidth="1.2" />
          <rect x="42" y="36" width="20" height="20" rx="1.5" fill={`${accent}44`} stroke={stroke} strokeWidth="1.2" />
          <circle cx="20" cy="23" r="2.5" fill="#fef3c7" />
        </svg>
      );
  }
}
