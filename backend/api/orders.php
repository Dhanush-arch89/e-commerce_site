<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];
$action = $_GET['action'] ?? '';

try {
    if ($action === 'create') {
        $user_id = $input['user_id'] ?? null;
        $subtotal = $input['subtotal'] ?? 0;
        $shipping = $input['shipping'] ?? 0;
        $tax = $input['tax'] ?? 0;
        $total = $input['total'] ?? 0;
        $items = $input['items'] ?? []; // Expected format: array of {id, quantity, price}

        if (!$user_id || empty($items)) {
            echo json_encode(['success' => false, 'error' => 'Invalid order data provided']);
            exit;
        }

        // Generate a random tracking ID (e.g., AURA837192)
        $tracking_id = 'AURA' . rand(100000, 999999);

        // Begin Transaction to ensure data integrity
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO orders (tracking_id, user_id, status, subtotal, shipping, tax, total_amount) VALUES (?, ?, 'In Transit', ?, ?, ?, ?)");
        $stmt->execute([$tracking_id, $user_id, $subtotal, $shipping, $tax, $total]);
        $order_id = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");
        foreach ($items as $item) {
            $itemStmt->execute([$order_id, $item['id'], $item['quantity'], $item['price']]);
        }

        // Successfully created order, now explicitly clear user's cart in DB
        $clearCart = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
        $clearCart->execute([$user_id]);

        $pdo->commit();

        echo json_encode(['success' => true, 'tracking_id' => $tracking_id]);

    } elseif ($action === 'track') {
        $tracking_id = $_GET['tracking_id'] ?? '';
        
        $stmt = $pdo->prepare("
            SELECT o.*, u.name as customer_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.tracking_id = ?
        ");
        $stmt->execute([$tracking_id]);
        $order = $stmt->fetch();

        if ($order) {
            echo json_encode(['success' => true, 'order' => $order]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Order not found']);
        }

    } elseif ($action === 'admin_all') {
        // Fetch all orders for the Admin Dashboard
        $stmt = $pdo->query("
            SELECT o.*, u.name as customer_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        ");
        echo json_encode(['success' => true, 'orders' => $stmt->fetchAll()]);

    } elseif ($action === 'update_status') {
        // Admin: Update order status
        $order_id = $input['order_id'] ?? null;
        $status = $input['status'] ?? '';
        $allowed = ['Pending', 'Processing', 'In Transit', 'Delivered', 'Completed', 'Cancelled'];

        if (!$order_id || !in_array($status, $allowed)) {
            echo json_encode(['success' => false, 'error' => 'Invalid order ID or status value']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $order_id]);

        echo json_encode(['success' => true, 'message' => 'Status updated']);

    } elseif ($action === 'user_orders') {
        // Fetch all orders for a specific logged-in user
        $user_id = $_GET['user_id'] ?? null;
        if (!$user_id) {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT o.*, u.name as customer_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'orders' => $stmt->fetchAll()]);

    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => 'Order processing error: ' . $e->getMessage()]);
}
?>
