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

    // Check if the request method is POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get the latitude and longitude from the POST data
        $lat = $_POST['lat'];
        $lng = $_POST['lng'];

        // Perform a DELETE query to remove the coordinates
        $sql = "DELETE FROM coordinates WHERE latitude = :lat AND longitude = :lng";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':lat', $lat);
        $stmt->bindParam(':lng', $lng);
        $stmt->execute();

        echo json_encode(['message' => 'Data deleted successfully']);
    } else {
        echo json_encode(['message' => 'Invalid request method']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
}
?>
