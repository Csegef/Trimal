import React, { useEffect, useState, useCallback, useRef } from "react";
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

function ShopItemTile({ item, onClick, playerInfo }) {
  const [hovered, setHovered] = useState(false);
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

  return (
    <div
      className="relative w-full aspect-square"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={isPurchased}
        title={!hovered ? shopItem.name : undefined}
        style={{
          borderColor: RARITY_COLOR[rarity],
          boxShadow: isPurchased ? "none" : `inset 0 0 12px ${RARITY_GLOW[rarity]}`,
          opacity: isPurchased ? 0.4 : 1,
          filter: isPurchased ? "grayscale(100%)" : "none"
        }}
        className={`relative flex items-center justify-center w-full h-full rounded-xl border-2 bg-stone-950/80 transition-all duration-150 ${isPurchased ? "cursor-not-allowed" : "hover:scale-[1.03]"}`}
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
          <div className="absolute bottom-1 right-1 bg-stone-900/90 rounded px-1.5 py-0.5 text-[10px] font-bold border border-stone-700/50 flex flex-col items-end gap-0.5">
            {shopItem.buy_price_normal > 0 && (
              <span className="text-amber-400 flex items-center gap-1">
                {shopItem.buy_price_normal} {<img src="/src/assets/design/currency/currency-normal.png" alt="Stone" className="w-5 h-5 drop-shadow" />}
              </span>
            )}
            {shopItem.buy_price_spec > 0 && (
              <span className="text-blue-400 flex items-center gap-1">
                {shopItem.buy_price_spec} {<img src="/src/assets/design/currency/currency-spec.png" alt="Shell" className="w-5 h-5 drop-shadow" />}
              </span>
            )}
          </div>
        )}
        {isPurchased && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 font-bold text-red-500 tracking-widest -rotate-12 border-y border-red-900/50">
            SOLD
          </div>
        )}
      </button>

      {hovered && !isPurchased && (
        <div
          className="absolute z-50 bottom-[105%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ minWidth: "160px", maxWidth: "220px" }}
        >
          <div
            className="rounded-lg px-3 py-2 text-[11px] text-stone-300 leading-snug shadow-2xl border border-stone-700/70"
            style={{
              background: "rgba(12,7,2,0.95)",
              borderColor: RARITY_COLOR[rarity] + "66",
            }}
          >
            <div className="font-bold text-[13px] leading-tight mb-1" style={{ color: RARITY_COLOR[rarity] }}>
              {shopItem.name}
            </div>
            <div className="mb-1.5">
              <span
                className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: RARITY_COLOR[rarity],
                  background: RARITY_COLOR[rarity] + "22",
                  border: `1px solid ${RARITY_COLOR[rarity]}44`,
                }}
              >
                {rarity}
              </span>
            </div>
            <div className="text-stone-400 text-[10px] leading-snug pt-1 border-t border-stone-800 mb-2">
              {shopItem.description}
            </div>
            {shopItem.type === "weapon" && shopItem.base_damage != null && (
              <div className="text-[10px] text-red-400 font-bold mb-1.5 flex flex-col gap-0.5">
                <span>Base Damage: {shopItem.base_damage}</span>
              </div>
            )}
            {shopItem.type === "armor" && shopItem.armor_point != null && (
              <div className="text-[10px] text-blue-400 font-bold mb-1.5">
                <span>Armor Point: {shopItem.armor_point}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-stone-800 flex flex-col gap-1">
              <div className="text-stone-500 font-semibold text-[9px] tracking-widest uppercase">Price</div>
              {shopItem.buy_price_normal > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  {shopItem.buy_price_normal} {<img src="/src/assets/design/currency/currency-normal.png" alt="Stone" className="w-5 h-5 drop-shadow" />}
                </span>
              )}
              {shopItem.buy_price_spec > 0 && (
                <span className="text-blue-400 flex items-center gap-1">
                  {shopItem.buy_price_spec} {<img src="/src/assets/design/currency/currency-spec.png" alt="Shell" className="w-5 h-5 drop-shadow" />}
                </span>
              )}
            </div>
          </div>
          <div
            className="mx-auto w-2 h-2 rotate-45 -mt-1"
            style={{ background: "rgba(12,7,2,0.95)", borderRight: `1px solid ${RARITY_COLOR[rarity]}55`, borderBottom: `1px solid ${RARITY_COLOR[rarity]}55` }}
          />
        </div>
      )}
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
        <span>🛒</span>
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

  const shopTitle = shopType === 'tinkerer' ? 'The Tinkerer' : 'The Herbalist';
  const shopDesc = shopType === 'tinkerer' ? 'Buy weapons, armor, and strange knick-knacks.' : 'Buy herbs, natural remedies, and oddities.';

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

  return (
    <GameLayout currency={inventory?.currency}>
      <Toast toast={toast} />

      {actionMenu && (
        <ActionMenu
          shopItemInfo={actionMenu.shopItemInfo}
          position={actionMenu.position}
          onConfirm={handleBuy}
          onClose={() => setActionMenu(null)}
        />
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Header */}
        <div className="border-b border-stone-800/70 pb-3">
          <h1 className="text-3xl font-bold tracking-widest text-[#FBBF24] uppercase drop-shadow-md">
            {shopTitle}
          </h1>
          {/* text-2xl font-bold tracking-widest text-amber-400 uppercase */}
          <p className="text-stone-400 text-sm mt-1">{shopDesc}</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-amber-600/70 animate-pulse tracking-widest text-xl">Entering shop...</div>
          </div>
        ) : (
          /* Map-like outer container: station background fills this frame, like the map in MainGame */
          <div
            className="relative w-full rounded-2xl border-4 border-stone-700/80 shadow-2xl"
            style={{
              backgroundImage: `url('/backgrounds/trimal_${shopType}_station_background.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              minHeight: "60vh",
            }}
          >
            {/* Wares panel — semi-transparent, overlaid on the right side of station bg */}
            <div className="absolute inset-0 flex items-stretch justify-end p-6">
              <div
                className="w-[58%] rounded-2xl border border-stone-600/40 p-4 shadow-2xl overflow-visible"
                style={{ background: "rgba(8,4,1,0.70)", backdropFilter: "blur(6px)" }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="text-amber-600/90 text-sm font-semibold tracking-widest uppercase">
                    Today's Wares
                  </div>
                  <div className="text-[10px] text-stone-500 bg-stone-900/60 px-2 py-1 rounded border border-stone-700/40">
                    Stock refreshes daily
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {shopItems.length > 0 ? (
                    shopItems.map((shopItemInfo, idx) => (
                      <ShopItemTile
                        key={shopItemInfo.shop_id || idx}
                        item={shopItemInfo}
                        playerInfo={playerInfo}
                        onClick={(e) => openBuyMenu(shopItemInfo, e)}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 py-10 text-center text-stone-500 italic">
                      The merchant has nothing to offer you today.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        )}

      </div>
    </GameLayout>
  );
};

export default Shop;
