<?php
require_once 'config.php';

$action = $_GET['action'] ?? 'all'; // Default fetch

try {
    if ($action === 'all') {
        // Get all products or filter by category and search
        $category = $_GET['category'] ?? 'all';
        $search = $_GET['search'] ?? '';
        
        $sql = "SELECT * FROM products WHERE 1=1";
        $params = [];
        
        if ($category !== 'all') {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        if (!empty($search)) {
            $sql .= " AND (title LIKE ? OR category LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $sql .= " ORDER BY id ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'products' => $products]);

    } elseif ($action === 'trending') {
        // Recommendation Module: Collaborative Filtering (Mocked via random trending subset)
        $stmt = $pdo->query("SELECT * FROM products ORDER BY RAND() LIMIT 4");
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'products' => $products]);

    } elseif ($action === 'similar') {
        // Recommendation Module: Content-Based Filtering (Mocked via 'electronics' category subset)
        $stmt = $pdo->query("SELECT * FROM products WHERE category = 'electronics' LIMIT 4");
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'products' => $products]);

    } elseif ($action === 'create') {
        // Admin: Add a new product to the database
        $input = json_decode(file_get_contents('php://input'), true);
        $title = $input['title'] ?? '';
        $price = $input['price'] ?? 0;
        $category = $input['category'] ?? '';
        $image_url = $input['image_url'] ?? '';
        $badge = $input['badge'] ?? null;

        if (empty($title) || $price <= 0 || empty($category) || empty($image_url)) {
            echo json_encode(['success' => false, 'error' => 'Missing required fields: title, price, category, image_url']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO products (title, price, category, image_url, badge) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $price, $category, $image_url, $badge]);

        echo json_encode(['success' => true, 'product_id' => $pdo->lastInsertId(), 'message' => 'Product added successfully']);

    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action parameter']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
