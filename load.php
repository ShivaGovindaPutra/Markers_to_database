<?php
// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$database = "maps";

try {
    // Create a PDO instance
    $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);

    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch saved coordinates from the database
    $sql = "SELECT * FROM coordinates";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    // Fetch all rows as an associative array
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Send the data as JSON
    header('Content-Type: application/json');
    echo json_encode($rows);
} catch (PDOException $e) {
    // Handle database connection errors and send an error response
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
}
?>
