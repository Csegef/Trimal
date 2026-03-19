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
        
        $inventory = [
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
            ],
            'stamina' => [
                'current' => 100,
                'max' => 100,
                'last_reset' => time()
            ],
            'active_quest' => null
        ];

        if ($row && !empty($row['inventory_json'])) {
            $dbInv = json_decode($row['inventory_json'], true);
            // Merge defaults with DB
            $inventory = array_merge($inventory, $dbInv);
            if (!isset($inventory['stamina'])) {
                $inventory['stamina'] = ['current' => 100, 'max' => 100, 'last_reset' => time()];
            }
            if (!isset($inventory['active_quest'])) {
                $inventory['active_quest'] = null;
            }
        }
        
        // Always refresh stamina on get (24h = 86400 seconds reset)
        $now = time();
        if ($now - $inventory['stamina']['last_reset'] >= 86400) {
            $inventory['stamina']['current'] = $inventory['stamina']['max'];
            $inventory['stamina']['last_reset'] = $now;
            // A mentés itt is megtörténhetne, de a get során elég ha frissen adjuk vissza,
            // és a következő saveInventory bementi. Vagy menthetjük azonnal.
            $this->saveInventory($inventory);
        }

        return $inventory;
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
        $inventory = $this->getInventory();
        
        // Tárgy adatainak lekérése
        $itemDetails = $this->getItemDetails($itemType, $itemId);
        if (!$itemDetails) {
            return ['success' => false, 'message' => 'Item not found'];
        }
        
        // Megnézzük, van-e már ilyen tárgy
        $found = false;
        foreach ($inventory['items'] as &$item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $item['quantity'] += $quantity;
                $found = true;
                break;
            }
        }
        
        // Ha nincs, hozzáadjuk
        if (!$found) {
            $newItem = [
                'id' => $itemId,
                'type' => $itemType,
                'name' => $itemDetails['name'],
                'rarity' => $itemDetails['rarity'],
                'quantity' => $quantity,
                'description' => $itemDetails['description'],
                'iconPath' => $itemDetails['iconPath']
            ];
            
            // Típus specifikus mezők hozzáadása
            if ($itemType == 'weapon') {
                $newItem['base_damage'] = $itemDetails['base_damage'];
            } elseif ($itemType == 'food') {
                $newItem['category'] = $itemDetails['category'];
                $newItem['buff_id'] = $itemDetails['buff_id'];
            } elseif ($itemType == 'armor') {
                $newItem['armor_point'] = $itemDetails['armor_point'];
                $newItem['category'] = 'Armor';
            }
            
            $inventory['items'][] = $newItem;
        }
        
        // Inventory használat frissítése
        $inventory['used'] = $this->calculateUsedSpace($inventory['items']);
        
        // Kapacitás ellenőrzés
        if ($inventory['used'] > $inventory['capacity']) {
            return ['success' => false, 'message' => 'Inventory full'];
        }
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item added successfully'];
        }
        
        return ['success' => false, 'message' => 'Failed to save inventory'];
    }
    
    /**
     * Tárgy eltávolítása az inventoryból
     */
    public function removeItem($itemType, $itemId, $quantity = 1) {
        $inventory = $this->getInventory();
        
        foreach ($inventory['items'] as $key => &$item) {
            if ($item['type'] == $itemType && $item['id'] == $itemId) {
                $item['quantity'] -= $quantity;
                
                if ($item['quantity'] <= 0) {
                    // Tárgy eltávolítása
                    array_splice($inventory['items'], $key, 1);
                }
                
                $inventory['used'] = $this->calculateUsedSpace($inventory['items']);
                
                if ($this->saveInventory($inventory)) {
                    return ['success' => true, 'message' => 'Item removed successfully'];
                }
                break;
            }
        }
        
        return ['success' => false, 'message' => 'Item not found'];
    }
    
    /**
     * Pénz hozzáadása
     */
    public function addCurrency($normalAmount = 0, $specAmount = 0) {
        $inventory = $this->getInventory();
        
        $inventory['currency']['normal'] += $normalAmount;
        $inventory['currency']['spec'] += $specAmount;
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency added'];
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
        
        $inventory['currency']['normal'] -= $normalAmount;
        $inventory['currency']['spec'] -= $specAmount;
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Currency removed'];
        }
        
        return ['success' => false, 'message' => 'Failed to remove currency'];
    }
    
    /**
     * Felszerelés felvétele
     */
    public function equipItem($slot, $itemId) {
        $inventory = $this->getInventory();
        
        // Ellenőrizzük, hogy a tárgy létezik-e az inventoryban
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
        
        // Slot ellenőrzés
        $validSlots = ['weapon', 'armor_head', 'armor_chest', 'armor_legs', 'armor_feet'];
        if (!in_array($slot, $validSlots)) {
            return ['success' => false, 'message' => 'Invalid equipment slot'];
        }
        
        // Típus ellenőrzés
        if ($slot == 'weapon' && $foundItem['type'] != 'weapon') {
            return ['success' => false, 'message' => 'Item is not a weapon'];
        }
        if (strpos($slot, 'armor') === 0 && $foundItem['type'] != 'armor') {
            return ['success' => false, 'message' => 'Item is not armor'];
        }
        
        $inventory['equipped'][$slot] = $itemId;
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item equipped'];
        }
        
        return ['success' => false, 'message' => 'Failed to equip item'];
    }
    
    /**
     * Felszerelés levétele
     */
    public function unequipItem($slot) {
        $inventory = $this->getInventory();
        $inventory['equipped'][$slot] = null;
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Item unequipped'];
        }
        
        return ['success' => false, 'message' => 'Failed to unequip item'];
    }
    
    /**
     * Tárgy részleteinek lekérése az adatbázisból
     */
    private function getItemDetails($itemType, $itemId) {
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
        $stmt = $this->pdo->prepare("SELECT * FROM $table WHERE item_id = ?");
        $stmt->execute([$itemId]);
        
        return $stmt->fetch();
    }
    
    /**
     * Inventory használt helyének kiszámítása
     */
    private function calculateUsedSpace($items) {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['quantity'] * 10; // Minden item 10 helyet foglal
        }
        return $total;
    }
    
    /**
     * Quest teljesítése - jutalmak hozzáadása
     */
    public function completeQuest($questId) {
        // Quest adatok lekérése
        $stmt = $this->pdo->prepare("SELECT * FROM quest WHERE quest_id = ?");
        $stmt->execute([$questId]);
        $quest = $stmt->fetch();
        
        if (!$quest) {
            return ['success' => false, 'message' => 'Quest not found'];
        }
        
        // Pénz hozzáadása
        $this->addCurrency($quest['currency'], $quest['spec_currency']);
        
        // XP hozzáadása
        $this->addXP($quest['xp']);
        
        return ['success' => true, 'message' => 'Quest completed!'];
    }
    
    /**
     * XP hozzáadása és szintlépés kezelése
     */
    public function addXP($xpAmount) {
        $stmt = $this->pdo->prepare("SELECT lvl, xp FROM specie WHERE id = ?");
        $stmt->execute([$this->playerId]);
        $player = $stmt->fetch();
        
        $newXP = $player['xp'] + $xpAmount;
        $newLevel = $player['lvl'];
        
        // Szintlépés (példa: 100 XP kell szintenként)
        while ($newXP >= ($newLevel * 100)) {
            $newXP -= ($newLevel * 100);
            $newLevel++;
        }
        
        $stmt = $this->pdo->prepare("UPDATE specie SET xp = ?, lvl = ? WHERE id = ?");
        return $stmt->execute([$newXP, $newLevel, $this->playerId]);
    }
    
    /**
     * Start an active quest
     */
    public function startActiveQuest($questName, $difficulty, $staminaCost, $durationStr, $rewardNormal, $rewardSpec) {
        $inventory = $this->getInventory();
        
        if ($inventory['active_quest'] !== null) {
            return ['success' => false, 'message' => 'A quest is already active'];
        }
        
        if ($inventory['stamina']['current'] < $staminaCost) {
            return ['success' => false, 'message' => 'Not enough stamina'];
        }
        
        // Parse "XXm YYs" format into seconds
        $durationSeconds = 60; // Default fallback
        if (preg_match('/(?:(\d+)m)?\s*(?:(\d+)s)?/', $durationStr, $matches)) {
            $m = isset($matches[1]) && $matches[1] !== '' ? (int)$matches[1] : 0;
            $s = isset($matches[2]) && $matches[2] !== '' ? (int)$matches[2] : 0;
            if ($m > 0 || $s > 0) {
                $durationSeconds = ($m * 60) + $s;
            }
        }
        
        $inventory['stamina']['current'] -= $staminaCost;
        
        $inventory['active_quest'] = [
            'name' => $questName,
            'difficulty' => $difficulty,
            'start_time' => time(),
            'duration' => $durationSeconds,
            'reward_normal' => $rewardNormal,
            'reward_spec' => $rewardSpec
        ];
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'data' => $inventory['active_quest']];
        }
        
        return ['success' => false, 'message' => 'Failed to start quest'];
    }
    
    /**
     * Claim completed quest rewards
     */
    public function claimActiveQuest() {
        $inventory = $this->getInventory();
        $quest = $inventory['active_quest'];
        
        if (!$quest) {
            return ['success' => false, 'message' => 'No active quest to claim'];
        }
        
        // Check if finished
        $now = time();
        $endTime = $quest['start_time'] + $quest['duration'];
        
        if ($now < $endTime) {
            return ['success' => false, 'message' => 'Quest is not finished yet'];
        }
        
        $inventory['currency']['normal'] += $quest['reward_normal'];
        $inventory['currency']['spec'] += $quest['reward_spec'];
        $inventory['active_quest'] = null;
        
        if ($this->saveInventory($inventory)) {
            return [
                'success' => true, 
                'message' => 'Quest claimed', 
                'rewards' => [
                    'normal' => $quest['reward_normal'],
                    'spec' => $quest['reward_spec']
                ]
            ];
        }
        
        return ['success' => false, 'message' => 'Failed to claim quest'];
    }
    
    /**
     * Developer skip active quest
     */
    public function skipActiveQuest() {
        $inventory = $this->getInventory();
        if (!$inventory['active_quest']) {
            return ['success' => false, 'message' => 'No active quest to skip'];
        }
        
        // Adjust start_time to make it finished
        $inventory['active_quest']['start_time'] = time() - $inventory['active_quest']['duration'] - 10;
        
        if ($this->saveInventory($inventory)) {
            return ['success' => true, 'message' => 'Quest skipped'];
        }
        return ['success' => false, 'message' => 'Failed to skip quest'];
    }
}
?>