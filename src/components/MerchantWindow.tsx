import React, { useMemo, useState } from 'react';
import type { GameState, Item, CraftingMaterial } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { getSellPrice, getMaterialSellPrice, sellItem, sellMaterial } from '@/game/merchant';
import { salvageItem, checkSalvageRequirement, getSalvageRequirement } from '@/game/salvage';
import { computeInventoryCapacity } from '@/game/inventory';
import { X, Coins, Recycle, AlertTriangle, Package, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateChange: (newState: GameState) => void;
  onToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

type Tab = 'sell' | 'salvage';

export function MerchantWindow({ isOpen, onClose, state, onStateChange, onToast }: Props) {
  const [tab, setTab] = useState<Tab>('sell');
  const [confirmSellId, setConfirmSellId] = useState<string | null>(null);
  const [confirmSalvageId, setConfirmSalvageId] = useState<string | null>(null);

  const sellableItems = useMemo(
    () => state.inventory.filter((i) => !i.equipped),
    [state.inventory]
  );

  const capacity = useMemo(() => computeInventoryCapacity(state), [state]);

  if (!isOpen) return null;

  const handleSell = (item: Item) => {
    const result = sellItem(state, item.id);
    if (result.ok && result.newState && result.goldGained) {
      onStateChange(result.newState);
      onToast(`Sold ${item.name} for ${result.goldGained} gold.`, 'success');
      setConfirmSellId(null);
    } else if (result.reason) {
      onToast(result.reason, 'error');
    }
  };

  const handleSalvage = (item: Item) => {
    const result = salvageItem(state, item.id);
    if (result.ok && result.newState && result.materials) {
      onStateChange(result.newState);
      const matList = result.materials.map((m) => `${m.name} x${m.quantity}`).join(', ');
      onToast(`Salvaged ${item.name}. Obtained: ${matList}.`, 'success');
      setConfirmSalvageId(null);
    } else if (result.reason) {
      onToast(result.reason, 'error');
      setConfirmSalvageId(null);
    }
  };

  const handleSellMaterial = (mat: CraftingMaterial) => {
    const result = sellMaterial(state, mat.id, mat.quantity);
    if (result.ok && result.newState && result.goldGained) {
      onStateChange(result.newState);
      onToast(`Sold ${mat.name} x${mat.quantity} for ${result.goldGained} gold.`, 'success');
    } else if (result.reason) {
      onToast(result.reason, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="sgm-turn-frame sgm-info-panel relative flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl sm:h-[85vh] sm:rounded-xl sm:border">
        <div className="sgm-turn-frame-bar h-1 w-full shrink-0" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-black/20">
          <div className="flex items-center gap-2 min-w-0">
            <Recycle size={20} className="sgm-info-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="sgm-info-heading text-lg font-bold">Salvage</h2>
              <p className="text-[11px] text-slate-500 leading-snug">System conversion of surplus goods. Available anywhere. No vendor present.</p>
            </div>
            <span className="sgm-coin-chip text-sm text-slate-400 ml-2 shrink-0">
              <Coins size={14} className="sgm-coin-icon" />
              <span className="sgm-coin font-mono font-bold">{state.gold ?? 0}</span>
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex shrink-0 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setTab('sell')}
            className={`flex-1 flex items-center justify-center gap-2 border-t-2 py-2.5 text-sm transition-colors ${tab === 'sell' ? 'sgm-info-tab-on' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            <Coins size={14} /> Sell
          </button>
          <button
            onClick={() => setTab('salvage')}
            className={`flex-1 flex items-center justify-center gap-2 border-t-2 py-2.5 text-sm transition-colors ${tab === 'salvage' ? 'sgm-info-tab-on' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            <Recycle size={14} /> Salvage
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {tab === 'sell' && (
            <div className="space-y-4">
              {/* Items */}
              <div>
                <h3 className="sgm-info-heading mb-2 flex items-center gap-1 text-sm uppercase tracking-wider">
                  <Package size={14} /> Items
                </h3>
                {sellableItems.length === 0 ? (
                  <p className="text-slate-600 text-sm italic">No surplus items eligible for conversion.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sellableItems.map((item) => {
                      const price = getSellPrice(item);
                      const isConfirming = confirmSellId === item.id;
                      return (
                        <div key={item.id} className="sgm-sheet-inset flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 p-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                            <div className="text-xs text-slate-500">{item.rarity}{item.itemLevel ? ` · iLvl ${item.itemLevel}` : ''}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="sgm-coin text-sm font-mono font-bold">{price}g</span>
                            {isConfirming ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleSell(item)} className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors">Confirm</button>
                                <button onClick={() => setConfirmSellId(null)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmSellId(item.id)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Sell</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Materials */}
              {state.materials.length > 0 && (
                <div>
                  <h3 className="sgm-info-heading mb-2 flex items-center gap-1 text-sm uppercase tracking-wider">
                    <Layers size={14} /> Materials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {state.materials.map((mat) => {
                      const price = getMaterialSellPrice({ rarity: mat.rarity, quantity: mat.quantity });
                      return (
                        <div key={mat.id} className="sgm-sheet-inset flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 p-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: RARITY_COLORS[mat.rarity] }}>{mat.name}</div>
                            <div className="text-xs text-slate-500">{mat.rarity} · x{mat.quantity}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="sgm-coin text-sm font-mono font-bold">{price}g</span>
                            <button onClick={() => handleSellMaterial(mat)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Sell</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'salvage' && (
            <div className="space-y-3">
              {/* Capacity info */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 text-xs text-slate-400">
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-slate-500" />
                  <span>Material Storage: {capacity.materialsUsed} / {capacity.materialsSlots === 0 && capacity.hasMagicalContainer ? '∞' : capacity.materialsSlots}</span>
                </div>
                {capacity.hasMagicalContainer ? (
                  <p className="text-emerald-400/70">A magical container is equipped — materials stack without limit.</p>
                ) : (
                  <p className="text-slate-500">No specialized materials container equipped. Materials occupy standard inventory slots.</p>
                )}
              </div>

              {sellableItems.length === 0 ? (
                <p className="text-slate-600 text-sm italic">No items available to salvage.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {sellableItems.map((item) => {
                    const req = getSalvageRequirement(item);
                    const check = checkSalvageRequirement(item, state);
                    const isConfirming = confirmSalvageId === item.id;
                    return (
                      <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                            <div className="text-xs text-slate-500">{item.rarity}{item.itemLevel ? ` · iLvl ${item.itemLevel}` : ''}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {isConfirming ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleSalvage(item)} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Confirm</button>
                                <button onClick={() => setConfirmSalvageId(null)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmSalvageId(item.id)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex items-center gap-1">
                                <Recycle size={12} /> Salvage
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-start gap-1.5 text-xs">
                          {check.ok ? (
                            <span className="text-emerald-400/80">Can salvage — {req.profession} requirement met{check.source ? ` via ${check.source.name}` : ''}.</span>
                          ) : (
                            <>
                              <AlertTriangle size={12} className="text-rose-400 mt-0.5 shrink-0" />
                              <span className="text-rose-400/80">{check.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
