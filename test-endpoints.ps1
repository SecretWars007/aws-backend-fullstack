$BASE_URL = "https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod"
$PASS = 0
$FAIL = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null
    )
    $url = "$BASE_URL$Path"
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor DarkGray
    Write-Host "[$Method] $Path" -ForegroundColor Cyan
    Write-Host "  -> $Name" -ForegroundColor Gray
    try {
        $params = @{
            Uri        = $url
            Method     = $Method
            Headers    = @{ "Content-Type" = "application/json" }
            TimeoutSec = 20
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5)
        }
        $response = Invoke-RestMethod @params
        $json = $response | ConvertTo-Json -Depth 6 -Compress
        Write-Host "  OK  ->  $json" -ForegroundColor Green
        $script:PASS++
        return $response
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $msg  = $_.Exception.Message
        Write-Host "  FAIL (HTTP $code)  ->  $msg" -ForegroundColor Red
        $script:FAIL++
        return $null
    }
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host "  ZAPPI API - SUITE COMPLETA DE ENDPOINTS" -ForegroundColor Yellow
Write-Host "  Base URL: $BASE_URL" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Yellow

# --- 1. Device Identification ---
$r1 = Test-Endpoint -Name "Device Identification" -Method POST -Path "/V1/device/identification" -Body @{
    event       = 1
    product     = "Zappi"
    certificate = $true
    device_id   = "test-device-ps1"
    device_type = "android"
}
$AUTH_TOKEN   = $r1.data.auth_token
$CERTIFIED_ID = $r1.data.certified_id
Write-Host "  -> auth_token capturado: $([string]$AUTH_TOKEN)[0..30]" -ForegroundColor DarkYellow
Write-Host "  -> certified_id capturado: $CERTIFIED_ID" -ForegroundColor DarkYellow

# --- 2. Device Authenticate ---
$r2 = Test-Endpoint -Name "Device Authenticate" -Method POST -Path "/V1/device/authenticate" -Body @{
    certificate = $true
    device_id   = "test-device-ps1"
    device_type = "android"
}
if ($r2 -and $r2.data.auth_token) { $AUTH_TOKEN = $r2.data.auth_token }

# --- 3. Extension Catalog ---
$null = Test-Endpoint -Name "Get Extension Catalog" -Method POST -Path "/V1/client/device/register/extension/get" -Body @{
    auth_token = "$AUTH_TOKEN"
}

# --- 4. Validate User ---
$r4 = Test-Endpoint -Name "Validate User" -Method POST -Path "/V1/register/validate/user" -Body @{
    cellphone       = "70000099"
    certified_id    = [int]$CERTIFIED_ID
    document_number = "99999999"
    document_type   = "CI"
    email           = "newuser@zappi.bo"
    auth_token      = "$AUTH_TOKEN"
}
$USER_ID = if ($r4 -and $r4.data.id) { $r4.data.id } else { 1 }
Write-Host "  -> user_id capturado: $USER_ID" -ForegroundColor DarkYellow

# --- 5. Validate OTP (expected 400 in test env - no real SMS sent) ---
$null = Test-Endpoint -Name "Validate OTP (400 esperado - no hay OTP real)" -Method POST -Path "/V1/register/validate/otp" -Body @{
    cellphone    = "70000099"
    certified_id = [int]$CERTIFIED_ID
    otp          = "123456"
    auth_token   = "$AUTH_TOKEN"
}

# --- 6. Init Face Recognition ---
$r6 = Test-Endpoint -Name "Init Face Recognition" -Method POST -Path "/V1/register/init/face/recognition" -Body @{
    cellphone       = "70000099"
    certified_id    = [int]$CERTIFIED_ID
    document_number = "99999999"
    document_type   = "CI"
    auth_token      = "$AUTH_TOKEN"
}
$SESSION_ID = if ($r6 -and $r6.data.session_id) { $r6.data.session_id } else { "dummy-session" }
Write-Host "  -> session_id capturado: $SESSION_ID" -ForegroundColor DarkYellow

# --- 7. Execute Face Recognition ---
$null = Test-Endpoint -Name "Execute Face Recognition" -Method POST -Path "/V1/register/execute/face/recognition" -Body @{
    session_id   = "$SESSION_ID"
    selfie       = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    certified_id = [int]$CERTIFIED_ID
    auth_token   = "$AUTH_TOKEN"
}

# --- 8. Register Reference Code ---
$null = Test-Endpoint -Name "Register Reference Code" -Method POST -Path "/V1/client/reference/register/code" -Body @{
    cellphone  = "70000099"
    code       = "REF-TEST-01"
    id         = [long]$USER_ID
    auth_token = "$AUTH_TOKEN"
}

# --- 9. Create Account (may fail if user already exists in Cognito) ---
$null = Test-Endpoint -Name "Create Account (puede fallar si ya existe en Cognito)" -Method POST -Path "/V1/register/create/account" -Body @{
    cellphone       = "70000099"
    certified_id    = [int]$CERTIFIED_ID
    cic             = "CIC12345"
    device_type     = "android"
    document_number = "99999999"
    document_type   = "CI"
    email           = "newuser@zappi.bo"
    id              = [long]$USER_ID
    otp             = "123456"
    pin             = "1234"
    auth_token      = "$AUTH_TOKEN"
}

# --- 10. Login ---
$null = Test-Endpoint -Name "Login (requiere usuario en Cognito)" -Method POST -Path "/V1/client/login/get" -Body @{
    application   = "Zappi"
    certified_id  = [int]$CERTIFIED_ID
    device_id     = "test-device-ps1"
    device_name   = "PS-Test-Device"
    device_os     = "Android"
    mobile_number = "70000099"
    pin           = "1234"
    auth_token    = "$AUTH_TOKEN"
}

# --- 11. Get Profile Parameters ---
$null = Test-Endpoint -Name "Get Profile Parameters" -Method POST -Path "/V1/profile/parameters/get" -Body @{
    auth_token = "$AUTH_TOKEN"
}

# --- 12. Get Wallet Cards ---
$null = Test-Endpoint -Name "Get Wallet Cards" -Method POST -Path "/V1/client/walletcards/information/get" -Body @{
    auth_token = "$AUTH_TOKEN"
}

# --- 13. Welcome Reference (intentionally 404) ---
$null = Test-Endpoint -Name "Welcome Reference (404 intencional)" -Method POST -Path "/V1/client/reference/welcome" -Body @{
    auth_token = "$AUTH_TOKEN"
}

# --- Summary ---
Write-Host ""
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host "  RESUMEN FINAL" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host "  OK      : $PASS" -ForegroundColor Green
Write-Host "  FALLIDOS: $FAIL" -ForegroundColor Red
Write-Host "  TOTAL   : $($PASS + $FAIL)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Yellow
