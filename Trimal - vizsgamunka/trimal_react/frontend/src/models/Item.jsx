// ==========================================
// Fájl: Tárgy Komponens (Item Model)
// Cél: Egyetlen tárgy csempéjének (kártyájának) megjelenítése.
//
// Kezeli a ritkaság (rarity) alapján történő színezést, a tooltip-et (felugró információs ablakot),
// és a kattintási vagy húzási eseményeket.
// ==========================================

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Rarity ───────────────────────────────────────────────────────────────────

export const RARITY_COLOR = {
    common: "#9ca3af",
    rare: "#60a5fa",
    epic: "#c084fc",
    legendary: "#fbbf24",
};

export const RARITY_GLOW = {
    common: "rgba(156,163,175,0.35)",
    rare: "rgba(96,165,250,0.35)",
    epic: "rgba(192,132,252,0.35)",
    legendary: "rgba(251,191,36,0.45)",
};

// ─── Item type metadata ───────────────────────────────────────────────────────

/**
 * Visszaadja a fallback emoji ikont a tételhez, ha nincs beállítva iconPath.
 * item_weapon / item_armor / item_food / item_misc.
 */
export function getItemIcon(item) {
    switch (item?.type) {
        case "weapon": return "⚔️";
        case "armor": return "🛡️";
        case "food": return "🍖";
        case "misc": return "📦";
        default: return "📦";
    }
}

/**
 * Ez a funkció visszaadja, hogy a tárgy felölthető-e (fegyver vagy páncél).
 */
export function isEquippable(item) {
    return item?.type === "weapon" || item?.type === "armor";
}

/**
 * Ez a funkció megállapítja a tárgy felszerelési helyét a típusa és kategóriája alapján.
 * Egyezik a inventoryApi.js resolveEquipSlot() logikájával.
 *
 * item_weapon  → "weapon"
 * item_armor   → "armor_head" | "armor_chest" | "armor_legs" | "armor_feet"
 *
 * @param {object} item
 * @returns {string|null}
 */
export function resolveEquipSlot(item) {
    if (!item) return null;
    if (item.type === "weapon") return "weapon";
    if (item.type === "armor") {
        const icon = (item.iconPath || "").toLowerCase();
        const cat = (item.category || "").toLowerCase();

        // Helmet / Cap
        if (icon.includes("cap") || icon.includes("helmet") || icon.includes("head") ||
            cat.includes("cap") || cat.includes("helmet") || cat.includes("head")) return "armor_cap";

        // Boots / Feet
        if (icon.includes("boots") || icon.includes("boot") || icon.includes("feet") || icon.includes("shoe") ||
            cat.includes("boots") || cat.includes("boot") || cat.includes("feet") || cat.includes("shoe")) return "armor_boots";

        // Leggings / Pants - check for 'leggings' and 'pant' specifically, and 'leg' only if not part of 'legendary'
        if (icon.includes("leggings") || icon.includes("pant") || (icon.includes("leg") && !icon.includes("legendary")) ||
            cat.includes("leggings") || cat.includes("pant") || (cat.includes("leg") && !cat.includes("legendary"))) return "armor_leggings";

        // Chest / Plate / Fallback
        if (icon.includes("plate") || icon.includes("chest") || icon.includes("body") ||
            cat.includes("plate") || cat.includes("chest") || cat.includes("body")) return "armor_plate";

        return "armor_plate"; // fallback
    }
    return null;
}

// ─── Image path resolver ──────────────────────────────────────────────────────

/**
 * Ez a funkció elkészíti a helyes kép src útvonalat a tárgy típusa, ritkasága és kategóriája alapján,
 * megegyezik a /assets/design/items/ alatti mappaszerkezettel.
 *
 * weapon  → items/weapon/{rarity}/{iconPath}
 * armor   → items/armor/{rarity}/{iconPath}
 * food    → items/food/{category}/{iconPath}   (category = heal | agility | strength | luck | resistence)
 * misc    → items/misc/{iconPath}
 *
 * @param {object} item
 * @returns {string|null}
 */
export function resolveItemImagePath(item) {
    if (!item?.iconPath) return null;

    const rarity = (item.rarity || "common").toLowerCase();
    // Legacy typo normalizálása: 'resistence' → 'resistance'
    const rawCategory = (item.category || "").toLowerCase();
    const category = rawCategory === "resistence" ? "resistance" : rawCategory;
    const base = "/src/assets/design/items";

    const type = (item.type || "").toLowerCase();

    switch (type) {
        case "weapon":
            return `${base}/weapon/${rarity}/${item.iconPath}`;

        case "armor":
            return `${base}/armor/${rarity}/${item.iconPath}`;

        case "food":
            // A food al mappa a buff kategória (heal, agility, strength, luck, resistance)
            return `${base}/food/${category}/${item.iconPath}`;

        case "misc":
            // a misc-nek nincs rarity al-mappája
            return `${base}/misc/${item.iconPath}`;

        default:
            return `${base}/${item.iconPath}`;
    }
}


// ─── Per-type stat lines ──────────────────────────────────────────────────────

/**
 * Visszaad egy tömböt { label, value } párokkal a tárgy típus-specifikus statisztikáihoz.
 *
 * item_weapon:  base_damage, normal_currency_cost, spec_currency_cost, inventory_size
 * item_armor:   armor_point, normal_currency_cost, spec_currency_cost, inventory_size
 * item_food:    buff_id, category (buff type), normal_currency_cost, inventory_size
 * item_misc:    normal_currency_cost, inventory_size
 */
export function getItemStats(item) {
    if (!item) return [];
    const stats = [];

    switch (item.type) {
        case "weapon":
            if (item.base_damage != null) stats.push({ label: "Damage", value: item.base_damage });
            if (item.inventory_size != null) stats.push({ label: "Inv. size", value: item.inventory_size });
            if (item.normal_currency_cost != null) stats.push({ label: "Buy price 💰", value: item.normal_currency_cost });
            if (item.spec_currency_cost != null && item.spec_currency_cost > 0)
                stats.push({ label: "Buy price ✨", value: item.spec_currency_cost });
            break;

        case "armor":
            if (item.armor_point != null) stats.push({ label: "Armor", value: item.armor_point });
            if (item.category != null) stats.push({ label: "Slot", value: item.category });
            if (item.inventory_size != null) stats.push({ label: "Inv. size", value: item.inventory_size });
            if (item.normal_currency_cost != null) stats.push({ label: "Buy price 💰", value: item.normal_currency_cost });
            if (item.spec_currency_cost != null && item.spec_currency_cost > 0)
                stats.push({ label: "Buy price ✨", value: item.spec_currency_cost });
            break;

        case "food":
            if (item.category != null) stats.push({ label: "Buff type", value: item.category });
            if (item.buff_id != null) stats.push({ label: "Buff ID", value: item.buff_id });
            if (item.inventory_size != null) stats.push({ label: "Inv. size", value: item.inventory_size });
            if (item.normal_currency_cost != null) stats.push({ label: "Buy price 💰", value: item.normal_currency_cost });
            if (item.spec_currency_cost != null && item.spec_currency_cost > 0)
                stats.push({ label: "Buy price ✨", value: item.spec_currency_cost });
            break;

        case "misc":
            if (item.category != null) stats.push({ label: "Category", value: item.category });
            if (item.inventory_size != null) stats.push({ label: "Inv. size", value: item.inventory_size });
            if (item.normal_currency_cost != null) stats.push({ label: "Buy price 💰", value: item.normal_currency_cost });
            break;

        default:
            break;
    }

    return stats;
}

// ─── ItemSlotTile ─────────────────────────────────────────────────────────────
// Ez az ItemSlotTile az inventoryban használt tile.

export function ItemSlotTile({ item, onClick, playerInfo, equipped, hideQuantity = false }) {
    const [hoverRect, setHoverRect] = useState(null);

    if (!item) {
        return (
            <div className="w-full aspect-square rounded-lg border border-stone-800/40 bg-stone-950/30 flex items-center justify-center select-none">
                <span className="text-stone-800 text-lg">◇</span>
            </div>
        );
    }

    let rarity = (item.rarity || "common").toLowerCase();
    if (rarity === "legendray") rarity = "legendary";

    const imageSrc = resolveItemImagePath(item);
    const [imgError, setImgError] = useState(false);

    // Ez a sor reset-eli a kép hiba állapotát, amikor az item prop megváltozik (pl. a slot újjárenderel egy új item-mel)
    useEffect(() => {
        setImgError(false);
    }, [item]);

    // Ez a Comparison logic összehasonlítja a két tárgyat.
    const getComparison = () => {
        if (!equipped || !item) return null;
        if (item.type === 'weapon' && equipped.type === 'weapon') {
            const itemDmg = item.weapon_damage || item.base_damage || 0;
            const eqDmg = equipped.weapon_damage || equipped.base_damage || 0;
            const diff = itemDmg - eqDmg;
            return { stat: 'damage', diff, current: eqDmg, next: itemDmg };
        }
        if (item.type === 'armor' && equipped.type === 'armor') {
            const itemArmor = item.armor_point || 0;
            const eqArmor = equipped.armor_point || 0;
            const diff = itemArmor - eqArmor;
            return { stat: 'armor', diff, current: eqArmor, next: itemArmor };
        }
        return null;
    };
    const comparison = getComparison();

    // Van elemental buff?
    const elemBuff = item.elemental_buff;
    // Van elemental buff a felszerelt itemen?
    const eqElemBuff = equipped?.elemental_buff;

    return (
        <div
            className="relative w-full aspect-square"
            onMouseEnter={(e) => setHoverRect(e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => setHoverRect(null)}
        >
            <button
                onClick={onClick}
                style={{
                    borderColor: RARITY_COLOR[rarity],
                    boxShadow: `0 0 8px ${RARITY_GLOW[rarity]}`,
                }}
                className="relative w-full h-full rounded-lg border-2 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1 p-1 hover:scale-105 transition-all duration-150"
            >
                {imageSrc && !imgError ? (
                    <img
                        src={imageSrc}
                        alt={item.name}
                        className="w-23 h-23 object-contain"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-3xl">{getItemIcon(item)}</span>
                )}
                {item.quantity > 1 && (
                    <span className="absolute bottom-1 right-1 text-[9px] text-amber-400 font-bold bg-stone-900/80 px-1 rounded">
                        x{item.quantity}
                    </span>
                )}
                {/* Ez az Elemental buff indicator a bal felső sarokban jelenik meg. */}
                {elemBuff && (
                    <img
                        src={`/src/assets/design/status_effects/status_indicators/status_${elemBuff.type || 'poison'}.png`}
                        alt={elemBuff.label}
                        title={elemBuff.label}
                        className="absolute top-1 left-1 w-4 h-4 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] z-10"
                    />
                )}
                {/* Ez a Comparison arrow indicator a jobb felső sarokban jelenik meg. */}
                {comparison && (
                    <img
                        src={`/src/assets/design/status_effects/status_indicators/status_${comparison.diff > 0 ? 'up' : comparison.diff < 0 ? 'down' : 'neutral'}.png`}
                        alt="indicator"
                        className="absolute top-1 right-1 w-3.5 h-3.5 drop-shadow-md z-10"
                    />
                )}
            </button>

            {/* A hover description tooltip a Portal-t használja, hogy elkerülje a levágást. */}
            {hoverRect && createPortal(
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
                        className="rounded-lg px-2 py-1 text-[13px] text-stone-200 leading-tight border"
                        style={{
                            background: "rgba(12,7,2,0.98)",
                            borderColor: RARITY_COLOR[rarity] + "55",
                        }}
                    >
                        {/* Név */}
                        <div
                            className="text-[18px] font-title leading-tight mb-0.5"
                            style={{ color: RARITY_COLOR[rarity] }}
                        >
                            {item.name}
                        </div>
                        {/* Rarity badge */}
                        <div className="mb-1">
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
                        {/* Weapon Stats */}
                        {item.type === "weapon" && (item.base_damage != null || item.weapon_damage != null) && (
                            <div className="text-[14px] text-red-400 mb-1 flex flex-col gap-0.5">
                                <span>Item Damage: {item.weapon_damage || item.base_damage}</span>
                                <span className="text-stone-400 font-medium">Combat Damage: {Math.round((item.weapon_damage || item.base_damage) * 1.5 * (1 + ((playerInfo?.stats?.strength ?? 10) / 25)))}</span>
                            </div>
                        )}
                        {/* Elemental Buff Badge */}
                        {item.type === "weapon" && elemBuff && (
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
                        {/* Armor Statok */}
                        {item.type === "armor" && item.armor_point != null && (
                            <div className="text-[14px] text-blue-400 mb-1 flex flex-col gap-0.5">
                                <span>Item Armor: {item.armor_point}</span>
                                <span className="text-stone-400 font-medium">Combat Defense: {item.armor_point + ((playerInfo?.lvl ?? 1) * 3)}</span>
                            </div>
                        )}
                        {/* Food Statok */}
                        {item.type === "food" && item.category && (
                            <div className="text-[14px] text-green-400 mb-1 flex flex-col gap-0.5">
                                <span>+{rarity === "legendary" ? "10" : rarity === "epic" ? "8" : "5"}% to {item.category}</span>
                                <span className="text-stone-500 font-medium">Duration: {rarity === "legendary" ? "4h" : rarity === "epic" ? "2h" : "30m"}</span>
                            </div>
                        )}
                        {/* Összehasonlítási Szakasz */}
                        {comparison && (
                            <div className="mt-0.5 pt-0.5 border-t border-stone-800">
                                <div className="text-[12px] uppercase tracking-widest text-stone-500 mb-0.5">
                                    vs. Equipped
                                </div>
                                <div className={`text-[14px] flex items-center gap-1 ${comparison.diff > 0 ? 'text-green-400' : comparison.diff < 0 ? 'text-red-400' : 'text-stone-400'
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
                                {eqElemBuff && !elemBuff && (
                                    <div className="text-[12px] text-amber-400/80 mt-0.5">⚠ Equipped has {eqElemBuff.label} — you'll lose it!</div>
                                )}
                            </div>
                        )}
                        {!comparison && equipped === null && (item.type === 'weapon' || item.type === 'armor') && (
                            <div className="mt-1 pt-1 border-t border-stone-800">
                                <div className="text-[12px] text-green-400/80">No item equipped in this slot — direct upgrade!</div>
                            </div>
                        )}
                        {item.description && (
                            <div className="text-stone-400 text-[13px] leading-tight pt-0.5 border-t border-stone-800">
                                {item.description}
                            </div>
                        )}
                    </div>
                    <div
                        className="mx-auto w-2 h-2 rotate-45 -mt-1 relative z-[99999]"
                        style={{ background: "rgba(12,7,2,0.98)", borderRight: `1px solid ${RARITY_COLOR[rarity]}55`, borderBottom: `1px solid ${RARITY_COLOR[rarity]}55` }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}