// src/pages/Inventory.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "../layouts/GameLayout";
import {
  loadInventoryPage,
  equipItem,
  unequipItem,
  sellItem,
  upgradeStat,
  useItem,
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
  health: { label: "Health" },
  strength: { label: "Strength" },
  agility: { label: "Agility" },
  luck: { label: "Luck" },
  resistance: { label: "Resistance" },
  armor: { label: "Armor" },
};

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

function ActiveBuffRow({ buff }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, buff.expires_at - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, buff.expires_at - Math.floor(Date.now() / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [buff.expires_at]);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  const timeStr = h > 0 ? `${h}h ${mins}m` : `${m}:${s.toString().padStart(2, '0')}`;

  const catColor = buff.category === 'health' ? 'text-red-400' : 'text-green-400';

  return (
    <div className="flex items-center gap-3 bg-stone-900/50 p-2 rounded-lg border border-stone-800">
      {buff.iconPath ? (
        <img src={`/src/assets/design/items/food/${buff.category}/${buff.iconPath}`} className="w-8 h-8 object-contain drop-shadow-md" />
      ) : (
        <span className="text-2xl">🍖</span>
      )}
      <div className="flex flex-col flex-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${catColor}`}>{buff.category} +{buff.percent}%</span>
        <span className="text-[10px] text-stone-500 font-mono">{timeLeft > 0 ? `${timeStr} remaining` : 'Expired'}</span>
      </div>
    </div>
  );
}

function EquipSlot({ slotKey, equippedItem, onClick, playerInfo }) {
  const slotData = SLOT_LABELS[slotKey] || { label: slotKey };
  const { label } = slotData;
  const rarity = (equippedItem?.rarity || "common").toLowerCase();
  const isEmpty = !equippedItem;
  const [hoverRect, setHoverRect] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Reset image error state when equipped item changes
  useEffect(() => {
    setImgError(false);
  }, [equippedItem]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={(e) => setHoverRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setHoverRect(null)}
    >
      <button
        onClick={onClick}
        title={equippedItem && !hoverRect ? equippedItem.name : isEmpty ? label : undefined}
        style={{
          borderColor: isEmpty ? "rgba(120,85,50,0.35)" : RARITY_COLOR[rarity],
          boxShadow: isEmpty ? "none" : `0 0 8px ${RARITY_GLOW[rarity]}`,
        }}
        className="relative flex items-center justify-center w-full h-20 rounded-lg border-2 bg-stone-950/60 backdrop-blur-sm transition-all duration-150 hover:scale-105 p-1"
      >
        {equippedItem ? (
          !imgError ? (
            <img
              src={resolveItemImagePath(equippedItem)}
              alt={equippedItem.name}
              className="w-14 h-14 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-3xl">{getItemIcon(equippedItem)}</span>
          )
        ) : (
          <span className="text-stone-700 text-[10px] italic uppercase tracking-widest">{label}</span>
        )}
        {equippedItem?.elemental_buff && (
          <img
            src={`/src/assets/design/status_effects/status_indicators/status_${equippedItem.elemental_buff.type || 'poison'}.png`}
            alt={equippedItem.elemental_buff.label}
            title={equippedItem.elemental_buff.label}
            className="absolute top-1 left-1 w-4 h-4 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] z-10"
          />
        )}
      </button>

      {/* Hover description tooltip using Portal to avoid clipping */}
      {hoverRect && equippedItem && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{
            minWidth: "150px", maxWidth: "210px",
            left: hoverRect.left + (hoverRect.width / 2),
            top: hoverRect.top - 8,
            transform: "translate(-50%, -100%)",
            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.8))'
          }}
        >
          <div
            className="rounded-lg px-2 py-1 text-[13px] text-stone-200 leading-tight shadow-2xl border border-stone-700/70"
            style={{
              background: "rgba(12,7,2,0.97)",
              borderColor: RARITY_COLOR[rarity] + "55",
            }}
          >
            {/* Name */}
            <div
              className="text-[18px] font-title leading-tight mb-0.5"
              style={{ color: RARITY_COLOR[rarity] }}
            >
              {equippedItem.name}
            </div>
            {/* Rarity badge */}
            <div className="mb-0.5">
              <span
                className="text-[12px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{
                  color: RARITY_COLOR[rarity],
                  background: RARITY_COLOR[rarity] + "22",
                  border: `1px solid ${RARITY_COLOR[rarity]}44`,
                }}
              >
                {rarity}
              </span>
            </div>
            {/* Stats */}
            {equippedItem.type === "weapon" && (equippedItem.base_damage != null || equippedItem.weapon_damage != null) && (
              <div className="text-[14px] text-red-400 mb-1 flex flex-col gap-0.5">
                <span>Item Damage: {equippedItem.weapon_damage || equippedItem.base_damage}</span>
                <span className="text-stone-400 font-medium">Combat Damage: {Math.round((equippedItem.weapon_damage || equippedItem.base_damage) * 1.5 * (1 + ((playerInfo?.stats?.strength ?? 10) / 25)))}</span>
              </div>
            )}
            {/* Elemental Buff Badge */}
            {equippedItem.type === "weapon" && equippedItem.elemental_buff && (
              <div
                className="text-[13px] mb-1 px-1.5 py-0.5 rounded-md border flex flex-col gap-0.5"
                style={{ color: equippedItem.elemental_buff.color, borderColor: equippedItem.elemental_buff.color + '44', background: equippedItem.elemental_buff.color + '11' }}
              >
                <span className="flex items-center gap-1.5">
                  <img src={`/src/assets/design/status_effects/status_indicators/status_${equippedItem.elemental_buff.type || 'poison'}.png`} className="w-4 h-4 drop-shadow-sm" alt="icon" />
                  {equippedItem.elemental_buff.label} — {equippedItem.elemental_buff.dmgPerTick} dmg × {equippedItem.elemental_buff.ticks} turns
                </span>
                <span className="text-[12px] opacity-80 leading-tight">{equippedItem.elemental_buff.description}</span>
              </div>
            )}
            {equippedItem.type === "armor" && equippedItem.armor_point != null && (
              <div className="text-[14px] text-blue-400 mb-1 flex flex-col gap-0.5">
                <span>Item Armor: {equippedItem.armor_point}</span>
                <span className="text-stone-400 font-medium">Combat Defense: {equippedItem.armor_point + ((playerInfo?.lvl ?? 1) * 3)}</span>
              </div>
            )}
            {equippedItem.type === "food" && equippedItem.category && (
              <div className="text-[14px] text-green-400 mb-1 flex flex-col gap-0.5">
                <span>+{rarity === "legendary" ? "10" : rarity === "epic" ? "8" : "5"}% to {equippedItem.category}</span>
                <span className="text-stone-500 font-medium">Duration: {rarity === "legendary" ? "4h" : rarity === "epic" ? "2h" : "30m"}</span>
              </div>
            )}
            {/* Description */}
            {equippedItem.description && (
              <div className="text-stone-400 text-[13px] leading-tight pt-0.5 border-t border-stone-800">
                {equippedItem.description}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div
            className="mx-auto w-2 h-2 rotate-45 -mt-1 relative z-[99999]"
            style={{ background: "rgba(12,7,2,0.97)", borderRight: `1px solid ${RARITY_COLOR[rarity]}55`, borderBottom: `1px solid ${RARITY_COLOR[rarity]}55` }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}


// ─── ActionMenu ───────────────────────────────────────────────────────────────

const ACTION_DEFS = {
  equip: { label: "Equip", color: "#60a5fa" },
  unequip: { label: "Unequip", color: "#f97316" },
  sell: { label: "Sell", color: "#fbbf24" },
  use: { label: "Use", color: "#4ade80" },
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
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef(null);


  // TESZTELÉSHEZ: Vedd ki a kommentből az alábbi useEffect-et, hogy lásd a szintlépés animációt betöltéskor
  // useEffect(() => {
  //   setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 4000);
  // }, []);


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

      // Update local storage so next reload starts with correct level
      const stored = localStorage.getItem("userData");
      if (stored) {
        try {
          const ud = JSON.parse(stored);
          if (ud.character) {
            ud.character = { ...ud.character, ...playerInfo };
            localStorage.setItem("userData", JSON.stringify(ud));
          }
        } catch (e) { }
      }
    } catch (err) {
      if (err instanceof AuthError) {
        showToast("Not logged in!", "error");
        navigate("/");
      } else {
        showToast("Load error: " + err.message, "error");
      }
    }
    setLoading(false);
  }, [showToast, navigate]);

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
            lvl: ud.character.lvl || 1,
            xp: ud.character.xp || 0,
            xpForNext: ud.character.xpForNext || 100,
            stats: ud.character.stats || { strength: 5, agility: 5, luck: 5, resistance: 5 },
          });
        }
      } catch { }
    }
    load();
  }, [load]);

  useEffect(() => {
    if (playerInfo?.lvl) {
      if (prevLevelRef.current !== null && playerInfo.lvl > prevLevelRef.current) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 4000);
      }
      prevLevelRef.current = playerInfo.lvl;
    }
  }, [playerInfo?.lvl]);

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
      } else if (action === "use") {
        const res = await useItem(item.id);
        if (res.requireConfirmation) {
          if (window.confirm(res.message)) {
            const res2 = await useItem(item.id, true);
            showToast(res2.message);
          } else {
            return; // cancelled
          }
        } else {
          showToast(res.message);
        }
      }
      await load();
    } catch (err) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, actionMenu, showToast, load]);

  const handleUpgradeStat = useCallback(async (statKey) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await upgradeStat(statKey);
      showToast(res.message);
      await load();
    } catch (err) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, showToast, load]);

  const getEquippedItem = (slotKey) => {
    const eqItem = inventory?.equipped?.[slotKey];
    if (eqItem && typeof eqItem === "object") {
      return eqItem;
    }
    return eqItem ? (inventory.items.find((i) => i.id === eqItem) ?? null) : null;
  };

  const displayCap = Math.floor((inventory?.capacity || 200) / 10);

  const unequippedItems = [];
  (inventory?.items || []).forEach(item => {
    if ((item.type === 'weapon' || item.type === 'armor') && item.quantity > 1) {
      for (let i = 0; i < item.quantity; i++) {
        unequippedItems.push({ ...item, quantity: 1, _virtualId: `${item.id}-${i}` });
      }
    } else {
      unequippedItems.push({ ...item, _virtualId: item.id.toString() });
    }
  });

  const slots = Array.from({ length: displayCap }, (_, i) => {
    return unequippedItems[i] ?? null;
  });

  const leftSlots = ["weapon", "armor_cap", "armor_plate"];
  const rightSlots = ["armor_leggings", "armor_boots"];

  return (
    <GameLayout currency={inventory?.currency} contentAlign="start">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 1.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <span className="text-amber-500 font-title text-8xl uppercase tracking-[0.1em]">
              Level Up!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-fit min-h-full w-full relative flex flex-col items-center">

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
        <div className="relative z-10 w-full max-w-7xl px-6 py-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center gap-4 flex-wrap pb-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
              Equipment &amp; Bag
            </h1>
            {playerInfo && (
              <span className="text-stone-300 tracking-wider text-xs md:text-sm drop-shadow-[0_0_10px_rgba(0,0,0,1)] mt-1">
                {playerInfo.name}
              </span>
            )}
            {inventory && (
              <span className="ml-auto text-xs text-stone-500">
                📦 {inventory.used || 0}/{inventory.capacity || 200}
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
            /* Layout: stacked on mobile, two-column on large screens */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">

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
                            playerInfo={playerInfo}
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
                            playerInfo={playerInfo}
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
                    {Object.entries(STAT_LABELS).map(([key, { label }]) => {
                      let currentVal = playerInfo?.stats?.[key] ?? 0;
                      if (key === 'armor') {
                        const equippedArmor = Object.values(inventory?.equipped || {}).filter(item => item && item.type === 'armor');
                        currentVal = equippedArmor.reduce((sum, item) => sum + (item.armor_point || 0), 0);
                      }
                      const cost = Math.max(10, Math.floor(currentVal * currentVal * 0.16 + (playerInfo?.lvl || 1) * 2));
                      const canUpgrade = key !== 'armor';
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-stone-400 text-sm flex-1">{label}</span>
                          <span className="text-amber-300 text-sm font-bold w-8 text-right" title={key === 'armor' ? `Effective Armor: ${currentVal + (playerInfo?.lvl || 1) * 3}` : ""}>
                            {currentVal}
                          </span>
                          {canUpgrade ? (
                            <button
                              onClick={() => handleUpgradeStat(key)}
                              title={`Upgrade ${label} for ${cost} river pebble(s)`}
                              disabled={busy}
                              className="w-6 h-6 rounded border border-amber-900/40 bg-stone-900 text-amber-700 text-sm flex items-center justify-center hover:border-amber-600 hover:text-amber-400 transition-colors opacity-50 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          ) : (
                            <div className="w-6 h-6" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Active Effects */}
                <Panel title="Active Effects">
                  {(!inventory?.active_buffs || inventory.active_buffs.length === 0) ? (
                    <div className="text-stone-600 text-sm italic">No active effects</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {inventory.active_buffs.map((buff, i) => (
                        <ActiveBuffRow key={i} buff={buff} />
                      ))}
                    </div>
                  )}
                </Panel>

              </div>

              {/* ══ RIGHT: Bag ═══════════════════════════════════════════════ */}
              <div className="flex flex-col gap-4">
                <Panel title="Bag">
                  <div className="grid grid-cols-5 gap-3">
                    {slots.map((item, idx) => {
                      const actions = [];
                      if (item && isEquippable(item)) actions.push("equip");
                      if (item && item.type === "food") actions.push("use");
                      if (item) actions.push("sell");

                      // Find the matching equipped item for comparison
                      let equippedForComparison = undefined;
                      if (item && (item.type === 'weapon' || item.type === 'armor')) {
                        const targetSlot = resolveEquipSlot(item);
                        if (targetSlot) {
                          equippedForComparison = getEquippedItem(targetSlot) ?? null;
                        }
                      }

                      return (
                        <ItemSlotTile
                          key={idx}
                          item={item}
                          playerInfo={playerInfo}
                          equipped={equippedForComparison}
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
      </div>
    </GameLayout>
  );
};

export default Inventory;