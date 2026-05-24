$BASE = "https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod"

# Paso 1: Device Identification
Write-Host "=== PASO 1: Device Identification ===" -ForegroundColor Cyan
$devBody = '{"event":1,"product":"Zappi","certificate":true,"device_id":"test-device-001","device_type":"android"}'

$devResp = Invoke-RestMethod -Uri "$BASE/V1/device/identification" -Method POST -ContentType "application/json" -Body $devBody
$token  = $devResp.data.auth_token
$certId = $devResp.data.certified_id
Write-Host "certified_id: $certId" -ForegroundColor Yellow
Write-Host "auth_token obtenido OK" -ForegroundColor Green

# Paso 2: Login (usando Invoke-WebRequest para capturar errores)
Write-Host ""
Write-Host "=== PASO 2: Login ===" -ForegroundColor Cyan

$loginJson = @{
    application     = "Zappi"
    certified_id    = [int]$certId
    device_id       = "test-device-001"
    device_name     = "Samsung Galaxy S21"
    device_os       = "Android"
    is_root         = $false
    mobile_number   = "70000099"
    pin             = "123456"
    notification_id = ""
    version         = "1.0.0"
    auth_token      = $token
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $loginJson

try {
    $resp = Invoke-WebRequest -Uri "$BASE/V1/client/login/get" -Method POST -ContentType "application/json" -Body $loginJson -UseBasicParsing
    Write-Host ""
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    $errResp = $_.Exception.Response
    $statusCode = [int]$errResp.StatusCode
    $stream = $errResp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    
    Write-Host ""
    Write-Host "HTTP $statusCode" -ForegroundColor Red
    Write-Host "Response Body:" -ForegroundColor Red
    Write-Host $body
}
