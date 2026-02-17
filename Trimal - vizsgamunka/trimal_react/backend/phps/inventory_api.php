<?php
// inventory_api.php
require_once 'inventory_manager.php';

header('Content-Type: application/json');

// Csak bejelentkezett felhasználók számára
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$playerId = $_SESSION['user_id']; // Feltételezve, hogy a user_id a specie id
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$inventoryManager = new InventoryManager($pdo, $playerId);

switch ($method) {
    case 'GET':
        if ($action == 'get') {
            $inventory = $inventoryManager->getInventory();
            echo json_encode(['success' => true, 'data' => $inventory]);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'addItem':
                $result = $inventoryManager->addItem(
                    $input['itemType'],
                    $input['itemId'],
                    $input['quantity'] ?? 1
                );
                echo json_encode($result);
                break;
                
            case 'removeItem':
                $result = $inventoryManager->removeItem(
                    $input['itemType'],
                    $input['itemId'],
                    $input['quantity'] ?? 1
                );
                echo json_encode($result);
                break;
                
            case 'addCurrency':
                $result = $inventoryManager->addCurrency(
                    $input['normal'] ?? 0,
                    $input['spec'] ?? 0
                );
                echo json_encode($result);
                break;
                
            case 'equip':
                $result = $inventoryManager->equipItem(
                    $input['slot'],
                    $input['itemId']
                );
                echo json_encode($result);
                break;
                
            case 'unequip':
                $result = $inventoryManager->unequipItem($input['slot']);
                echo json_encode($result);
                break;
                
            case 'completeQuest':
                $result = $inventoryManager->completeQuest($input['questId']);
                echo json_encode($result);
                break;
        }
        break;
}
?>