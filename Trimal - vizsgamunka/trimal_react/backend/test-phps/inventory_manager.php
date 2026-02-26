<?php
// inventory_manager.php
require_once 'config.php';

class InventoryManager
{
    private $pdo;
    private $playerId;

    public function __construct($pdo, $playerId)
    {
        $this->pdo = $pdo;
        $this->playerId = $playerId;
    }

    /**
     * Teljes inventory betöltése
     */
    public function getInventory()
    {
        $stmt = $this->pdo->prepare("SELECT inventory_json FROM specie WHERE id = ?");
        $stmt->execute([$this->playerId]);
        $row = $stmt->fetch();

        if ($row && !empty($row['inventory_json'])) {
            $decoded = json_decode($row['inventory_json'], true);
            if ($decoded !== null) {
                return $decoded;
            }
        }

        return $this->defaultInventory();
    }

    /**
     * Alapértelmezett inventory struktúra
     */
    private function defaultInventory()
    {
        return [
            'capacity' => 100,
            'used' => 0,
            'currency' => [
                'normal' => 0,
                'spec' => 0
            ],
            'items' => [],
            'equipped' => [
                'weapon' => null,
                'armor_cap' => null,
                'armor_plate' => null,
                'armor_leggings' => null,
                'armor_boots' => null
            ]
        ];
    }

    /**
     * Játékos alapadatainak lekérése (név, szint, xp, statok)
     */
    public function getPlayerInfo()
    {
        $stmt = $this->pdo->prepare("
            SELECT id, name, lvl, xp, strength, agility, intelligence,
                   endurance, class, hair_style, beard_style
            FROM specie WHERE id = ?
        ");
        $stmt->execute([$this->playerId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $xpForNext = $row['lvl'] * 100;

        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'lvl' => $row['lvl'],
            'xp' => $row['xp'],
            'xpForNext' => $xpForNext,
            'class' => $row['class'],
            'hairStyle' => $row['hair_style'],
            'beardStyle' => $row['beard_style'],
            'stats' => [
                'strength' => $row['strength'],
                'agility' => $row['agility'],
                'intelligence' => $row['intelligence'],
                'endurance' => $row['endurance'],
            ]
        ];
    }

    /**
     * Inventory mentése
     */
    public function saveInventory($inventory)
    {
        $json = json_encode($inventory, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $stmt = $this->pdo->prepare("UPDATE specie SET inventory_json = ? WHERE id = ?");
        return $stmt->execute([$json, $this->playerId]);
    }

    /**
     * Tárgy hozzáadása az inventoryhoz
     */
    public function addItem($itemType, $itemId, $quantity = 1)
    {
        if (!$itemType || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: itemType, itemId'];
        }

        $inventory = $this->getInventory();
        $itemDetails = $this->getItemDetails($itemType, $itemId);

        if (!$itemDetails) {
            return ['success' => false, 'message' => 'Item not found'];
        }

        // Ha már van ilyen tárgy, mennyiséget növeljük
        $found = false;
        foreach ($inventory['items'] as &$item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $item['quantity'] += $quantity;
                $found = true;
                break;
            }
        }
        unset($item);

        if (!$found) {
            $newItem = [
                'id' => $itemId,
                'type' => $itemType,
                'name' => $itemDetails['name'],
                'rarity' => $itemDetails['rarity'] ?? 'common',
                'quantity' => $quantity,
                'description' => $itemDetails['description'] ?? '',
                'iconPath' => $itemDetails['iconPath'] ?? '',
                'sell_price' => $itemDetails['sell_price'] ?? 0,
            ];

            if ($itemType == 'weapon') {
                $newItem['base_damage'] = $itemDetails['base_damage'] ?? 0;
            }
            elseif ($itemType == 'food') {
                $newItem['category'] = $itemDetails['category'] ?? '';
                $newItem['buff_id'] = $itemDetails['buff_id'] ?? null;
            }
            elseif ($itemType == 'armor') {
                $newItem['armor_point'] = $itemDetails['armor_point'] ?? 0;
                $newItem['category'] = $itemDetails['slot'] ?? 'armor';
            }

            $inventory['items'][] = $newItem;
        }

        $inventory['used'] = $this->calculateUsedSpace($inventory['items']);

        if ($inventory['used'] > $inventory['capacity']) {
            return ['success' => false, 'message' => 'Inventory full'];
        }

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item added successfully', 'inventory' => $inventory];
        }

        return ['success' => false, 'message' => 'Failed to save inventory'];
    }

    /**
     * Tárgy eltávolítása az inventoryból
     */
    public function removeItem($itemType, $itemId, $quantity = 1)
    {
        if (!$itemType || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: itemType, itemId'];
        }

        $inventory = $this->getInventory();

        foreach ($inventory['items'] as $key => &$item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $item['quantity'] -= $quantity;

                if ($item['quantity'] <= 0) {
                    // Ha fel van szerelve, levesszük
                    foreach ($inventory['equipped'] as $slot => $equippedObj) {
                        if ($equippedObj && is_array($equippedObj) && $equippedObj['id'] == $itemId) {
                            $inventory['equipped'][$slot] = null;
                        }
                    }
                    array_splice($inventory['items'], $key, 1);
                }

                $inventory['used'] = $this->calculateUsedSpace($inventory['items']);

                if ($this->saveInventory($inventory)) {
                    return ['success' => true, 'message' => 'Item removed successfully', 'inventory' => $inventory];
                }
                return ['success' => false, 'message' => 'Failed to save inventory'];
            }
        }

        return ['success' => false, 'message' => 'Item not found in inventory'];
    }

    /**
     * Tárgy eladása – eltávolítja és sell_price-szal arányos pénzt ad
     */
    public function sellItem($itemType, $itemId, $quantity = 1)
    {
        if (!$itemType || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: itemType, itemId'];
        }

        $inventory = $this->getInventory();

        $foundItem = null;
        foreach ($inventory['items'] as $item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $foundItem = $item;
                break;
            }
        }

        if (!$foundItem) {
            return ['success' => false, 'message' => 'Item not found in inventory'];
        }

        // Felszerelt tárgyat nem lehet eladni (ha a táskából akarod eladni, az már nincs is a táskában, szóval a $foundItem null lenne, ha quantity 0, de azért ellenőrizzük)
        foreach ($inventory['equipped'] as $slot => $equippedObj) {
            if ($equippedObj && is_array($equippedObj) && $equippedObj['id'] == $itemId) {
                return ['success' => false, 'message' => 'Cannot sell equipped item. Unequip it first.'];
            }
        }

        $sellPrice = ($foundItem['sell_price'] ?? 0) * $quantity;

        $removeResult = $this->removeItem($itemType, $itemId, $quantity);
        if (!$removeResult['success']) {
            return $removeResult;
        }

        $this->addCurrency($sellPrice, 0);

        return [
            'success' => true,
            'message' => "Sold {$quantity}x {$foundItem['name']} for {$sellPrice} coins",
            'earned' => $sellPrice
        ];
    }

    /**
     * Pénz hozzáadása
     */
    public function addCurrency($normalAmount = 0, $specAmount = 0)
    {
        $inventory = $this->getInventory();
        $inventory['currency']['normal'] += (int)$normalAmount;
        $inventory['currency']['spec'] += (int)$specAmount;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency added', 'currency' => $inventory['currency']];
        }
        return ['success' => false, 'message' => 'Failed to add currency'];
    }

    /**
     * Pénz levonása
     */
    public function removeCurrency($normalAmount = 0, $specAmount = 0)
    {
        $inventory = $this->getInventory();

        if ($inventory['currency']['normal'] < $normalAmount ||
        $inventory['currency']['spec'] < $specAmount) {
            return ['success' => false, 'message' => 'Insufficient currency'];
        }

        $inventory['currency']['normal'] -= (int)$normalAmount;
        $inventory['currency']['spec'] -= (int)$specAmount;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency removed', 'currency' => $inventory['currency']];
        }
        return ['success' => false, 'message' => 'Failed to remove currency'];
    }

    /**
     * Felszerelés felvétele
     */
    public function equipItem($slot, $itemId)
    {
        if (!$slot || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: slot, itemId'];
        }

        $inventory = $this->getInventory();

        $foundItem = null;
        $foundIndex = -1;
        foreach ($inventory['items'] as $index => $item) {
            if ($item['id'] == $itemId && $item['quantity'] > 0) {
                $foundItem = $item;
                $foundIndex = $index;
                break;
            }
        }

        if (!$foundItem) {
            return ['success' => false, 'message' => 'Item not found in inventory'];
        }

        $validSlots = ['weapon', 'armor_cap', 'armor_plate', 'armor_leggings', 'armor_boots'];
        if (!in_array($slot, $validSlots)) {
            return ['success' => false, 'message' => 'Invalid equipment slot: ' . $slot];
        }

        if ($slot === 'weapon' && $foundItem['type'] !== 'weapon') {
            return ['success' => false, 'message' => 'Item is not a weapon'];
        }
        // For armor slots, derive expected slot from icon filename:
        // e.g. bone-cap.png -> armor_cap, leather-boots.png -> armor_boots
        if ($slot !== 'weapon' && $foundItem['type'] !== 'armor') {
            return ['success' => false, 'message' => 'Item is not armor'];
        }
        if ($slot !== 'weapon' && $foundItem['type'] === 'armor') {
            $expectedSlot = $this->resolveArmorSlot($foundItem['iconPath'] ?? '');
            if ($expectedSlot && $expectedSlot !== $slot) {
                return ['success' => false, 'message' => 'This armor piece does not fit that slot'];
            }
        }

        // Ha van már valami felvéve ezen a sloton, azt le kell venni előbb
        if (!empty($inventory['equipped'][$slot])) {
            $this->unequipItem($slot);
            // Mivel unequip metódus végén van egy mentés és `getInventory()`, 
            // újra be kell tölteni a friss állapotot:
            $inventory = $this->getInventory();
            // Az újra betöltött array-ben meg kell keresni az adott itemet
            foreach ($inventory['items'] as $index => $item) {
                if ($item['id'] == $itemId && $item['quantity'] > 0) {
                    $foundItem = $item;
                    $foundIndex = $index;
                    break;
                }
            }
        }

        // Tárgy eltávolítása az inventory/items-ből, vagy quantity csökkentése
        if ($foundItem['quantity'] > 1) {
            $inventory['items'][$foundIndex]['quantity'] -= 1;
        }
        else {
            array_splice($inventory['items'], $foundIndex, 1);
        }

        // Beállítjuk a slot-ba csak az id-t (és esetlegesen a frontend ezen keresztül ki tudja keresni az api miatt? Nem, a fronend jelenleg az ID-t keresi a teljes listában ami itt van.)
        // Várj, a frontend `getEquippedItem` metódusa: 
        // return eqId ? (inventory.items.find((i) => i.id === eqId) ?? null) : null;
        // Ha kiveszem az `items`-ből, a frontend nem találja meg.
        // Helyette: A backend az equipped-be beleteszi a teljes tárgyat, vagy visszaadjuk a frontendnek egy másik listában?
        // Hagyjuk benne az `items`-ben quantity=0 val, vagy csak jelölővel? De a frontend map iterál rajta a gridnél.
        // Emiatt a legtisztább az, ha a frontend oldalt frissítjük, hogy az `equipped` objektumban kapja meg a cuccot, vagy a JSON struktúrát megváltoztatjuk.
        // Módosítsuk a PHP-t: $inventory['equipped'][$slot] az ID-t tárolja, de beleteszünk egy rejtett items tömböt az adatbázisba?
        // Ha quantity = 0-ra tesszük és az `isEquipped` propertyt true-ra, a frontend inventory gridnél szűrni kell a !isEquipped itemeket.

        // Let's adopt a different approach: the item moves array_splice-wise to `equipped_items`? The easiest is to leave it in `items` but mark `equippedSlot: slot`. No, the task specifically says: "ha fel van veve a targy akkor ne legyen az inventoryban csak a slotokban".
        // A frontend jelenlegi kódja Inventory.jsx-ben: 
        // const getEquippedItem = (slotKey) => { ... inventory.items.find((i) => i.id === eqId) ... }
        // const slots = Array.from({ length: INVENTORY_SLOT_COUNT }, (_, i) => inventory?.items?.[i] ?? null);
        // Ez esetben módosítanom kell az `Inventory.jsx` frontend kódot is, hogy a `getEquippedItem` ne a grid listából keresse.

        // Update PHP logic:
        // We will store the ENTIRE ITEM OBJECT in `$inventory['equipped'][$slot]` instead of just the ID.

        // Remove 1 quantity worth of the item into a standalone object
        $equippedObject = $foundItem;
        $equippedObject['quantity'] = 1;

        $inventory['equipped'][$slot] = $equippedObject;

        // Update used space (equipping doesn't drop used space technically, but logically maybe it frees bag space)
        $inventory['used'] = $this->calculateUsedSpace($inventory['items']);

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item equipped', 'equipped' => $inventory['equipped'], 'inventory' => $inventory];
        }
        return ['success' => false, 'message' => 'Failed to equip item'];
    }

    /**
     * Felszerelés levétele
     */
    public function unequipItem($slot)
    {
        if (!$slot) {
            return ['success' => false, 'message' => 'Hiányzó: slot'];
        }

        $inventory = $this->getInventory();

        if (!array_key_exists($slot, $inventory['equipped']) || empty($inventory['equipped'][$slot])) {
            return ['success' => false, 'message' => 'Invalid slot or empty'];
        }

        $equippedItem = $inventory['equipped'][$slot];

        // Check if there's space before unequipping
        if ($inventory['used'] + 1 > $inventory['capacity']) {
            return ['success' => false, 'message' => 'Inventory full, cannot unequip item'];
        }

        // Tegyük vissza az item-et a listába
        // Ezt a legegyszerűbben a addItem logika replikációjával tehetjük meg
        $found = false;
        foreach ($inventory['items'] as &$item) {
            if ($item['type'] == $equippedItem['type'] && $item['id'] == $equippedItem['id']) {
                $item['quantity'] += 1;
                $found = true;
                break;
            }
        }
        unset($item);

        if (!$found) {
            $inventory['items'][] = $equippedItem;
        }

        $inventory['equipped'][$slot] = null;
        $inventory['used'] = $this->calculateUsedSpace($inventory['items']);

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item unequipped', 'equipped' => $inventory['equipped'], 'inventory' => $inventory];
        }
        return ['success' => false, 'message' => 'Failed to unequip item'];
    }

    /**
     * Tárgy részleteinek lekérése az adatbázisból
     */
    private function getItemDetails($itemType, $itemId)
    {
        $tables = [
            'weapon' => 'item_weapon',
            'armor' => 'item_armor',
            'food' => 'item_food',
            'misc' => 'item_misc'
        ];

        if (!isset($tables[$itemType])) {
            return null;
        }

        $table = $tables[$itemType];
        $stmt = $this->pdo->prepare("SELECT * FROM `$table` WHERE item_id = ?");
        $stmt->execute([$itemId]);

        return $stmt->fetch() ?: null;
    }

    /**
     * Inventory használt helyének kiszámítása
     */
    private function calculateUsedSpace($items)
    {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['quantity'];
        }
        return $total;
    }

    /**
     * Meghatározza az armor slot-ot az iconPath alapján
     * pl. bone-cap.png → armor_cap, leather-boots.png → armor_boots
     */
    private function resolveArmorSlot($iconPath)
    {
        $icon = strtolower(basename($iconPath));
        if (strpos($icon, 'cap') !== false || strpos($icon, 'helmet') !== false || strpos($icon, 'head') !== false)
            return 'armor_cap';
        if (strpos($icon, 'plate') !== false || strpos($icon, 'chest') !== false || strpos($icon, 'body') !== false)
            return 'armor_plate';
        if (strpos($icon, 'leggings') !== false || strpos($icon, 'leg') !== false || strpos($icon, 'pant') !== false)
            return 'armor_leggings';
        if (strpos($icon, 'boots') !== false || strpos($icon, 'boot') !== false || strpos($icon, 'feet') !== false || strpos($icon, 'shoe') !== false)
            return 'armor_boots';
        return null; // unknown, allow any armor slot
    }


    /**
     * Quest teljesítése – XP és pénz jóváírása
     */
    public function completeQuest($questId)
    {
        if (!$questId) {
            return ['success' => false, 'message' => 'Hiányzó: questId'];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM quest WHERE quest_id = ?");
        $stmt->execute([$questId]);
        $quest = $stmt->fetch();

        if (!$quest) {
            return ['success' => false, 'message' => 'Quest not found'];
        }

        $this->addCurrency($quest['currency'] ?? 0, $quest['spec_currency'] ?? 0);
        $this->addXP($quest['xp'] ?? 0);

        return ['success' => true, 'message' => 'Quest completed!'];
    }

    /**
     * XP hozzáadása és szintlépés kezelése
     */
    public function addXP($xpAmount)
    {
        $stmt = $this->pdo->prepare("SELECT lvl, xp FROM specie WHERE id = ?");
        $stmt->execute([$this->playerId]);
        $player = $stmt->fetch();

        if (!$player)
            return false;

        $newXP = $player['xp'] + $xpAmount;
        $newLevel = $player['lvl'];

        while ($newXP >= ($newLevel * 100)) {
            $newXP -= ($newLevel * 100);
            $newLevel++;
        }

        $stmt = $this->pdo->prepare("UPDATE specie SET xp = ?, lvl = ? WHERE id = ?");
        return $stmt->execute([$newXP, $newLevel, $this->playerId]);
    }
}
?>
