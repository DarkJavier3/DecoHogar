<?php
// ===== CONFIGURACIÓN PARA AJAX =====
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// 1. Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'decohogar');

// 2. Conexión a MySQL
$conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Configurar charset para evitar problemas con acentos
$conexion->set_charset("utf8mb4");

// Verificar conexión
if ($conexion->connect_error) {
    die("❌ Error de conexión a la base de datos");
}

// 3. Verificar que sea POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("❌ Método no permitido");
}

// 4. Recibir y validar datos
$nombre_completo = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
$correo = isset($_POST['correo']) ? trim($_POST['correo']) : '';
$mensaje = isset($_POST['mensaje']) ? trim($_POST['mensaje']) : '';

// Validar que no estén vacíos
if (empty($nombre_completo) || empty($correo) || empty($mensaje)) {
    die("❌ Todos los campos son obligatorios");
}

// Validar longitud mínima del nombre
if (strlen($nombre_completo) < 3) {
    die("❌ El nombre debe tener al menos 3 caracteres");
}

// ✅ NUEVA VALIDACIÓN: El nombre NO puede contener números
if (preg_match('/[0-9]/', $nombre_completo)) {
    die("❌ El nombre no puede contener números");
}

// Validar formato de correo
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    die("❌ El correo electrónico no es válido");
}

// ✅ NUEVA VALIDACIÓN: Verificar si el correo ya existe
$sql_check = "SELECT id FROM contacto WHERE correo = ?";
$stmt_check = $conexion->prepare($sql_check);

if (!$stmt_check) {
    die("❌ Error al verificar correo: " . $conexion->error);
}

$stmt_check->bind_param("s", $correo);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows > 0) {
    $stmt_check->close();
    $conexion->close();
    die("❌ Este correo electrónico ya está registrado");
}

$stmt_check->close();

// Validar longitud del mensaje
if (strlen($mensaje) < 10) {
    die("❌ El mensaje debe tener al menos 10 caracteres");
}

// 5. Usar prepared statements para prevenir SQL Injection
$sql = "INSERT INTO contacto (nombre_completo, correo, mensaje) VALUES (?, ?, ?)";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    die("❌ Error al preparar consulta: " . $conexion->error);
}

// Vincular parámetros (s = string)
$stmt->bind_param("sss", $nombre_completo, $correo, $mensaje);

// 6. Ejecutar consulta
if ($stmt->execute()) {
    echo "✅ Mensaje enviado exitosamente. ¡Gracias por contactarnos, $nombre_completo!";
} else {
    // Verificar si el error es por correo duplicado
    if ($conexion->errno === 1062) {
        echo "❌ Este correo electrónico ya está registrado";
    } else {
        echo "❌ Error al guardar: " . $stmt->error;
    }
}

// 7. Cerrar conexiones
$stmt->close();
$conexion->close();
?>