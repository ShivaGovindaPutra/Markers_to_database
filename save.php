<?php
// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$database = "maps";

// Initialize response array
$response = [];

try {
    // Create a PDO instance
    $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);

    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if lat and lng are set in the POST data
    if (isset($_POST['lat']) && isset($_POST['lng'])) {
        // Convert lat and lng to decimal values with the desired precision
        $lat = number_format(floatval($_POST['lat']), 14, '.', '');
        $lng = number_format(floatval($_POST['lng']), 14, '.', '');

        // Before executing the query, log the received values
        $response['message'] = 'Data saved successfully';

        // Perform an INSERT query to save the coordinates
        $sql = "INSERT INTO coordinates (latitude, longitude) VALUES (:lat, :lng)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':lat', $lat, PDO::PARAM_STR);
        $stmt->bindParam(':lng', $lng, PDO::PARAM_STR);
        $stmt->execute();
    } else {
        // If lat and lng are not set in the POST data
        $response['message'] = 'Invalid data';
    }
} catch (PDOException $e) {
    // Handle database connection errors
    $response['error'] = 'Connection failed: ' . $e->getMessage();
}

// Send the response as JSON
header('Content-Type: application/json');
echo json_encode($response);
?>
