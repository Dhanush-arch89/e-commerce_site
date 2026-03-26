<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];
$action = $_GET['action'] ?? '';
$user_id = $input['user_id'] ?? $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'User ID is required to access the cart']);
    exit;
}

try {
    if ($action === 'get') {
        // Fetch cart items combined with product details
        $stmt = $pdo->prepare("
            SELECT c.product_id as id, c.quantity, p.title, p.price, p.image_url as image, p.category 
            FROM cart_items c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'cart' => $items]);

    } elseif ($action === 'add') {
        $product_id = $input['product_id'] ?? null;
        if (!$product_id) exit(json_encode(['success' => false, 'error' => 'Missing product_id']));

        // Check if item already exists in user's cart
        $stmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?");
            $stmt->execute([$existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)");
            $stmt->execute([$user_id, $product_id]);
        }
        echo json_encode(['success' => true]);

    } elseif ($action === 'update') {
        $product_id = $input['product_id'] ?? null;
        $delta = $input['delta'] ?? 0;
        
        $stmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $newQty = $existing['quantity'] + $delta;
            if ($newQty <= 0) {
                $stmt = $pdo->prepare("DELETE FROM cart_items WHERE id = ?");
                $stmt->execute([$existing['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
                $stmt->execute([$newQty, $existing['id']]);
            }
        }
        echo json_encode(['success' => true]);

    } elseif ($action === 'remove') {
        $product_id = $input['product_id'] ?? null;
        $stmt = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        echo json_encode(['success' => true]);
        
    } elseif ($action === 'clear') {
        $stmt = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true]);
        
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Cart processing error: ' . $e->getMessage()]);
}
?>
