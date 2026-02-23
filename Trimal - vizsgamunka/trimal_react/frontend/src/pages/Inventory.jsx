// src/pages/Inventory.jsx
// Layout container for the inventory screen.
// All item logic and rendering is in src/models/Item.jsx.

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
  ItemSlotTile,
  ItemDetailRow,
} from "../models/Item";

// ─── Slot / stat display maps ─────────────────────────────────────────────────

const SLOT_LABELS = {
  weapon: { label: "Weapon" },
  armor_head: { label: "Helmet" },
  armor_chest: { label: "Chest" },
  armor_legs: { label: "Legs" },
  armor_feet: { label: "Boots" },
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
  if (!playerInfo) return null;
  const cls = playerInfo.class || "Neanderthal";
  const prefix = cls === "Sapiens" ? "s" : cls === "Floresiensis" ? "f" : "n";

  return (
    <div className="relative w-full h-full">
      <img
        src={`/src/assets/design/character/base_character/${prefix}_base.png`}
        alt="Character"
        className="absolute z-0 h-full w-auto object-contain bottom-0 left-0"
      />
      {playerInfo.hairStyle > 0 && (
        <img
          src={`/src/assets/design/character/hair/${prefix}-hair-${playerInfo.hairStyle}.png`}
          alt="Hair"
          className="absolute z-10 h-full w-auto object-contain bottom-0 left-0"
        />
      )}
      {playerInfo.beardStyle > 0 && (
        <img
          src={`/src/assets/design/character/beard/${prefix}-beard-${playerInfo.beardStyle}.png`}
          alt="Beard"
          className="absolute z-20 h-full w-auto object-contain bottom-0 left-0"
        />
      )}
    </div>
  );
}

// ─── EquipSlot ────────────────────────────────────────────────────────────────

function EquipSlot({ slotKey, equippedItem, onClick }) {
  const { label } = SLOT_LABELS[slotKey];
  const rarity = equippedItem?.rarity || "common";

  return (
    <button
      onClick={onClick}
      style={{
        borderColor: equippedItem ? RARITY_COLOR[rarity] : "rgba(120,85,50,0.4)",
        boxShadow: equippedItem ? `0 0 10px ${RARITY_GLOW[rarity]}` : "none",
      }}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 bg-stone-950/70 backdrop-blur-sm transition-all duration-200 hover:bg-stone-900/70"
    >
      <div className="flex flex-col items-start min-w-0">
        <span className="text-[10px] text-amber-600/60 uppercase tracking-widest leading-none">{label}</span>
        {equippedItem ? (
          <span className="text-xs font-semibold truncate" style={{ color: RARITY_COLOR[rarity] }}>
            {equippedItem.name}
          </span>
        ) : (
          <span className="text-xs text-stone-600 italic">Empty</span>
        )}
      </div>
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
      className="rounded-2xl border border-stone-800/50 p-3"
      style={{ background: "rgba(14,7,2,0.88)", backdropFilter: "blur(8px)" }}
    >
      {title && (
        <div className="text-amber-700/60 text-[10px] font-semibold tracking-widest uppercase mb-2">
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
    // Fallback character appearance from localStorage while API loads
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
    const eqId = inventory?.equipped?.[slotKey];
    return eqId ? (inventory.items.find((i) => i.id === eqId) ?? null) : null;
  };

  // Bag grid – always show INVENTORY_SLOT_COUNT tiles
  const slots = Array.from({ length: INVENTORY_SLOT_COUNT }, (_, i) =>
    inventory?.items?.[i] ?? null
  );

  return (
    <GameLayout>
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

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1
            className="text-2xl font-bold tracking-widest text-amber-400 uppercase"
            style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px rgba(251,191,36,0.35)" }}
          >
            Equipment &amp; Bag
          </h1>
          {playerInfo && (
            <span className="text-stone-400 text-sm">
              {playerInfo.name} · <span className="text-amber-600">{playerInfo.class}</span> · Level {playerInfo.lvl}
            </span>
          )}
          {inventory && (
            <span className="ml-auto text-xs text-stone-500">
              📦 {inventory.used}/{inventory.capacity} &nbsp;·&nbsp;
              💰 {inventory.currency?.normal ?? 0} &nbsp;·&nbsp;
              ✨ {inventory.currency?.spec ?? 0}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-72">
            <div
              className="text-amber-600/70 animate-pulse text-lg tracking-widest"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Loading...
            </div>
          </div>
        ) : (
          <div className="flex gap-5">

            {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-3 w-64 shrink-0">

              {/* Character portrait */}
              <div className="relative w-full h-48 md:h-56 bg-stone-900/70 rounded-xl border-4 border-amber-900/60 shadow-2xl p-2 backdrop-blur-sm overflow-hidden">
                <div className="relative w-full h-full">
                  <PlayerCharacter playerInfo={playerInfo} />
                </div>
                {playerInfo && (
                  <div className="absolute top-2 right-2 z-30 bg-stone-950/90 border border-amber-800/50 rounded-lg px-2 py-1 text-center">
                    <div className="text-amber-400 text-xs font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                      Lv.{playerInfo.lvl}
                    </div>
                    <div className="text-stone-500 text-[9px]">
                      {playerInfo.xp} / {playerInfo.xpForNext} XP
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment slots */}
              <Panel title="Equipment">
                <div className="flex flex-col gap-1.5">
                  {Object.keys(SLOT_LABELS).map((slotKey) => {
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
              </Panel>

              {/* Statistics */}
              <Panel title="Statistics">
                <div className="flex flex-col gap-2">
                  {Object.entries(STAT_LABELS).map(([key, { label }]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-stone-400 text-xs flex-1">{label}</span>
                      <span className="text-amber-300 text-xs font-bold w-6 text-right">
                        {playerInfo?.stats?.[key] ?? 0}
                      </span>
                      <button
                        title="Coming soon"
                        className="w-5 h-5 rounded border border-amber-900/40 bg-stone-900 text-amber-700 text-xs flex items-center justify-center hover:border-amber-600 hover:text-amber-400 transition-colors opacity-50 hover:opacity-90"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Active Effects */}
              <Panel title="Active Effects">
                <div className="text-stone-600 text-xs italic">No active effects</div>
              </Panel>

            </div>

            {/* ══ RIGHT PANEL ═════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col gap-3">

              {/* Bag grid – uses ItemSlotTile from Item.jsx */}
              <Panel title="Bag">
                <div className="grid grid-cols-5 gap-2.5">
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

              {/* Detailed item list – uses ItemDetailRow from Item.jsx */}
              {(inventory?.items?.length ?? 0) > 0 && (
                <Panel title="Item Details">
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {inventory.items.map((item, idx) => {
                      const isEquipped = Object.values(inventory.equipped ?? {}).includes(item.id);
                      const equippedSlot = isEquipped
                        ? Object.entries(inventory.equipped).find(([, v]) => v === item.id)?.[0]
                        : null;
                      const actions = [];
                      if (isEquipped) {
                        actions.push("unequip");
                      } else if (isEquippable(item)) {
                        actions.push("equip");
                      }
                      actions.push("sell");

                      return (
                        <ItemDetailRow
                          key={idx}
                          item={item}
                          isEquipped={isEquipped}
                          onClick={(e) => openActionMenu(item, actions, equippedSlot, e)}
                        />
                      );
                    })}
                  </div>
                </Panel>
              )}

            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.25); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(180,120,40,0.5); }
      `}</style>
    </GameLayout>
  );
};

export default Inventory;
