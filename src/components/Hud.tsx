import React, { useState } from 'react';
import type { GameState, GoogleUser, Settings as GameSettings } from '../game/types';
import { Bug, ChevronDown, ChevronUp, Settings, Map, Compass, Recycle, Backpack } from 'lucide-react';

interface Props {
  state: GameState;
  googleUser: GoogleUser | null;
  settings: GameSettings;
  onSignIn: () => void;
  onSignOut: () => void;
  onSync: () => void;
  onSettings: () => void;
  onApiSettings: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onOpenQuestLog: () => void;
  onOpenCharacter: () => void;
  onOpenMerchant: () => void;
  onOpenMap: () => void;
  onOpenDebug: () => void;
  syncPhase: string;
  lastSavedTurn?: number | null;
}

export function Hud({ state, onSettings, onOpenMap, onOpenQuestLog, onOpenCharacter, onOpenMerchant, onOpenDebug, lastSavedTurn }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const c = state?.character;
  const hpPercent = c && c.maxHp > 0 ? Math.round((c.hp / c.maxHp) * 100) : 100;

  // Adaptive Secondary Resource Check (Supports MP, SP, Power, Rage, etc.)
  const secondaryCurrent = c?.mp ?? c?.sp ?? 12;
  const secondaryMax = c?.maxMp ?? c?.maxSp ?? 12;
  const secondaryLabel = c?.mp !== undefined ? 'MP' : c?.sp !== undefined ? 'SP' : 'NRG';
  const secondaryPercent = secondaryMax > 0 ? Math.round((secondaryCurrent / secondaryMax) * 100) : 100;

  const handleBugClick = () => {
    onOpenDebug();
  };

  const showSalvage = state.engineMode !== 'dnd' && state.engineMode !== 'pyoa';

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 px-2 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between text-xs text-slate-200 sticky top-0 z-40 backdrop-blur w-full">
      
      {/* Left Spacer / Branding or status if needed */}
      <div className="flex items-center gap-1 w-auto sm:w-1/4 shrink">
        <span className="font-serif text-crimson-400 font-bold hidden md:inline">Synaptic GM</span>
        {lastSavedTurn != null && (
          <span className="hidden sm:inline font-mono text-[10px] text-slate-500" title="Last committed turn saved on this device">
            T{lastSavedTurn} saved
          </span>
        )}
      </div>

      {/* DEAD CENTER: Permanent Health & Mana/Resource Bars */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 flex-1 max-w-sm sm:max-w-lg mx-auto min-w-0">
        {/* HP Bar */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          <span className="text-[10px] sm:text-sm font-bold text-rose-400 font-mono shrink-0">HP</span>
          <div className="flex-1 min-w-[60px] sm:min-w-[100px] w-16 sm:w-full bg-slate-900 h-4 sm:h-6 rounded-full overflow-hidden border border-rose-900/70 shadow-inner">
            <div className="bg-gradient-to-r from-rose-700 to-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${hpPercent}%` }} />
          </div>
          <span className="text-[10px] sm:text-sm font-mono font-bold text-slate-100 whitespace-nowrap shrink-0">{c ? `${c.hp}/${c.maxHp}` : '24/24'}</span>
        </div>

        {/* Adaptive Resource Bar (MP / SP / Energy) */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          <span className="text-[10px] sm:text-sm font-bold text-sky-400 font-mono shrink-0">{secondaryLabel}</span>
          <div className="flex-1 min-w-[60px] sm:min-w-[100px] w-16 sm:w-full bg-slate-900 h-4 sm:h-6 rounded-full overflow-hidden border border-sky-900/70 shadow-inner">
            <div className="bg-gradient-to-r from-sky-600 to-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${secondaryPercent}%` }} />
          </div>
          <span className="text-[10px] sm:text-sm font-mono font-bold text-slate-100 whitespace-nowrap shrink-0">{c ? `${secondaryCurrent}/${secondaryMax}` : '12/12'}</span>
        </div>
      </div>

      {/* Right: Controls & Icon Trays */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 w-auto sm:w-1/4 shrink-0">
        
        {/* Mobile Dropdown & Bug Button */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={handleBugClick}
            title={`Debug 2026-08-16i — cheap memorable${lastSavedTurn != null ? ` · last saved T${lastSavedTurn}` : ''}`}
            className="p-1 sm:p-1.5 bg-rose-950/60 border border-rose-800 text-rose-400 rounded hover:bg-rose-900 transition-colors"
          >
            <Bug size={14} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 sm:p-1.5 bg-slate-900 border border-slate-700 text-slate-300 rounded flex items-center justify-center"
            title="Toggle Menu Icons"
          >
            {mobileMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Desktop Icon Tray (Always Visible on Large Screens) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleBugClick}
            title={`Debug 2026-08-16i — cheap memorable${lastSavedTurn != null ? ` · last saved T${lastSavedTurn}` : ''}`}
            className="p-2 bg-rose-950/60 border border-rose-800 text-rose-400 rounded hover:bg-rose-900 transition-colors flex items-center gap-1 text-[11px]"
          >
            <Bug size={14} /> Debug
          </button>
          <button onClick={onOpenMap} title="Map Engine" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors">
            <Map size={15} />
          </button>
          <button onClick={onOpenQuestLog} title="Quests" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors">
            <Compass size={15} />
          </button>
          <button onClick={onOpenCharacter} title="Inventory & Character" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors">
            <Backpack size={15} />
          </button>
          {showSalvage && (
          <button onClick={onOpenMerchant} title="Salvage — System sell / salvage" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors">
            <Recycle size={15} />
          </button>
          )}
          <button onClick={onSettings} title="Settings" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors">
            <Settings size={15} />
          </button>
        </div>

      </div>

      {/* Collapsible Mobile Menu Tray */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-950 border-b border-slate-800 flex md:hidden items-center justify-around py-3 z-50 shadow-xl animate-fadeIn">
          <button onClick={onOpenMap} className="flex flex-col items-center gap-1 text-slate-300 p-2">
            <Map size={16} className="text-cyan-400" />
            <span className="text-[10px]">Map</span>
          </button>
          <button onClick={onOpenQuestLog} className="flex flex-col items-center gap-1 text-slate-300 p-2">
            <Compass size={16} className="text-amber-400" />
            <span className="text-[10px]">Quests</span>
          </button>
          <button onClick={onOpenCharacter} className="flex flex-col items-center gap-1 text-slate-300 p-2">
            <Backpack size={16} className="text-cyan-400" />
            <span className="text-[10px]">Inventory</span>
          </button>
          {showSalvage && (
          <button onClick={onOpenMerchant} className="flex flex-col items-center gap-1 text-slate-300 p-2">
            <Recycle size={16} className="text-sky-400" />
            <span className="text-[10px]">Salvage</span>
          </button>
          )}
          <button onClick={onSettings} className="flex flex-col items-center gap-1 text-slate-300 p-2">
            <Settings size={16} className="text-purple-400" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      )}

    </header>
  );
}