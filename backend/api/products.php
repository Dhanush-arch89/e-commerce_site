<?php
require_once 'config.php';

$action = $_GET['action'] ?? 'all'; // Default fetch

try {
    if ($action === 'all') {
        // Get all products or filter by category
        $category = $_GET['category'] ?? 'all';
        
        if ($category !== 'all') {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE category = ? ORDER BY id ASC");
            $stmt->execute([$category]);
        } else {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id ASC");
        }
        
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

    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action parameter']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
