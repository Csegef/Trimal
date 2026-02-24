<?php
// inventory_manager.php
require_once 'config.php';

class InventoryManager {
    private $pdo;
    private $playerId;

    public function __construct($pdo, $playerId) {
        $this->pdo = $pdo;
        $this->playerId = $playerId;
    }

    /**
     * Teljes inventory betöltése
     */
    public function getInventory() {
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
    private function defaultInventory() {
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
                'armor_head' => null,
                'armor_chest' => null,
                'armor_legs' => null,
                'armor_feet' => null
            ]
        ];
    }

    /**
     * Játékos alapadatainak lekérése (név, szint, xp, statok)
     */
    public function getPlayerInfo() {
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
            'id'        => $row['id'],
            'name'      => $row['name'],
            'lvl'       => $row['lvl'],
            'xp'        => $row['xp'],
            'xpForNext' => $xpForNext,
            'class'     => $row['class'],
            'hairStyle'  => $row['hair_style'],
            'beardStyle' => $row['beard_style'],
            'stats'     => [
                'strength'     => $row['strength'],
                'agility'      => $row['agility'],
                'intelligence' => $row['intelligence'],
                'endurance'    => $row['endurance'],
            ]
        ];
    }

    /**
     * Inventory mentése
     */
    public function saveInventory($inventory) {
        $json = json_encode($inventory, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $stmt = $this->pdo->prepare("UPDATE specie SET inventory_json = ? WHERE id = ?");
        return $stmt->execute([$json, $this->playerId]);
    }

    /**
     * Tárgy hozzáadása az inventoryhoz
     */
    public function addItem($itemType, $itemId, $quantity = 1) {
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
                'id'          => $itemId,
                'type'        => $itemType,
                'name'        => $itemDetails['name'],
                'rarity'      => $itemDetails['rarity'] ?? 'common',
                'quantity'    => $quantity,
                'description' => $itemDetails['description'] ?? '',
                'iconPath'    => $itemDetails['iconPath'] ?? '',
                'sell_price'  => $itemDetails['sell_price'] ?? 0,
            ];

            if ($itemType == 'weapon') {
                $newItem['base_damage'] = $itemDetails['base_damage'] ?? 0;
            } elseif ($itemType == 'food') {
                $newItem['category'] = $itemDetails['category'] ?? '';
                $newItem['buff_id']  = $itemDetails['buff_id'] ?? null;
            } elseif ($itemType == 'armor') {
                $newItem['armor_point'] = $itemDetails['armor_point'] ?? 0;
                $newItem['category']    = $itemDetails['slot'] ?? 'armor';
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
    public function removeItem($itemType, $itemId, $quantity = 1) {
        if (!$itemType || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: itemType, itemId'];
        }

        $inventory = $this->getInventory();

        foreach ($inventory['items'] as $key => &$item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $item['quantity'] -= $quantity;

                if ($item['quantity'] <= 0) {
                    // Ha fel van szerelve, levesszük
                    foreach ($inventory['equipped'] as $slot => $equippedId) {
                        if ($equippedId == $itemId) {
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
    public function sellItem($itemType, $itemId, $quantity = 1) {
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

        // Felszerelt tárgyat nem lehet eladni
        foreach ($inventory['equipped'] as $slot => $equippedId) {
            if ($equippedId == $itemId) {
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
            'earned'  => $sellPrice
        ];
    }

    /**
     * Pénz hozzáadása
     */
    public function addCurrency($normalAmount = 0, $specAmount = 0) {
        $inventory = $this->getInventory();
        $inventory['currency']['normal'] += (int)$normalAmount;
        $inventory['currency']['spec']   += (int)$specAmount;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency added', 'currency' => $inventory['currency']];
        }
        return ['success' => false, 'message' => 'Failed to add currency'];
    }

    /**
     * Pénz levonása
     */
    public function removeCurrency($normalAmount = 0, $specAmount = 0) {
        $inventory = $this->getInventory();

        if ($inventory['currency']['normal'] < $normalAmount ||
            $inventory['currency']['spec'] < $specAmount) {
            return ['success' => false, 'message' => 'Insufficient currency'];
        }

        $inventory['currency']['normal'] -= (int)$normalAmount;
        $inventory['currency']['spec']   -= (int)$specAmount;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency removed', 'currency' => $inventory['currency']];
        }
        return ['success' => false, 'message' => 'Failed to remove currency'];
    }

    /**
     * Felszerelés felvétele
     */
    public function equipItem($slot, $itemId) {
        if (!$slot || !$itemId) {
            return ['success' => false, 'message' => 'Hiányzó: slot, itemId'];
        }

        $inventory = $this->getInventory();

        $foundItem = null;
        foreach ($inventory['items'] as $item) {
            if ($item['id'] == $itemId && $item['quantity'] > 0) {
                $foundItem = $item;
                break;
            }
        }

        if (!$foundItem) {
            return ['success' => false, 'message' => 'Item not found in inventory'];
        }

        $validSlots = ['weapon', 'armor_head', 'armor_chest', 'armor_legs', 'armor_feet'];
        if (!in_array($slot, $validSlots)) {
            return ['success' => false, 'message' => 'Invalid equipment slot'];
        }

        if ($slot == 'weapon' && $foundItem['type'] != 'weapon') {
            return ['success' => false, 'message' => 'Item is not a weapon'];
        }
        if (strpos($slot, 'armor') === 0 && $foundItem['type'] != 'armor') {
            return ['success' => false, 'message' => 'Item is not armor'];
        }

        $inventory['equipped'][$slot] = $itemId;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item equipped', 'equipped' => $inventory['equipped']];
        }
        return ['success' => false, 'message' => 'Failed to equip item'];
    }

    /**
     * Felszerelés levétele
     */
    public function unequipItem($slot) {
        if (!$slot) {
            return ['success' => false, 'message' => 'Hiányzó: slot'];
        }

        $inventory = $this->getInventory();

        if (!array_key_exists($slot, $inventory['equipped'])) {
            return ['success' => false, 'message' => 'Invalid slot'];
        }

        $inventory['equipped'][$slot] = null;

        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item unequipped', 'equipped' => $inventory['equipped']];
        }
        return ['success' => false, 'message' => 'Failed to unequip item'];
    }

    /**
     * Tárgy részleteinek lekérése az adatbázisból
     */
    private function getItemDetails($itemType, $itemId) {
        $tables = [
            'weapon' => 'item_weapon',
            'armor'  => 'item_armor',
            'food'   => 'item_food',
            'misc'   => 'item_misc'
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
    private function calculateUsedSpace($items) {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['quantity'];
        }
        return $total;
    }

    /**
     * Quest teljesítése – XP és pénz jóváírása
     */
    public function completeQuest($questId) {
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
    public function addXP($xpAmount) {
        $stmt = $this->pdo->prepare("SELECT lvl, xp FROM specie WHERE id = ?");
        $stmt->execute([$this->playerId]);
        $player = $stmt->fetch();

        if (!$player) return false;

        $newXP    = $player['xp'] + $xpAmount;
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
