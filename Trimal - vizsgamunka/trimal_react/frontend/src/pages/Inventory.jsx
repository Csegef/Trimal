// src/pages/Inventory.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import {
  loadInventoryPage,
  equipItem,
  unequipItem,
  sellItem,
  resolveEquipSlot,
  AuthError,
} from "../api/inventoryApi";

// ─── Konstansok ──────────────────────────────────────────────────────────────

const RARITY_COLOR = {
  common:    "#9ca3af",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

const RARITY_GLOW = {
  common:    "rgba(156,163,175,0.35)",
  uncommon:  "rgba(74,222,128,0.35)",
  rare:      "rgba(96,165,250,0.35)",
  epic:      "rgba(192,132,252,0.35)",
  legendary: "rgba(251,191,36,0.45)",
};

const SLOT_LABELS = {
  weapon:      { icon: "⚔",  label: "Fegyver"  },
  armor_head:  { icon: "🪖", label: "Sisak"    },
  armor_chest: { icon: "🛡", label: "Mellvért" },
  armor_legs:  { icon: "🩳", label: "Lábvért"  },
  armor_feet:  { icon: "👢", label: "Cipő"     },
};

const STAT_LABELS = {
  strength:     { label: "Erő",       icon: "💪" },
  agility:      { label: "Gyorsaság", icon: "🏃" },
  intelligence: { label: "Értelem",   icon: "🧠" },
  endurance:    { label: "Kitartás",  icon: "🫀" },
};

const ITEM_TYPE_ICON = {
  weapon: "⚔",
  armor:  "🛡",
  food:   "🍖",
  misc:   "📦",
};

const INVENTORY_SLOT_COUNT = 10;

// ─── PlayerCharacter ─────────────────────────────────────────────────────────

function PlayerCharacter({ playerInfo }) {
  if (!playerInfo) return null;
  const cls = playerInfo.class || "Neanderthal";
  const prefix = cls === "Sapiens" ? "s" : cls === "Floresiensis" ? "f" : "n";

  return (
    <div className="relative w-full h-full">
      <img
        src={`/src/assets/design/character/base_character/${prefix}_base.png`}
        alt="Karakter"
        className="absolute z-0 h-full w-auto object-contain bottom-0 left-1/2 -translate-x-1/2"
      />
      {playerInfo.hairStyle > 0 && (
        <img
          src={`/src/assets/design/character/hair/${prefix}-hair-${playerInfo.hairStyle}.png`}
          alt="Haj"
          className="absolute z-10 h-full w-auto object-contain bottom-0 left-1/2 -translate-x-1/2"
        />
      )}
      {playerInfo.beardStyle > 0 && (
        <img
          src={`/src/assets/design/character/beard/${prefix}-beard-${playerInfo.beardStyle}.png`}
          alt="Szakáll"
          className="absolute z-20 h-full w-auto object-contain bottom-0 left-1/2 -translate-x-1/2"
        />
      )}
    </div>
  );
}

// ─── EquipSlot ───────────────────────────────────────────────────────────────

function EquipSlot({ slotKey, equippedItem, onClick }) {
  const { icon, label } = SLOT_LABELS[slotKey];
  const rarity = equippedItem?.rarity || "common";

  return (
    <button
      onClick={onClick}
      style={{
        borderColor: equippedItem ? RARITY_COLOR[rarity] : "rgba(120,85,50,0.4)",
        boxShadow:   equippedItem ? `0 0 10px ${RARITY_GLOW[rarity]}` : "none",
      }}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 bg-stone-950/70 backdrop-blur-sm transition-all duration-200 hover:bg-stone-900/70"
    >
      <span className="text-base">{icon}</span>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-[10px] text-amber-600/60 uppercase tracking-widest leading-none">{label}</span>
        {equippedItem ? (
          <span className="text-xs font-semibold truncate" style={{ color: RARITY_COLOR[rarity] }}>
            {equippedItem.name}
          </span>
        ) : (
          <span className="text-xs text-stone-600 italic">Üres</span>
        )}
      </div>
    </button>
  );
}

// ─── InventorySlot ───────────────────────────────────────────────────────────

function InventorySlot({ item, onClick }) {
  if (!item) {
    return (
      <div className="w-full aspect-square rounded-lg border border-stone-800/40 bg-stone-950/30 flex items-center justify-center select-none">
        <span className="text-stone-800 text-lg">◇</span>
      </div>
    );
  }

  const rarity = item.rarity || "common";

  return (
    <button
      onClick={onClick}
      style={{
        borderColor: RARITY_COLOR[rarity],
        boxShadow:   `0 0 8px ${RARITY_GLOW[rarity]}`,
      }}
      className="relative w-full aspect-square rounded-lg border-2 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1 p-1 hover:scale-105 transition-all duration-150"
    >
      {item.iconPath ? (
        <img
          src={item.iconPath}
          alt={item.name}
          className="w-8 h-8 object-contain"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <span className="text-xl">{ITEM_TYPE_ICON[item.type] ?? "📦"}</span>
      )}
      <span
        className="text-[9px] font-bold text-center leading-tight truncate w-full px-0.5"
        style={{ color: RARITY_COLOR[rarity] }}
      >
        {item.name}
      </span>
      {item.quantity > 1 && (
        <span className="absolute bottom-1 right-1 text-[9px] text-amber-400 font-bold bg-stone-900/80 px-1 rounded">
          x{item.quantity}
        </span>
      )}
    </button>
  );
}

// ─── ActionMenu ──────────────────────────────────────────────────────────────

const ACTION_DEFS = {
  equip:   { label: "Felszerel", color: "#60a5fa" },
  unequip: { label: "Levesz",   color: "#f97316" },
  sell:    { label: "Elad",     color: "#fbbf24" },
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

  const top  = Math.min(position.y, window.innerHeight - 180);
  const left = Math.min(position.x, window.innerWidth  - 190);

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
        Mégse
      </button>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold border pointer-events-none"
      style={{
        background:  isError ? "#3b0a0a" : "#0a1f0a",
        borderColor: isError ? "#ef4444" : "#22c55e",
        color:       isError ? "#fca5a5" : "#86efac",
      }}
    >
      {toast.msg}
    </div>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

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

// ─── Fő komponens ─────────────────────────────────────────────────────────────

const Inventory = () => {
  const [inventory,  setInventory]  = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [actionMenu, setActionMenu] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [busy,       setBusy]       = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Adatok betöltése ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { inventory, playerInfo } = await loadInventoryPage();
      setInventory(inventory);
      setPlayerInfo(playerInfo);
    } catch (err) {
      if (err instanceof AuthError) {
        showToast("Nincs bejelentkezve!", "error");
      } else {
        showToast("Betöltési hiba: " + err.message, "error");
      }
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    // localStorage fallback karakter kinézethez amíg az API tölt
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const ud = JSON.parse(stored);
        if (ud.character) {
          setPlayerInfo({
            name:       ud.character.name || ud.nickname || "Játékos",
            class:      ud.character.specie_name || "Neanderthal",
            hairStyle:  ud.character.hair_style || 0,
            beardStyle: ud.character.beard_style || 0,
            lvl: 1, xp: 0, xpForNext: 100,
            stats: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
          });
        }
      } catch {}
    }
    load();
  }, [load]);

  // ── Action menu ────────────────────────────────────────────────────────────
  const openActionMenu = useCallback((item, actions, slot, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({
      item, actions, slot,
      position: { x: rect.right + 10, y: rect.top },
    });
  }, []);

  // ── Művelet végrehajtása ───────────────────────────────────────────────────
  const confirmAction = useCallback(async (action) => {
    if (busy || !actionMenu) return;
    const { item, slot } = actionMenu;
    setActionMenu(null);
    setBusy(true);

    try {
      if (action === "equip") {
        const targetSlot = resolveEquipSlot(item);
        if (!targetSlot) throw new Error("Ezt a tárgyat nem lehet felszerelni");
        await equipItem(targetSlot, item.id);
        showToast(`${item.name} felszerelve`);
      } else if (action === "unequip") {
        await unequipItem(slot);
        showToast("Tárgy levéve");
      } else if (action === "sell") {
        const res = await sellItem(item.type, item.id, 1);
        showToast(res.message);
      }
      await load();
    } catch (err) {
      showToast(err.message || "Hiba történt", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, actionMenu, showToast, load]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getEquippedItem = (slotKey) => {
    const eqId = inventory?.equipped?.[slotKey];
    return eqId ? (inventory.items.find((i) => i.id === eqId) ?? null) : null;
  };

  const slots = Array.from({ length: INVENTORY_SLOT_COUNT }, (_, i) =>
    inventory?.items?.[i] ?? null
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <GameLayout>

      {/* Háttér homályosítás */}
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

        {/* Fejléc */}
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1
            className="text-2xl font-bold tracking-widest text-amber-400 uppercase"
            style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px rgba(251,191,36,0.35)" }}
          >
            Felszerelés & Táska
          </h1>
          {playerInfo && (
            <span className="text-stone-400 text-sm">
              {playerInfo.name} · <span className="text-amber-600">{playerInfo.class}</span> · Szint {playerInfo.lvl}
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
              Betöltés...
            </div>
          </div>
        ) : (
          <div className="flex gap-5">

            {/* ══ BAL PANEL ══════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-3 w-64 shrink-0">

              {/* Karakter kép */}
              <div
                className="relative rounded-2xl border-2 overflow-hidden"
                style={{
                  height: "300px",
                  borderColor: "rgba(180,120,40,0.35)",
                  background: "linear-gradient(180deg, rgba(28,14,4,0.97) 0%, rgba(12,6,2,0.99) 100%)",
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.85), 0 0 18px rgba(100,65,15,0.18)",
                }}
              >
                {/* Sarokdíszek */}
                {[
                  "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-5 h-5 border-amber-700/50 z-30 ${cls}`} />
                ))}

                <PlayerCharacter playerInfo={playerInfo} />

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

              {/* Felszerelési slotok */}
              <Panel title="Felszerelés">
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

              {/* Statisztikák */}
              <Panel title="Statisztikák">
                <div className="flex flex-col gap-2">
                  {Object.entries(STAT_LABELS).map(([key, { label, icon }]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm w-5">{icon}</span>
                      <span className="text-stone-400 text-xs flex-1">{label}</span>
                      <span className="text-amber-300 text-xs font-bold w-6 text-right">
                        {playerInfo?.stats?.[key] ?? 0}
                      </span>
                      <button
                        title="Hamarosan elérhető"
                        className="w-5 h-5 rounded border border-amber-900/40 bg-stone-900 text-amber-700 text-xs flex items-center justify-center hover:border-amber-600 hover:text-amber-400 transition-colors opacity-50 hover:opacity-90"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Aktív effektek */}
              <Panel title="Aktív Effektek">
                <div className="text-stone-600 text-xs italic">Nincsenek aktív effektek</div>
              </Panel>

            </div>

            {/* ══ JOBB PANEL ═════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col gap-3">

              {/* 10 slot rács */}
              <Panel title="Táska">
                <div className="grid grid-cols-5 gap-2.5">
                  {slots.map((item, idx) => {
                    const actions = [];
                    if (item?.type === "weapon" || item?.type === "armor") actions.push("equip");
                    if (item) actions.push("sell");

                    return (
                      <InventorySlot
                        key={idx}
                        item={item}
                        onClick={item ? (e) => openActionMenu(item, actions, null, e) : undefined}
                      />
                    );
                  })}
                </div>
              </Panel>

              {/* Részletes lista */}
              {(inventory?.items?.length ?? 0) > 0 && (
                <Panel title="Tárgyak részletei">
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {inventory.items.map((item, idx) => {
                      const rarity = item.rarity || "common";
                      const isEquipped = Object.values(inventory.equipped ?? {}).includes(item.id);
                      const actions = [];
                      if (isEquipped) {
                        actions.push("unequip");
                      } else if (item.type === "weapon" || item.type === "armor") {
                        actions.push("equip");
                      }
                      actions.push("sell");

                      const equippedSlot = isEquipped
                        ? Object.entries(inventory.equipped).find(([, v]) => v === item.id)?.[0]
                        : null;

                      return (
                        <button
                          key={idx}
                          onClick={(e) => openActionMenu(item, actions, equippedSlot, e)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 border text-left hover:bg-stone-900/40 transition-colors w-full"
                          style={{
                            borderColor: RARITY_COLOR[rarity] + "44",
                            background: "rgba(18,10,3,0.55)",
                          }}
                        >
                          <span className="text-base">{ITEM_TYPE_ICON[item.type] ?? "📦"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate" style={{ color: RARITY_COLOR[rarity] }}>
                                {item.name}
                              </span>
                              {isEquipped && (
                                <span className="text-[9px] bg-amber-900/40 border border-amber-700/40 text-amber-500 px-1 rounded shrink-0">
                                  ✓ felszerelve
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-amber-400">x{item.quantity}</div>
                            <div className="text-[10px] text-stone-600">💰 {item.sell_price ?? 0}</div>
                          </div>
                        </button>
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
