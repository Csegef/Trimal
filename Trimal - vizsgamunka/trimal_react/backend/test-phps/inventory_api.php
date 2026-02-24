<?php
// phps/inventory_api.php
// Express backend hívja HTTP-n. Session helyett player_id + internal key.

require_once 'config.php';
require_once 'inventory_manager.php';

header('Content-Type: application/json');

// ─── Belső kulcs ellenőrzés (csak Express hívhatja) ─────────────────────────
$internalKey = $_SERVER['HTTP_X_INTERNAL_KEY'] ?? '';
$expectedKey = defined('PHP_INTERNAL_KEY') ? PHP_INTERNAL_KEY : 'trimal_internal_2024';

if ($internalKey !== $expectedKey) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

// ─── Player ID GET paraméterből ──────────────────────────────────────────────
$playerId = $_GET['player_id'] ?? null;
if (!$playerId || !is_numeric($playerId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing or invalid player_id']);
    exit;
}
$playerId = (int)$playerId;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$inventoryManager = new InventoryManager($pdo, $playerId);

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'get':
                echo json_encode(['success' => true, 'data' => $inventoryManager->getInventory()]);
                break;
            case 'getPlayerInfo':
                $info = $inventoryManager->getPlayerInfo();
                echo json_encode($info
                    ? ['success' => true, 'data' => $info]
                    : ['success' => false, 'message' => 'Player not found']
                );
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unknown GET action: ' . $action]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON body']);
            exit;
        }

        switch ($action) {
            case 'addItem':
                echo json_encode($inventoryManager->addItem(
                    $input['itemType'] ?? null,
                    $input['itemId'] ?? null,
                    $input['quantity'] ?? 1
                ));
                break;
            case 'removeItem':
                echo json_encode($inventoryManager->removeItem(
                    $input['itemType'] ?? null,
                    $input['itemId'] ?? null,
                    $input['quantity'] ?? 1
                ));
                break;
            case 'equip':
                echo json_encode($inventoryManager->equipItem(
                    $input['slot'] ?? null,
                    $input['itemId'] ?? null
                ));
                break;
            case 'unequip':
                echo json_encode($inventoryManager->unequipItem($input['slot'] ?? null));
                break;
            case 'sellItem':
                echo json_encode($inventoryManager->sellItem(
                    $input['itemType'] ?? null,
                    $input['itemId'] ?? null,
                    $input['quantity'] ?? 1
                ));
                break;
            case 'addCurrency':
                echo json_encode($inventoryManager->addCurrency(
                    $input['normal'] ?? 0,
                    $input['spec'] ?? 0
                ));
                break;
            case 'removeCurrency':
                echo json_encode($inventoryManager->removeCurrency(
                    $input['normal'] ?? 0,
                    $input['spec'] ?? 0
                ));
                break;
            case 'completeQuest':
                echo json_encode($inventoryManager->completeQuest($input['questId'] ?? null));
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unknown POST action: ' . $action]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>