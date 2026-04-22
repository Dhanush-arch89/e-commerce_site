<?php
require_once 'config.php';

// Retrieve POST payload for JSON body
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];
$action = $_GET['action'] ?? '';

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$name || !$email || !$password) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Email is already registered']);
            exit;
        }

        // Hash & Insert
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $hash]);
        $userId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'customer']
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Registration failed: ' . $e->getMessage()]);
    }

} elseif ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['success' => false, 'error' => 'Missing credentials']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Verify password hash
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']); // Clean output
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        }
        
    } catch (PDOException $e) {
         echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);
    }

} elseif ($action === 'list_users') {
    // Admin: fetch all users with order stats
    try {
        $stmt = $pdo->query("
            SELECT u.id, u.name, u.email, u.role, u.created_at,
                   COUNT(o.id) AS total_orders,
                   COALESCE(SUM(o.total_amount), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ");
        echo json_encode(['success' => true, 'users' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch users: ' . $e->getMessage()]);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Invalid action specified']);
}
