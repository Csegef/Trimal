// src/pages/Inventory.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import {
  loadInventoryPage,
  equipItem,
  unequipItem,
  sellItem,
  AuthError,
} from "../api/inventoryApi";
import {
  RARITY_COLOR,
  RARITY_GLOW,
  isEquippable,
  resolveEquipSlot,
  resolveItemImagePath,
  ItemSlotTile,
} from "../models/Item";
import PlayerPortrait from "../components/PlayerPortrait";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_LABELS = {
  weapon: { label: "Weapon" },
  armor_cap: { label: "Helmet" },
  armor_plate: { label: "Chest" },
  armor_leggings: { label: "Legs" },
  armor_boots: { label: "Boots" },
};

const STAT_LABELS = {
  strength: { label: "Strength" },
  agility: { label: "Agility" },
  intelligence: { label: "Intelligence" },
  endurance: { label: "Endurance" },
};

const INVENTORY_SLOT_COUNT = 10;

// ─── PlayerCharacter ──────────────────────────────────────────────────────────

function PlayerCharacter({ playerInfo }) {
  const stored = localStorage.getItem("userData");
  let char = null;
  if (stored) {
    try { char = JSON.parse(stored)?.character; } catch { }
  }

  const cls = char?.className || playerInfo?.class || "Neanderthal";
  const hairStyle = char?.hairStyle ?? playerInfo?.hairStyle;
  const beardStyle = char?.beardStyle ?? playerInfo?.beardStyle;

  return (
    <PlayerPortrait
      className={cls}
      hairStyle={hairStyle}
      beardStyle={beardStyle}
    />
  );
}

// ─── EquipSlot ────────────────────────────────────────────────────────────────

function EquipSlot({ slotKey, equippedItem, onClick }) {
  const slotData = SLOT_LABELS[slotKey] || { label: slotKey };
  const { label } = slotData;
  const rarity = (equippedItem?.rarity || "common").toLowerCase();
  const isEmpty = !equippedItem;

  return (
    <button
      onClick={onClick}
      title={equippedItem ? equippedItem.name : label}
      style={{
        borderColor: isEmpty ? "rgba(120,85,50,0.35)" : RARITY_COLOR[rarity],
        boxShadow: isEmpty ? "none" : `0 0 8px ${RARITY_GLOW[rarity]}`,
      }}
      className="relative flex items-center justify-center w-full h-20 rounded-lg border-2 bg-stone-950/60 backdrop-blur-sm transition-all duration-150 hover:scale-105 p-1"
    >
      {equippedItem ? (
        <img
          src={resolveItemImagePath(equippedItem)}
          alt={equippedItem.name}
          className="w-14 h-14 object-contain"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <span className="text-stone-700 text-[10px] italic uppercase tracking-widest">{label}</span>
      )}
    </button>
  );
}


// ─── ActionMenu ───────────────────────────────────────────────────────────────

const ACTION_DEFS = {
  equip: { label: "Equip", color: "#60a5fa" },
  unequip: { label: "Unequip", color: "#f97316" },
  sell: { label: "Sell", color: "#fbbf24" },
};

function ActionMenu({ item, actions, position, onConfirm, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const top = Math.min(position.y, window.innerHeight - 180);
  const left = Math.min(position.x, window.innerWidth - 190);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top, left, zIndex: 9999 }}
      className="bg-stone-950 border border-amber-900/50 rounded-xl shadow-2xl p-2 min-w-[170px]"
    >
      <div className="text-amber-400 text-xs font-bold px-2 py-1 border-b border-stone-800 mb-1 truncate">
        {item.name}
      </div>
      {actions.map((act) => (
        <button
          key={act}
          onClick={() => onConfirm(act)}
          style={{ color: ACTION_DEFS[act]?.color || "#fff" }}
          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-stone-800 transition-colors font-medium"
        >
          {ACTION_DEFS[act]?.label || act}
        </button>
      ))}
      <button
        onClick={onClose}
        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-800 text-stone-500 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold border pointer-events-none"
      style={{
        background: isError ? "#3b0a0a" : "#0a1f0a",
        borderColor: isError ? "#ef4444" : "#22c55e",
        color: isError ? "#fca5a5" : "#86efac",
      }}
    >
      {toast.msg}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ title, children }) {
  return (
    <div
      className="rounded-2xl border border-stone-800/50 p-4"
      style={{ background: "rgba(14,7,2,0.88)", backdropFilter: "blur(8px)" }}
    >
      {title && (
        <div className="text-amber-700/60 text-[10px] font-semibold tracking-widest uppercase mb-3">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Inventory = () => {
  const [inventory, setInventory] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { inventory, playerInfo } = await loadInventoryPage();
      setInventory(inventory);
      setPlayerInfo(playerInfo);
    } catch (err) {
      if (err instanceof AuthError) {
        showToast("Not logged in!", "error");
      } else {
        showToast("Load error: " + err.message, "error");
      }
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const ud = JSON.parse(stored);
        if (ud.character) {
          setPlayerInfo({
            name: ud.character.name || ud.nickname || "Player",
            class: ud.character.specie_name || "Neanderthal",
            hairStyle: ud.character.hair_style || 0,
            beardStyle: ud.character.beard_style || 0,
            lvl: 1, xp: 0, xpForNext: 100,
            stats: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
          });
        }
      } catch { }
    }
    load();
  }, [load]);

  const openActionMenu = useCallback((item, actions, slot, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({ item, actions, slot, position: { x: rect.right + 10, y: rect.top } });
  }, []);

  const confirmAction = useCallback(async (action) => {
    if (busy || !actionMenu) return;
    const { item, slot } = actionMenu;
    setActionMenu(null);
    setBusy(true);
    try {
      if (action === "equip") {
        const targetSlot = resolveEquipSlot(item);
        if (!targetSlot) throw new Error("This item cannot be equipped");
        await equipItem(targetSlot, item.id);
        showToast(`${item.name} equipped`);
      } else if (action === "unequip") {
        await unequipItem(slot);
        showToast("Item unequipped");
      } else if (action === "sell") {
        const res = await sellItem(item.type, item.id, 1);
        showToast(res.message);
      }
      await load();
    } catch (err) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, actionMenu, showToast, load]);

  const getEquippedItem = (slotKey) => {
    const eqItem = inventory?.equipped?.[slotKey];
    // With the new PHP logic, equipped slots store the full item object instead of an integer ID.
    // If it's a legacy INT ID, fallback to finding it in items (though our items won't contain it anymore).
    if (eqItem && typeof eqItem === "object") {
      return eqItem;
    }
    return eqItem ? (inventory.items.find((i) => i.id === eqItem) ?? null) : null;
  };

  // Build the set of equipped item IDs to exclude from the grid
  const equippedItemIds = new Set(
    Object.values(inventory?.equipped || {}).filter(Boolean).map(e => e?.id).filter(Boolean)
  );
  const slots = Array.from({ length: INVENTORY_SLOT_COUNT }, (_, i) => {
    // Filter out equipped items so they only appear in their slots
    const unequippedItems = (inventory?.items || []).filter(item => !equippedItemIds.has(item.id));
    return unequippedItems[i] ?? null;
  });

  const leftSlots = ["weapon", "armor_cap", "armor_plate"];
  const rightSlots = ["armor_leggings", "armor_boots"];

  return (
    <GameLayout currency={inventory?.currency}>
      {/* Background blur */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "rgba(8,5,2,0.58)", backdropFilter: "blur(7px)" }}
      />

      <Toast toast={toast} />

      {actionMenu && (
        <ActionMenu
          item={actionMenu.item}
          actions={actionMenu.actions}
          position={actionMenu.position}
          onConfirm={confirmAction}
          onClose={() => setActionMenu(null)}
        />
      )}

      {/* Full-width container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-widest text-amber-400 uppercase">
            Equipment &amp; Bag
          </h1>
          {playerInfo && (
            <span className="text-stone-400 text-sm">
              {playerInfo.name}
            </span>
          )}
          {inventory && (
            <span className="ml-auto text-xs text-stone-500">
              📦 {inventory.used}/{inventory.capacity}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-72">
            <div className="text-amber-600/70 animate-pulse text-lg tracking-widest">
              Loading...
            </div>
          </div>
        ) : (
          /* Two-column layout: character panel (left) + bag panel (right) */
          <div className="grid grid-cols-[1fr_1fr] gap-5">

            {/* ══ LEFT: Character + equipment + stats ══════════════════════ */}
            <div className="flex flex-col gap-4">

              {/* Portrait panel */}
              <div
                className="rounded-2xl border border-stone-800/50 p-4"
                style={{ background: "rgba(14,7,2,0.88)", backdropFilter: "blur(8px)" }}
              >
                {/* 3-col: left slots | portrait | right slots */}
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-3 items-stretch">

                  {/* Left slots */}
                  <div className="flex flex-col gap-2 justify-around">
                    {leftSlots.map((slotKey) => {
                      const eqItem = getEquippedItem(slotKey);
                      return (
                        <EquipSlot
                          key={slotKey}
                          slotKey={slotKey}
                          equippedItem={eqItem}
                          onClick={eqItem
                            ? (e) => openActionMenu(eqItem, ["unequip"], slotKey, e)
                            : undefined
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Portrait */}
                  <div
                    className="relative rounded-xl border-4 border-amber-900/60 overflow-hidden shadow-2xl backdrop-blur-sm"
                    style={{
                      height: "275px",
                      background: "rgba(28, 25, 23, 0.7)",
                    }}
                  >
                    <PlayerCharacter playerInfo={playerInfo} />
                  </div>

                  {/* Right slots */}
                  <div className="flex flex-col gap-2 justify-around">
                    {rightSlots.map((slotKey) => {
                      const eqItem = getEquippedItem(slotKey);
                      return (
                        <EquipSlot
                          key={slotKey}
                          slotKey={slotKey}
                          equippedItem={eqItem}
                          onClick={eqItem
                            ? (e) => openActionMenu(eqItem, ["unequip"], slotKey, e)
                            : undefined
                          }
                        />
                      );
                    })}
                  </div>

                </div>

                {/* Level + XP bar */}
                {playerInfo && (
                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <span className="text-amber-400 text-sm font-bold">
                      Level {playerInfo.lvl}
                    </span>
                    <div className="w-full h-2 rounded-full bg-stone-900/80 border border-stone-700/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (playerInfo.xp / (playerInfo.xpForNext || 1)) * 100)}%`,
                          background: "linear-gradient(90deg, #b45309, #f59e0b)",
                          boxShadow: "0 0 6px rgba(251,191,36,0.5)",
                        }}
                      />
                    </div>
                    <span className="text-stone-500 text-[10px]">
                      {playerInfo.xp} / {playerInfo.xpForNext} XP
                    </span>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <Panel title="Statistics">
                <div className="flex flex-col gap-2.5">
                  {Object.entries(STAT_LABELS).map(([key, { label }]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-stone-400 text-sm flex-1">{label}</span>
                      <span className="text-amber-300 text-sm font-bold w-8 text-right">
                        {playerInfo?.stats?.[key] ?? 0}
                      </span>
                      <button
                        title="Coming soon"
                        className="w-6 h-6 rounded border border-amber-900/40 bg-stone-900 text-amber-700 text-sm flex items-center justify-center hover:border-amber-600 hover:text-amber-400 transition-colors opacity-50 hover:opacity-90"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Active Effects */}
              <Panel title="Active Effects">
                <div className="text-stone-600 text-sm italic">No active effects</div>
              </Panel>

            </div>

            {/* ══ RIGHT: Bag ═══════════════════════════════════════════════ */}
            <div className="flex flex-col gap-4">
              <Panel title="Bag">
                <div className="grid grid-cols-5 gap-3">
                  {slots.map((item, idx) => {
                    const actions = [];
                    if (item && isEquippable(item)) actions.push("equip");
                    if (item) actions.push("sell");
                    return (
                      <ItemSlotTile
                        key={idx}
                        item={item}
                        onClick={item ? (e) => openActionMenu(item, actions, null, e) : undefined}
                      />
                    );
                  })}
                </div>
              </Panel>
            </div>

          </div>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.25); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(180,120,40,0.5); }
      `}</style>
    </GameLayout>
  );
};

export default Inventory;