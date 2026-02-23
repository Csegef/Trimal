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
        const cat = (item.category || "").toLowerCase();
        if (cat.includes("head") || cat.includes("helm") || cat.includes("hat")) return "armor_head";
        if (cat.includes("chest") || cat.includes("body") || cat.includes("torso")) return "armor_chest";
        if (cat.includes("leg") || cat.includes("pant") || cat.includes("trouser")) return "armor_legs";
        if (cat.includes("feet") || cat.includes("boot") || cat.includes("shoe")) return "armor_feet";
        // Fallback: map by rarity order → chest
        return "armor_chest";
    }
    return null;
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

export function ItemSlotTile({ item, onClick }) {
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
                boxShadow: `0 0 8px ${RARITY_GLOW[rarity]}`,
            }}
            className="relative w-full aspect-square rounded-lg border-2 bg-stone-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1 p-1 hover:scale-105 transition-all duration-150"
        >
            {item.iconPath ? (
                <img
                    src={`/assets/items/${item.iconPath}`}
                    alt={item.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = "none"; }}
                />
            ) : (
                <span className="text-xl">{getItemIcon(item)}</span>
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

// ─── ItemDetailRow ────────────────────────────────────────────────────────────
// One row in the "Item Details" list panel.

export function ItemDetailRow({ item, isEquipped, onClick }) {
    const rarity = item.rarity || "common";
    const stats = getItemStats(item);

    return (
        <button
            onClick={onClick}
            className="flex items-start gap-3 rounded-lg px-3 py-2 border text-left hover:bg-stone-900/40 transition-colors w-full"
            style={{
                borderColor: RARITY_COLOR[rarity] + "44",
                background: "rgba(18,10,3,0.55)",
            }}
        >
            {/* Icon */}
            <span className="text-base mt-0.5 shrink-0">
                {item.iconPath
                    ? <img src={item.iconPath} alt={item.name} className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = "none"; }} />
                    : getItemIcon(item)
                }
            </span>

            {/* Name + description + stats */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: RARITY_COLOR[rarity] }}>
                        {item.name}
                    </span>
                    {isEquipped && (
                        <span className="text-[9px] bg-amber-900/40 border border-amber-700/40 text-amber-500 px-1 rounded shrink-0">
                            ✓ equipped
                        </span>
                    )}
                </div>
                {item.description && (
                    <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                )}
                {/* Type-specific stats */}
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {stats.map(({ label, value }) => (
                        <span key={label} className="text-[9px] text-stone-600">
                            <span className="text-stone-500">{label}:</span> {value}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quantity + sell price */}
            <div className="text-right shrink-0">
                <div className="text-xs text-amber-400">x{item.quantity}</div>
                <div className="text-[10px] text-stone-600">💰 {item.sell_price ?? 0}</div>
            </div>
        </button>
    );
}
