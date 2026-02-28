// src/models/Item.jsx
// Item model definitions matching the 4 DB tables:
//   item_weapon, item_armor, item_food, item_misc
//
// The inventory_json in `specie` stores items as plain objects.
// These helpers normalise, display and reason about those objects.

import React from "react";

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
 * Returns the fallback emoji icon for an item when no iconPath is set.
 * Matches item_weapon / item_armor / item_food / item_misc.
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
 * Returns true if this item can be equipped (weapon or armor).
 */
export function isEquippable(item) {
    return item?.type === "weapon" || item?.type === "armor";
}

/**
 * Determines the equipment slot for an item based on its type and category.
 * Mirrors the logic in inventoryApi.js resolveEquipSlot().
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
        // Match by iconPath suffix, same logic as PHP resolveArmorSlot()
        const icon = (item.iconPath || "").toLowerCase();
        if (icon.includes("cap") || icon.includes("helmet") || icon.includes("head")) return "armor_cap";
        if (icon.includes("plate") || icon.includes("chest") || icon.includes("body")) return "armor_plate";
        if (icon.includes("leggings") || icon.includes("leg") || icon.includes("pant")) return "armor_leggings";
        if (icon.includes("boots") || icon.includes("boot") || icon.includes("feet") || icon.includes("shoe")) return "armor_boots";
        return "armor_plate"; // fallback
    }
    return null;
}

// ─── Image path resolver ──────────────────────────────────────────────────────

/**
 * Builds the correct image src path based on item type, rarity and category,
 * matching the folder structure under /assets/design/items/.
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
    // Normalise legacy typo: 'resistence' → 'resistance'
    const rawCategory = (item.category || "").toLowerCase();
    const category = rawCategory === "resistence" ? "resistance" : rawCategory;
    // Vite serves src/ assets via /src/... in dev mode (symlink: src/assets/design -> Graphics)
    const base = "/src/assets/design/items";

    const type = (item.type || "").toLowerCase();

    switch (type) {
        case "weapon":
            return `${base}/weapon/${rarity}/${item.iconPath}`;

        case "armor":
            return `${base}/armor/${rarity}/${item.iconPath}`;

        case "food":
            // food sub-folder is the buff category (heal, agility, strength, luck, resistance)
            return `${base}/food/${category}/${item.iconPath}`;

        case "misc":
            // misc has no rarity sub-folder
            return `${base}/misc/${item.iconPath}`;

        default:
            return `${base}/${item.iconPath}`;
    }
}


// ─── Per-type stat lines ──────────────────────────────────────────────────────

/**
 * Returns an array of { label, value } pairs for the item's type-specific stats.
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
// A single square tile used in the bag grid.

export function ItemSlotTile({ item, onClick, playerInfo, hideQuantity = false }) {
    const [hovered, setHovered] = React.useState(false);

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
    const [imgError, setImgError] = React.useState(false);

    // Reset image error state when item prop changes (e.g., slot re-rendered with new item)
    React.useEffect(() => {
        setImgError(false);
    }, [item]);

    return (
        <div
            className="relative w-full aspect-square"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
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
            </button>

            {/* Hover description tooltip */}
            {hovered && (
                <div
                    className="absolute z-50 bottom-[110%] left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ minWidth: "150px", maxWidth: "210px" }}
                >
                    <div
                        className="rounded-lg px-3 py-2 text-[11px] text-stone-200 leading-snug shadow-2xl border border-stone-700/70"
                        style={{
                            background: "rgba(12,7,2,0.97)",
                            borderColor: RARITY_COLOR[rarity] + "55",
                        }}
                    >
                        {/* Name */}
                        <div
                            className="font-bold text-[12px] leading-tight mb-1"
                            style={{ color: RARITY_COLOR[rarity] }}
                        >
                            {item.name}
                        </div>
                        {/* Rarity badge */}
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
                        {/* Stats */}
                        {item.type === "weapon" && item.base_damage != null && (
                            <div className="text-[10px] text-red-400 font-bold mb-1.5 flex flex-col gap-0.5">
                                <span>Damage: {Math.round((item.weapon_damage || item.base_damage) * 1.25 * (1 + ((playerInfo?.stats?.strength ?? 10) / 10)))}</span>
                            </div>
                        )}
                        {item.type === "armor" && item.armor_point != null && (
                            <div className="text-[10px] text-blue-400 font-bold mb-1.5 flex flex-col gap-1">
                                <span>Armor Point: {item.armor_point}</span>
                                {/* LATER: Implement incoming damage calc based on effective armor in combat 
                                <span className="text-[9px] text-stone-400 font-normal leading-tight">
                                    Damage Taken: <br />
                                    (Incoming - Eff. Armor) × {(1 - ((playerInfo?.stats?.resistance ?? 10) / 100)).toFixed(2)}
                                </span>
                                */}
                            </div>
                        )}
                        {item.type === "food" && item.category && (
                            <div className="text-[10px] text-green-400 font-bold mb-1.5">
                                Grants a {rarity === "legendary" ? "large" : rarity === "epic" ? "medium" : "small"} bonus to {item.category}
                            </div>
                        )}
                        {/* Description */}
                        {item.description && (
                            <div className="text-stone-400 text-[10px] leading-snug pt-1 border-t border-stone-800">
                                {item.description}
                            </div>
                        )}
                    </div>
                    {/* Arrow */}
                    <div
                        className="mx-auto w-2 h-2 rotate-45 -mt-1"
                        style={{ background: "rgba(12,7,2,0.97)", borderRight: `1px solid ${RARITY_COLOR[rarity]}55`, borderBottom: `1px solid ${RARITY_COLOR[rarity]}55` }}
                    />
                </div>
            )}
        </div>
    );
}

// ItemDetailRow has been removed.
// Item descriptions are now shown as hover tooltips on ItemSlotTile.