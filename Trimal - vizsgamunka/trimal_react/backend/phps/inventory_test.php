<?php
// inventory_test.php
require_once 'inventory_manager.php';

// Teszteléshez: adjuk meg a játékos ID-t
$playerId = 1; // Az első játékos ID-ja
$inventoryManager = new InventoryManager($pdo, $playerId);

echo "<h1>Inventory Manager Test</h1>";

// 1. Aktuális inventory kiírása
echo "<h2>Current Inventory:</h2>";
$inventory = $inventoryManager->getInventory();
echo "<pre>" . print_r($inventory, true) . "</pre>";

// 2. Tárgy hozzáadása
echo "<h2>Adding item:</h2>";
$result = $inventoryManager->addItem('weapon', 1, 1); // Wooden axe
echo "<pre>" . print_r($result, true) . "</pre>";

// 3. Pénz hozzáadása
echo "<h2>Adding currency:</h2>";
$result = $inventoryManager->addCurrency(100, 5);
echo "<pre>" . print_r($result, true) . "</pre>";

// 4. Frissített inventory
echo "<h2>Updated Inventory:</h2>";
$inventory = $inventoryManager->getInventory();
echo "<pre>" . print_r($inventory, true) . "</pre>";

// 5. Felszerelés teszt
echo "<h2>Equipping item:</h2>";
$result = $inventoryManager->equipItem('weapon', 1);
echo "<pre>" . print_r($result, true) . "</pre>";

// 6. Quest teljesítés teszt
echo "<h2>Completing quest:</h2>";
$result = $inventoryManager->completeQuest(1);
echo "<pre>" . print_r($result, true) . "</pre>";
?>