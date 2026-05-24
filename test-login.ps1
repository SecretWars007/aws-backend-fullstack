$BASE = "https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod"

# Paso 1: Device Identification
Write-Host "=== PASO 1: Device Identification ===" -ForegroundColor Cyan

$devJson = '{"event":1,"product":"Zappi","certificate":true,"device_id":"test-device-001","device_type":"android"}'
[System.IO.File]::WriteAllText("$PWD\dev-body.json", $devJson, [System.Text.UTF8Encoding]::new($false))

$devResult = curl.exe -s -X POST "$BASE/V1/device/identification" -H "Content-Type: application/json" -d "@dev-body.json"
Write-Host $devResult

$devObj = $devResult | ConvertFrom-Json
$token  = $devObj.data.auth_token
$certId = $devObj.data.certified_id
Write-Host ""
Write-Host "certified_id: $certId" -ForegroundColor Yellow

if (-not $token) {
    Write-Host "ERROR: No se obtuvo auth_token" -ForegroundColor Red
    exit 1
}
Write-Host "auth_token: OK" -ForegroundColor Green

# Paso 2: Login
Write-Host ""
Write-Host "=== PASO 2: Login ===" -ForegroundColor Cyan

$loginObj = @{
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
}
$loginJson = $loginObj | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText("$PWD\login-body.json", $loginJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Enviando request..."
$loginResult = curl.exe -s -X POST "$BASE/V1/client/login/get" -H "Content-Type: application/json" -d "@login-body.json"

Write-Host ""
Write-Host "=== RESPUESTA ===" -ForegroundColor Cyan
try {
    $obj = $loginResult | ConvertFrom-Json
    $obj | ConvertTo-Json -Depth 5
} catch {
    Write-Host $loginResult
}

# Cleanup
Remove-Item -Path "$PWD\dev-body.json" -ErrorAction SilentlyContinue
Remove-Item -Path "$PWD\login-body.json" -ErrorAction SilentlyContinue
