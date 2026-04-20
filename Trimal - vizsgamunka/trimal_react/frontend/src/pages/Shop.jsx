import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import GameLayout from "../layouts/GameLayout";
import { RARITY_COLOR, RARITY_GLOW, resolveItemImagePath } from "../models/Item";

const loadShopPage = async (shopType) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const [shopRes, invRes] = await Promise.all([
    fetch(`/api/shop/${shopType}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    fetch(`/api/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  ]);

  if (!shopRes.success) throw new Error(shopRes.message || "Failed to load shop");
  if (!invRes.success) throw new Error(invRes.message || "Failed to load inventory");

  const ud = JSON.parse(localStorage.getItem("userData") || "{}");
  const playerInfo = {
    name: ud.character?.name || ud.nickname || "Player",
    class: ud.character?.specie_name || "Neanderthal",
    hairStyle: ud.character?.hair_style || 0,
    beardStyle: ud.character?.beard_style || 0,
    lvl: ud.character?.lvl || 1,
    stats: {
      strength: ud.character?.base_strength || 10,
      resistance: ud.character?.base_resistance || 10
    }
  };

  return {
    shopItems: shopRes.shopItems,
    inventory: invRes.data,
    playerInfo
  };
};

const buyItem = async (shopId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/shop/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ shopId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Purchase failed");
  return data;
};

const rerollShopItems = async (shopType) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/shop/reroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ shopType })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Reroll failed");
  return data;
};

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

function ShopItemTile({ item, onClick, playerInfo, inventory }) {
  const [hoverRect, setHoverRect] = useState(null);
  const [imgError, setImgError] = useState(false);

  const shopItem = item?.item;
  const rarity = (shopItem?.rarity || "common").toLowerCase();
  const isPurchased = item?.purchased;

  if (!item || !shopItem) {
    return (
      <div className="relative w-full aspect-square rounded-xl border-2 border-stone-800/40 bg-stone-900/40 flex items-center justify-center pointer-events-none">
        <span className="text-stone-700/30 text-[10px] tracking-widest font-bold rotate-45">EMPTY</span>
      </div>
    );
  }

  // Comparison against equipped item
  const getShopComparison = () => {
    if (!inventory?.equipped || !shopItem) return null;
    if (shopItem.type === 'weapon') {
      const eq = inventory.equipped.weapon;
      if (!eq || typeof eq !== 'object') return { stat: 'damage', diff: 0, current: 0, next: shopItem.weapon_damage || shopItem.base_damage || 0, noEquipped: true };
      const eqDmg = eq.weapon_damage || eq.base_damage || 0;
      const itemDmg = shopItem.weapon_damage || shopItem.base_damage || 0;
      return { stat: 'damage', diff: itemDmg - eqDmg, current: eqDmg, next: itemDmg, eqElemBuff: eq.elemental_buff };
    }
    if (shopItem.type === 'armor') {
      // Find which armor slot this goes into
      const icon = (shopItem.iconPath || "").toLowerCase();
      const cat = (shopItem.category || "").toLowerCase();
      let slotKey = 'armor_plate';
      if (icon.includes("cap") || icon.includes("helmet") || icon.includes("head") ||
        cat.includes("cap") || cat.includes("helmet") || cat.includes("head")) slotKey = "armor_cap";
      else if (icon.includes("boots") || icon.includes("boot") || icon.includes("feet") || icon.includes("shoe") ||
        cat.includes("boots") || cat.includes("boot") || cat.includes("feet") || cat.includes("shoe")) slotKey = "armor_boots";
      else if (icon.includes("leggings") || icon.includes("pant") || (icon.includes("leg") && !icon.includes("legendary")) ||
        cat.includes("leggings") || cat.includes("pant") || (cat.includes("leg") && !cat.includes("legendary"))) slotKey = "armor_leggings";

      const eq = inventory.equipped[slotKey];
      if (!eq || typeof eq !== 'object') return { stat: 'armor', diff: 0, current: 0, next: shopItem.armor_point || 0, noEquipped: true };
      const eqArmor = eq.armor_point || 0;
      const itemArmor = shopItem.armor_point || 0;
      return { stat: 'armor', diff: itemArmor - eqArmor, current: eqArmor, next: itemArmor };
    }
    return null;
  };
  const comparison = getShopComparison();
  const elemBuff = shopItem.elemental_buff;

  return (
    <div
      className="relative w-full aspect-square"
      onMouseEnter={(e) => setHoverRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setHoverRect(null)}
    >
      <button
        onClick={onClick}
        disabled={isPurchased}
        title={!hoverRect ? shopItem.name : undefined}
        style={{
          borderColor: RARITY_COLOR[rarity],
          boxShadow: isPurchased ? "none" : `inset 0 0 12px ${RARITY_GLOW[rarity]}`,
          opacity: isPurchased ? 0.4 : 1,
          filter: isPurchased ? "grayscale(100%)" : "none"
        }}
        className={`relative flex items-center justify-center w-full h-full rounded-xl border-2 bg-stone-950/80 transition-all duration-150 ${isPurchased ? "cursor-not-allowed" : "hover:scale-[1.02] hover:brightness-110"}`}
      >
        {!imgError ? (
          <img
            src={resolveItemImagePath(shopItem)}
            alt={shopItem.name}
            className="w-4/5 h-4/5 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-3xl text-stone-500">?</span>
        )}

        {!isPurchased && (
          <div className="absolute bottom-1 right-1 bg-stone-900/90 rounded px-1.5 py-0.5 text-[18px] font-bold border border-stone-700/50 flex flex-col items-end gap-0.5">
            {shopItem.buy_price_normal > 0 ? (
              <span className="text-amber-400 flex items-center gap-1">
                {shopItem.buy_price_normal} {<img src="/src/assets/design/currency/currency-normal.png" alt="Stone" className="w-5 h-5 drop-shadow" />}
              </span>
            ) : null}
            {shopItem.buy_price_spec > 0 ? (
              <span className="text-blue-400 flex items-center gap-1">
                {shopItem.buy_price_spec} {<img src="/src/assets/design/currency/currency-spec.png" alt="Shell" className="w-5 h-5 drop-shadow" />}
              </span>
            ) : null}
          </div>
        )}
        {/* Elemental indicator (Top-Left) */}
        {!isPurchased && elemBuff && (
          <img
            src={`/src/assets/design/status_effects/status_indicators/status_${elemBuff.type || 'poison'}.png`}
            alt={elemBuff.label}
            title={elemBuff.label}
            className="absolute top-1.5 left-1.5 w-5 h-5 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] z-10"
          />
        )}
        {/* Comparison arrow (Top-Right) */}
        {!isPurchased && comparison && !comparison.noEquipped && (
          <img
            src={`/src/assets/design/status_effects/status_indicators/status_${comparison.diff > 0 ? 'up' : comparison.diff < 0 ? 'down' : 'neutral'}.png`}
            alt={comparison.diff > 0 ? 'Up' : comparison.diff < 0 ? 'Down' : 'Neutral'}
            className="absolute top-1.5 right-1.5 w-5 h-5 drop-shadow-md z-10"
          />
        )}
        {isPurchased ? (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 font-bold text-red-500 tracking-widest">
            SOLD
          </div>
        ) : null}
      </button>

      {hoverRect && !isPurchased ? createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            minWidth: "150px", maxWidth: "210px",
            left: hoverRect.left + (hoverRect.width / 2),
            top: hoverRect.top - 10,
            transform: "translate(-50%, -100%)"
          }}
        >
          <div
            className="rounded-lg px-2 py-1 text-[13px] text-stone-300 leading-tight shadow-2xl border border-stone-700/70"
            style={{
              background: "rgba(12,7,2,0.95)",
              borderColor: RARITY_COLOR[rarity] + "66",
            }}
          >
            <div className="text-[18px] font-title leading-tight mb-0.5" style={{ color: RARITY_COLOR[rarity] }}>
              {shopItem.name}
            </div>
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
            {shopItem.type === "weapon" && (shopItem.base_damage != null || shopItem.weapon_damage != null) && (
              <div className="text-[14px] text-red-400 mb-1 flex flex-col gap-0.5">
                <span>Item Damage: {shopItem.weapon_damage || shopItem.base_damage}</span>
                <span className="text-stone-400 font-medium">Combat Damage: {Math.round((shopItem.weapon_damage || shopItem.base_damage) * 1.5 * (1 + ((playerInfo?.stats?.strength ?? 10) / 25)))}</span>
              </div>
            )}
            {/* Elemental Buff Badge */}
            {shopItem.type === "weapon" && elemBuff && (
              <div
                className="text-[13px] mb-1 px-1.5 py-0.5 rounded-md border flex flex-col gap-0.5"
                style={{ color: elemBuff.color, borderColor: elemBuff.color + '44', background: elemBuff.color + '11' }}
              >
                <span className="flex items-center gap-1.5">
                  <img src={`/src/assets/design/status_effects/status_indicators/status_${elemBuff.type || 'poison'}.png`} className="w-4 h-4 drop-shadow-sm" alt="icon" />
                  {elemBuff.label} — {elemBuff.dmgPerTick} dmg × {elemBuff.ticks} turns
                </span>
                <span className="text-[12px] opacity-80 leading-tight">{elemBuff.description}</span>
              </div>
            )}
            {shopItem.type === "armor" && shopItem.armor_point != null && (
              <div className="text-[14px] text-blue-400 mb-1 flex flex-col gap-0.5">
                <span>Item Armor: {shopItem.armor_point}</span>
                <span className="text-stone-400 font-medium">Combat Defense: {shopItem.armor_point + ((playerInfo?.lvl ?? 1) * 3)}</span>
              </div>
            )}
            {shopItem.type === "food" && shopItem.category && (
              <div className="text-[14px] text-green-400 mb-1 flex flex-col gap-0.5">
                <span>+{rarity === "legendary" ? "10" : rarity === "epic" ? "8" : "5"}% to {shopItem.category}</span>
                <span className="text-stone-500 font-medium">Duration: {rarity === "legendary" ? "4h" : rarity === "epic" ? "2h" : "30m"}</span>
              </div>
            )}
            {/* Comparison vs equipped */}
            {comparison && (
              <div className="mt-0.5 pt-0.5 border-t border-stone-800">
                <div className="text-[12px] uppercase tracking-widest text-stone-500 mb-0.5">
                  vs. Equipped
                </div>
                {comparison.noEquipped ? (
                  <div className="text-[12px] text-green-400/80">No item equipped — direct upgrade!</div>
                ) : (
                  <>
                    <div className={`text-[13px] flex items-center gap-1 ${comparison.diff > 0 ? 'text-green-400' : comparison.diff < 0 ? 'text-red-400' : 'text-stone-400'
                      }`}>
                      <img src={`/src/assets/design/status_effects/status_indicators/status_${comparison.diff > 0 ? 'up' : comparison.diff < 0 ? 'down' : 'neutral'}.png`} className="w-3.5 h-3.5" alt="indicator" />
                      <span>
                        {comparison.stat === 'damage' ? 'Damage' : 'Armor'}:
                        {' '}{comparison.current} → {comparison.next}
                        {' '}({comparison.diff > 0 ? '+' : ''}{comparison.diff})
                      </span>
                    </div>
                    {comparison.diff > 0 && (
                      <div className="text-[12px] text-green-500/80 mt-0.5">⬆ Upgrade</div>
                    )}
                    {comparison.diff < 0 && elemBuff && (
                      <div className="text-[12px] text-amber-400/80 mt-0.5">⚠ Lower damage, but has {elemBuff.label} effect!</div>
                    )}
                    {comparison.diff < 0 && !elemBuff && (
                      <div className="text-[12px] text-red-500/80 mt-0.5">⬇ Downgrade</div>
                    )}
                    {comparison.eqElemBuff && !elemBuff && (
                      <div className="text-[12px] text-amber-400/80 mt-0.5">⚠ Equipped has {comparison.eqElemBuff.label} — you'll lose it!</div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="text-stone-400 text-[13px] leading-tight pt-0.5 border-t border-stone-800 mb-1 mt-1">
              {shopItem.description}
            </div>
            <div className="mt-2 pt-2 border-t border-stone-800 flex flex-col gap-1">
              <div className="text-stone-500 text-[12px] tracking-widest uppercase">Price</div>
              {shopItem.buy_price_normal > 0 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  {shopItem.buy_price_normal} {<img src="/src/assets/design/currency/currency-normal.png" alt="Stone" className="w-5 h-5 drop-shadow" />}
                </span>
              ) : null}
              {shopItem.buy_price_spec > 0 ? (
                <span className="text-blue-400 flex items-center gap-1">
                  {shopItem.buy_price_spec} {<img src="/src/assets/design/currency/currency-spec.png" alt="Shell" className="w-5 h-5 drop-shadow" />}
                </span>
              ) : null}
            </div>
          </div>
          <div
            className="mx-auto w-2 h-2 rotate-45 -mt-1 relative z-50"
            style={{ background: "rgba(12,7,2,0.95)", borderRight: `1px solid ${RARITY_COLOR[rarity]}55`, borderBottom: `1px solid ${RARITY_COLOR[rarity]}55` }}
          />
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function ActionMenu({ shopItemInfo, position, onConfirm, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const top = Math.min(position.y, window.innerHeight - 150);
  const left = Math.min(position.x, window.innerWidth - 180);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top, left, zIndex: 9999 }}
      className="bg-stone-950 border border-green-900/50 rounded-xl shadow-2xl p-2 min-w-[160px]"
    >
      <div className="text-green-400 text-xs font-bold px-2 py-1 border-b border-stone-800 mb-1 truncate">
        {shopItemInfo?.item?.name}
      </div>
      <button
        onClick={() => onConfirm()}
        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-green-900/30 text-green-400 transition-colors font-medium flex justify-between items-center"
      >
        <span>Buy Item</span>
      </button>
      <button
        onClick={onClose}
        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-800 text-stone-500 transition-colors mt-1"
      >
        Cancel
      </button>
    </div>
  );
}

const Shop = () => {
  const { shopType } = useParams();
  const navigate = useNavigate();

  const [shopItems, setShopItems] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const data = await loadShopPage(shopType);
      setShopItems(data.shopItems);
      setInventory(data.inventory);
      setPlayerInfo(data.playerInfo);
    } catch (err) {
      showToast("Load error: " + err.message, "error");
    }
    setLoading(false);
  }, [shopType, showToast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const openBuyMenu = useCallback((shopItemInfo, e) => {
    if (shopItemInfo.purchased) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({ shopItemInfo, position: { x: rect.right + 10, y: rect.top } });
  }, []);

  const handleBuy = useCallback(async () => {
    if (busy || !actionMenu) return;
    const { shopItemInfo } = actionMenu;
    setActionMenu(null);
    setBusy(true);
    try {
      const res = await buyItem(shopItemInfo.shop_id);
      showToast(res.message);
      await load();
    } catch (err) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setBusy(false);
    }
  }, [busy, actionMenu, showToast, load]);

  const handleReroll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await rerollShopItems(shopType);
      showToast(res.message);
      await load();
    } catch (err) {
      showToast(err.message || "Failed to reroll", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GameLayout
      currency={inventory?.currency}
      customBg={`/src/assets/design/backgrounds/station_background/trimal_${shopType}_station_background.png`}
      contentAlign="start"
      fullBleed={true}
    >
      <Toast toast={toast} />

      {actionMenu && (
        <ActionMenu
          shopItemInfo={actionMenu.shopItemInfo}
          position={actionMenu.position}
          onConfirm={handleBuy}
          onClose={() => setActionMenu(null)}
        />
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.04] pointer-events-none z-[5] mix-blend-screen" />

        {/* Header - Corner aligned (Absolute top left to avoid flex flows affecting it) */}
        <div className="absolute top-4 left-6 pointer-events-auto max-w-sm md:max-w-xl z-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl  text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            {shopType === 'tinkerer' ? "Tinkerer's Workshop" : "Herbalist's Garden"}
          </h1>
          <p className="text-stone-300 mt-2  tracking-wider text-m md:text-l drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
            {shopType === 'tinkerer'
              ? "A place of grease, and finely crafted weapons. Upgrade your gear or browse the latest masterworks."
              : "The air here is thick with the scent of wild herbs and potent elixirs. Find something to heal your wounds or boost your spirits."}
          </p>
        </div>

        {/* Bottom Wares Panel */}
        <div className="pointer-events-auto mt-auto mb-6 w-full max-w-7xl mx-auto shrink-0 px-4 md:px-8 z-10">
          <div className="bg-stone-900/90 backdrop-blur-xl border-2 border-amber-900/30 rounded-3xl p-4 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
              <h2 className="text-xl md:text-2xl text-stone-200 tracking-widest uppercase">
                Available Wares
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleReroll}
                  disabled={busy}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 transition-colors border border-stone-600 rounded text-purple-400 uppercase tracking-widest text-xs font-bold shadow-lg"
                >
                  <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-4 h-4" />
                  Reroll Wares (10)
                </button>
                <div className="hidden md:flex gap-2 text-stone-500 uppercase tracking-widest text-xs">
                  Next Refill: <span className="text-amber-600">Daily, at Midnight</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-stone-400 animate-pulse text-sm">Browsing stock...</span>
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-4 pt-2 px-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900/50">
                <div className="flex gap-6 w-max mx-auto">
                  {shopItems.length > 0 ? (
                    shopItems.map((shopItemInfo, idx) => (
                      <div key={shopItemInfo.shop_id || idx} className="min-w-[160px] w-[160px] shrink-0">
                        <ShopItemTile
                          item={shopItemInfo}
                          playerInfo={playerInfo}
                          inventory={inventory}
                          onClick={(e) => openBuyMenu(shopItemInfo, e)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="w-full min-w-[50vw] py-16 text-center bg-stone-950/30 rounded-2xl border-2 border-dashed border-stone-800">
                      <p className="text-stone-500 font-bold italic tracking-wider uppercase text-sm">
                        The merchant has nothing to offer you today.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Shop;