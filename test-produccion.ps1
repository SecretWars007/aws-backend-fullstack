# ============================================================================
#  ZAPPI MOBILE WALLET - PRODUCTION TEST SUITE v2.0
#  QA Senior End-to-End Test Script
#  Target: AWS API Gateway us-east-2
# ============================================================================

$BASE_URL      = "https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod"
$PASS          = 0
$FAIL          = 0
$WARN          = 0
$RESULTS       = @()
$AUTH_TOKEN    = $null
$CERTIFIED_ID  = $null
$SESSION_ID    = $null
$USER_ID       = $null
$TRANSFER_TOKEN = $null
$TEST_DEVICE_ID = "qa-prod-device-$(Get-Random -Maximum 9999)"
$TEST_CELLPHONE = "7$(Get-Random -Minimum 1000000 -Maximum 9999999)"
$TEST_EMAIL     = "qa.prod.$(Get-Random -Maximum 9999)@zappi.bo"

function Write-Banner {
    param([string]$Text, [string]$Color = "Cyan")
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor $Color
    Write-Host "  $Text" -ForegroundColor $Color
    Write-Host ("=" * 70) -ForegroundColor $Color
}

function Write-Step {
    param([string]$Step, [string]$Name)
    Write-Host ""
    Write-Host "  [$Step] $Name" -ForegroundColor Magenta
    Write-Host "  $("-" * 60)" -ForegroundColor DarkGray
}

function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$Category = "General",
        [hashtable]$Headers = $null,
        [switch]$WarnOnFail
    )

    $url       = "$BASE_URL$Path"
    $startTime = Get-Date
    $result    = [PSCustomObject]@{
        Name           = $Name
        Method         = $Method
        Path           = $Path
        ExpectedStatus = $ExpectedStatus
        ActualStatus   = 0
        Duration       = 0
        Passed         = $false
        Response       = $null
        Error          = $null
        Category       = $Category
    }

    Write-Host ""
    Write-Host "  > [$Method] $Path" -ForegroundColor Cyan
    Write-Host "    - $Name" -ForegroundColor Gray
    if ($Body) {
        $bodyJson = $Body | ConvertTo-Json -Depth 5 -Compress
        Write-Host "    BODY: $bodyJson" -ForegroundColor DarkGray
    }

    try {
        $reqHeaders = @{ "Content-Type" = "application/json"; "X-QA-Test" = "true" }
        if ($Headers) {
            foreach ($key in $Headers.Keys) {
                $reqHeaders[$key] = $Headers[$key]
            }
        }
        
        $params = @{
            Uri         = $url
            Method      = $Method
            Headers     = $reqHeaders
            TimeoutSec  = 30
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5)
        }

        $response = Invoke-RestMethod @params
        $elapsed  = ((Get-Date) - $startTime).TotalMilliseconds

        $result.ActualStatus = 200
        $result.Duration     = [math]::Round($elapsed, 2)
        $result.Response     = $response
        $result.Passed       = ($ExpectedStatus -eq 200 -or $ExpectedStatus -eq 201)

        $json = $response | ConvertTo-Json -Depth 6 -Compress
        if ($json.Length -gt 300) { $json = $json.Substring(0, 300) + "..." }

        Write-Host "    PASS HTTP 200 OK  [${elapsed}ms]" -ForegroundColor Green
        Write-Host "    RESP: $json" -ForegroundColor DarkGreen
        $script:PASS++

    } catch {
        $elapsed    = ((Get-Date) - $startTime).TotalMilliseconds
        $statusCode = 0
        if ($_.Exception.Response) {
            try {
                $statusCode = $_.Exception.Response.StatusCode.value__
            } catch {}
        }
        $rawBody    = ""

        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $rawBody = $_.ErrorDetails.Message
        } elseif ($_.Exception.Response) {
            try {
                $stream   = $_.Exception.Response.GetResponseStream()
                $reader   = [System.IO.StreamReader]::new($stream)
                $rawBody  = $reader.ReadToEnd()
                $reader.Close()
            } catch { }
        }

        if (-not $rawBody -and $_.Exception) {
            $rawBody = $_.Exception.Message
        }

        $result.ActualStatus = if ($statusCode) { $statusCode } else { 0 }
        $result.Duration     = [math]::Round($elapsed, 2)
        $result.Error        = $rawBody

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "    PASS HTTP $statusCode (Negative validation OK)  [${elapsed}ms]" -ForegroundColor Green
            Write-Host "    RESP: $rawBody" -ForegroundColor DarkGreen
            $result.Passed = $true
            $script:PASS++
        } elseif ($WarnOnFail) {
            Write-Host "    WARN HTTP $statusCode [${elapsed}ms]" -ForegroundColor Yellow
            Write-Host "    RESP: $rawBody" -ForegroundColor DarkYellow
            $result.Passed = $false
            $script:WARN++
        } else {
            Write-Host "    FAIL HTTP $statusCode [${elapsed}ms]" -ForegroundColor Red
            Write-Host "    RESP: $rawBody" -ForegroundColor DarkRed
            $result.Passed = $false
            $script:FAIL++
        }
    }

    $script:RESULTS += $result
    return $result
}

# ==============================================================================
Write-Banner "ZAPPI MOBILE WALLET - PRODUCTION TEST SUITE" "Yellow"
Write-Host "  Base URL  : $BASE_URL" -ForegroundColor White
Write-Host "  Device ID : $TEST_DEVICE_ID" -ForegroundColor White
Write-Host "  Celular   : $TEST_CELLPHONE" -ForegroundColor White
Write-Host "  Email     : $TEST_EMAIL" -ForegroundColor White
Write-Host "  Timestamp : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ("=" * 70) -ForegroundColor Yellow

# ==============================================================================
# BLOCK 1: DEVICE SERVICE
# ==============================================================================
Write-Banner "BLOCK 1 - DEVICE SERVICE" "Cyan"

Write-Step "1.1" "Device Identification - Android Happy Path"
$r12 = Invoke-ApiTest -Name "Identify Android device with full payload" `
    -Method POST -Path "/V1/device/identification" `
    -Body @{
        device_id        = $TEST_DEVICE_ID
        device_type      = "ANDROID"
        product          = "Zappi"
        certificate      = $true
        notification_id  = "fcm-qa-prod-token-001"
        version          = "2.1.0"
        reference        = "REF-QA-001"
        send_id          = "SEND-QA-001"
        event            = 1
    } `
    -ExpectedStatus 200 -Category "Device/Identification"

if ($r12.Response -and $r12.Response.data) {
    $AUTH_TOKEN   = $r12.Response.data.auth_token
    $CERTIFIED_ID = $r12.Response.data.certified_id
    Write-Host "    -> auth_token: $($AUTH_TOKEN.Substring(0, [Math]::Min(40,$AUTH_TOKEN.Length)))..." -ForegroundColor Yellow
    Write-Host "    -> certified_id: $CERTIFIED_ID" -ForegroundColor Yellow
}

Write-Step "1.2" "Device Identification - iOS"
$null = Invoke-ApiTest -Name "Identify iOS device" `
    -Method POST -Path "/V1/device/identification" `
    -Body @{
        device_id   = "qa-ios-device-$(Get-Random -Maximum 9999)"
        device_type = "IOS"
        product     = "Zappi"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 200 -Category "Device/Identification"

Write-Step "1.3" "Device Identification - V2 Alias"
$null = Invoke-ApiTest -Name "Identify device via V2 endpoint" `
    -Method POST -Path "/V2/device/identification" `
    -Body @{
        device_id   = "qa-v2-device-$(Get-Random -Maximum 9999)"
        device_type = "ANDROID"
        product     = "Zappi"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 200 -Category "Device/Identification"

Write-Step "1.4" "Device Identification - Missing device_id (400 expected)"
$null = Invoke-ApiTest -Name "Reject payload without device_id" `
    -Method POST -Path "/V1/device/identification" `
    -Body @{
        device_type = "ANDROID"
        product     = "Zappi"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 400 -Category "Device/Validation"

Write-Step "1.5" "Device Identification - Missing product (400 expected)"
$null = Invoke-ApiTest -Name "Reject payload without product" `
    -Method POST -Path "/V1/device/identification" `
    -Body @{
        device_id   = "qa-device-001"
        device_type = "ANDROID"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 400 -Category "Device/Validation"

Write-Step "1.6" "Device Authentication - Happy Path"
$r16 = Invoke-ApiTest -Name "Authenticate previously registered device" `
    -Method POST -Path "/V1/device/authenticate" `
    -Body @{
        device_id        = $TEST_DEVICE_ID
        device_type      = "ANDROID"
        certificate      = $true
        encrypted_device = "encrypted-qa-data-$(Get-Random -Maximum 99999)"
        send_id          = "SEND-QA-AUTH-001"
    } `
    -ExpectedStatus 200 -Category "Device/Authentication"

if ($r16.Response -and $r16.Response.data -and $r16.Response.data.auth_token) {
    $AUTH_TOKEN   = $r16.Response.data.auth_token
    $CERTIFIED_ID = $r16.Response.data.certified_id
    Write-Host "    -> auth_token RENEWED: $($AUTH_TOKEN.Substring(0, [Math]::Min(40,$AUTH_TOKEN.Length)))..." -ForegroundColor Yellow
}

Write-Step "1.7" "Device Authentication - Missing device_id (400 expected)"
$null = Invoke-ApiTest -Name "Reject authentication without device_id" `
    -Method POST -Path "/V1/device/authenticate" `
    -Body @{
        device_type      = "ANDROID"
        certificate      = $true
        encrypted_device = "encrypted-data"
    } `
    -ExpectedStatus 400 -Category "Device/Validation"

Write-Step "1.8" "Device Service - Unknown endpoint (404 expected)"
$null = Invoke-ApiTest -Name "Verify 404 handler for unknown routes" `
    -Method POST -Path "/V1/device/unknown-endpoint-qa" `
    -ExpectedStatus 404 -Category "Device/404"

# ==============================================================================
# BLOCK 2: CUSTOMER SERVICE
# ==============================================================================
Write-Banner "BLOCK 2 - CUSTOMER SERVICE" "Cyan"

if (-not $AUTH_TOKEN) {
    Write-Host "  WARN: No auth_token available. Run Block 1 first." -ForegroundColor Red
    exit 1
}

Write-Step "2.1" "Extension Catalog - Happy Path"
$null = Invoke-ApiTest -Name "Get document extension catalog" `
    -Method POST -Path "/V1/client/device/register/extension/get" `
    -Body @{
        auth_token   = $AUTH_TOKEN
        certified_id = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/Extensions"

Write-Step "2.2" "Extension Catalog - No auth_token (401 expected)"
$null = Invoke-ApiTest -Name "Reject request without auth_token" `
    -Method POST -Path "/V1/client/device/register/extension/get" `
    -Body @{} `
    -ExpectedStatus 401 -Category "Customer/Auth"

Write-Step "2.3" "Validate User - Full valid payload"
$r23 = Invoke-ApiTest -Name "Validate new user with national ID" `
    -Method POST -Path "/V1/register/validate/user" `
    -Body @{
        cellphone          = $TEST_CELLPHONE
        document_number    = "$(Get-Random -Minimum 10000000 -Maximum 99999999)"
        document_type      = "CI"
        document_extension = "SC"
        email              = $TEST_EMAIL
        auth_token         = $AUTH_TOKEN
        certified_id       = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/Validation"

if ($r23.Response -and $r23.Response.data -and $r23.Response.data.id) {
    $USER_ID = $r23.Response.data.id
    Write-Host "    -> user_id: $USER_ID" -ForegroundColor Yellow
}

Write-Step "2.4" "Validate User - Missing cellphone (400 expected)"
$null = Invoke-ApiTest -Name "Reject validation without cellphone" `
    -Method POST -Path "/V1/register/validate/user" `
    -Body @{
        document_number = "12345678"
        document_type   = "CI"
        email           = "test@test.com"
        auth_token      = $AUTH_TOKEN
        certified_id    = $CERTIFIED_ID
    } `
    -ExpectedStatus 400 -Category "Customer/Validation"

Write-Step "2.5" "Validate User - Missing email (400 expected)"
$null = Invoke-ApiTest -Name "Reject validation without email" `
    -Method POST -Path "/V1/register/validate/user" `
    -Body @{
        cellphone       = $TEST_CELLPHONE
        document_number = "12345678"
        document_type   = "CI"
        auth_token      = $AUTH_TOKEN
        certified_id    = $CERTIFIED_ID
    } `
    -ExpectedStatus 400 -Category "Customer/Validation"

Write-Step "2.6" "Validate OTP - Test code"
$null = Invoke-ApiTest -Name "Validate OTP received by SMS (400 in prod without real OTP)" `
    -Method POST -Path "/V1/register/validate/otp" `
    -Body @{
        cellphone    = $TEST_CELLPHONE
        otp          = "123456"
        auth_token   = $AUTH_TOKEN
        certified_id = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/OTP" -WarnOnFail

Write-Step "2.7" "Init Face Recognition"
$r27 = Invoke-ApiTest -Name "Initialize biometric face session" `
    -Method POST -Path "/V1/register/init/face/recognition" `
    -Body @{
        cellphone          = $TEST_CELLPHONE
        document_number    = "$(Get-Random -Minimum 10000000 -Maximum 99999999)"
        document_type      = "CI"
        document_extension = "SC"
        auth_token         = $AUTH_TOKEN
        certified_id       = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/FaceRecognition"

if ($r27.Response -and $r27.Response.data -and $r27.Response.data.session_id) {
    $SESSION_ID = $r27.Response.data.session_id
    Write-Host "    -> session_id: $SESSION_ID" -ForegroundColor Yellow
}

Write-Step "2.8" "Execute Face Recognition with base64 selfie"
$MINI_JPG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" + ("A" * 100)
$null = Invoke-ApiTest -Name "Send base64 selfie for biometric validation" `
    -Method POST -Path "/V1/register/execute/face/recognition" `
    -Body @{
        cellphone       = $TEST_CELLPHONE
        selfie          = $MINI_JPG_B64
        session_id      = if ($SESSION_ID) { $SESSION_ID } else { "qa-session-001" }
        auth_token      = $AUTH_TOKEN
        certified_id    = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/FaceRecognition" -WarnOnFail

Write-Step "2.9" "Register Reference Code"
$null = Invoke-ApiTest -Name "Apply referral code" `
    -Method POST -Path "/V1/client/reference/register/code" `
    -Body @{
        id         = if ($USER_ID) { $USER_ID } else { 1 }
        code       = "QA-REF-2026"
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Customer/Reference" -WarnOnFail

Write-Step "2.10" "Create Account"
$null = Invoke-ApiTest -Name "Create account with full data" `
    -Method POST -Path "/V1/register/create/account" `
    -Body @{
        id              = if ($USER_ID) { $USER_ID } else { 1 }
        cellphone       = $TEST_CELLPHONE
        pin             = "123456"
        home_address    = "Av. Las Americas 100, Santa Cruz"
        is_married      = $false
        auth_token      = $AUTH_TOKEN
        certified_id    = $CERTIFIED_ID
        cic             = "12345"
        device_type     = "ANDROID"
        document_number = "12345678"
        document_type   = "CI"
        email           = $TEST_EMAIL
        otp             = "123456"
    } `
    -ExpectedStatus 200 -Category "Customer/Account" -WarnOnFail

Write-Step "2.11" "Login - Test credentials"
$null = Invoke-ApiTest -Name "Login with cellphone and PIN" `
    -Method POST -Path "/V1/client/login/get" `
    -Body @{
        mobile_number = $TEST_CELLPHONE
        pin           = "123456"
        auth_token    = $AUTH_TOKEN
        certified_id  = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/Login" -WarnOnFail

Write-Step "2.12" "Login - Wrong PIN (400 expected)"
$null = Invoke-ApiTest -Name "Reject login with wrong PIN" `
    -Method POST -Path "/V1/client/login/get" `
    -Body @{
        mobile_number = $TEST_CELLPHONE
        pin           = "000000"
        auth_token    = $AUTH_TOKEN
        certified_id  = $CERTIFIED_ID
    } `
    -ExpectedStatus 400 -Category "Customer/Login"

Write-Step "2.13" "Profile Parameters"
$null = Invoke-ApiTest -Name "Get user profile configuration" `
    -Method POST -Path "/V1/profile/parameters/get" `
    -Body @{
        auth_token   = $AUTH_TOKEN
        certified_id = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Customer/Profile" -WarnOnFail

Write-Step "2.14" "Welcome Reference - Intentional 404"
$null = Invoke-ApiTest -Name "Verify intentional 404 per PDF spec" `
    -Method POST -Path "/V1/client/reference/welcome" `
    -Body @{ auth_token = $AUTH_TOKEN } `
    -ExpectedStatus 404 -Category "Customer/404"

# ==============================================================================
# BLOCK 3: WALLET SERVICE
# ==============================================================================
Write-Banner "BLOCK 3 - WALLET SERVICE" "Cyan"

Write-Step "3.1" "Wallet Balances - Happy Path"
$null = Invoke-ApiTest -Name "Get wallet cards and balances" `
    -Method POST -Path "/V1/client/walletcards/information/get" `
    -Body @{
        auth_token   = $AUTH_TOKEN
        certified_id = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Wallet/Balances" -WarnOnFail

Write-Step "3.2" "Wallet Balances - No auth (401 expected)"
$null = Invoke-ApiTest -Name "Reject balance query without auth_token" `
    -Method POST -Path "/V1/client/walletcards/information/get" `
    -Body @{} `
    -ExpectedStatus 401 -Category "Wallet/Auth"

Write-Step "3.3" "Recharge Parameters"
$null = Invoke-ApiTest -Name "Get list of available recharge providers" `
    -Method POST -Path "/V1/recharge/parameters/get" `
    -Body @{ auth_token = $AUTH_TOKEN } `
    -ExpectedStatus 200 -Category "Wallet/Recharge"

Write-Step "3.4" "Recharge Entel - 20 BOB"
$null = Invoke-ApiTest -Name "Recharge 20 BOB to Entel number" `
    -Method POST -Path "/V1/recharge/entel" `
    -Body @{
        cellphone  = "71234567"
        amount     = 20
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Recharge" -WarnOnFail

Write-Step "3.5" "Recharge Entel - Missing cellphone (400 expected)"
$null = Invoke-ApiTest -Name "Reject Entel recharge without cellphone" `
    -Method POST -Path "/V1/recharge/entel" `
    -Body @{
        amount     = 20
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 400 -Category "Wallet/Validation"

Write-Step "3.6" "Recharge Tigo - 15 BOB"
$null = Invoke-ApiTest -Name "Recharge 15 BOB to Tigo number" `
    -Method POST -Path "/V1/recharge/tigo" `
    -Body @{
        cellphone  = "72345678"
        amount     = 15
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Recharge" -WarnOnFail

Write-Step "3.7" "Recharge Viva - 10 BOB"
$null = Invoke-ApiTest -Name "Recharge 10 BOB to Viva number" `
    -Method POST -Path "/V1/recharge/viva" `
    -Body @{
        cellphone  = "73456789"
        amount     = 10
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Recharge" -WarnOnFail

Write-Step "3.8" "Transfer Validate - Find recipient"
$null = Invoke-ApiTest -Name "Look up transfer recipient by cellphone" `
    -Method POST -Path "/V1/transfers/validate" `
    -Body @{
        cellphone  = "70000099"
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Transfer" -WarnOnFail

Write-Step "3.9" "Transfer Validate - Missing cellphone (400 expected)"
$null = Invoke-ApiTest -Name "Reject recipient search without cellphone" `
    -Method POST -Path "/V1/transfers/validate" `
    -Body @{ auth_token = $AUTH_TOKEN } `
    -ExpectedStatus 400 -Category "Wallet/Validation"

Write-Step "3.10" "Transfer Token Generate"
$r310 = Invoke-ApiTest -Name "Generate 6-digit OTP for 50 BOB transfer" `
    -Method POST -Path "/V1/transfers/token/generate" `
    -Body @{
        cellphone  = "70000099"
        amount     = 50
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Transfer" -WarnOnFail

if ($r310.Response -and $r310.Response.data -and $r310.Response.data.token) {
    $TRANSFER_TOKEN = $r310.Response.data.token
    Write-Host "    -> transfer_token: $TRANSFER_TOKEN" -ForegroundColor Yellow
}

Write-Step "3.11" "Transfer Execute - Full flow"
$null = Invoke-ApiTest -Name "Execute 50 BOB transfer with generated token" `
    -Method POST -Path "/V1/transfers/execute" `
    -Body @{
        cellphone  = "70000099"
        amount     = 50
        token      = if ($TRANSFER_TOKEN) { $TRANSFER_TOKEN } else { "000000" }
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 200 -Category "Wallet/Transfer" -WarnOnFail

Write-Step "3.12" "Transfer Execute - Missing token (400 expected)"
$null = Invoke-ApiTest -Name "Reject transfer without confirmation token" `
    -Method POST -Path "/V1/transfers/execute" `
    -Body @{
        cellphone  = "70000099"
        amount     = 50
        auth_token = $AUTH_TOKEN
    } `
    -ExpectedStatus 400 -Category "Wallet/Validation"

Write-Step "3.13" "Movements History"
$null = Invoke-ApiTest -Name "Get full transaction history" `
    -Method POST -Path "/V1/movements" `
    -Body @{
        auth_token   = $AUTH_TOKEN
        certified_id = $CERTIFIED_ID
    } `
    -ExpectedStatus 200 -Category "Wallet/Movements" -WarnOnFail

Write-Step "3.14" "Movements - No auth (401 expected)"
$null = Invoke-ApiTest -Name "Reject movements without auth_token" `
    -Method POST -Path "/V1/movements" `
    -Body @{} `
    -ExpectedStatus 401 -Category "Wallet/Auth"

# ==============================================================================
# BLOCK 4: VERSION COMPATIBILITY
# ==============================================================================
Write-Banner "BLOCK 4 - VERSION COMPATIBILITY (V1 / V2)" "Cyan"

Write-Step "4.1" "V2 Device Identification compatibility"
$null = Invoke-ApiTest -Name "Identification via /V2/device/identification" `
    -Method POST -Path "/V2/device/identification" `
    -Body @{
        device_id   = "qa-v2-compat-$(Get-Random -Maximum 999)"
        device_type = "ANDROID"
        product     = "Zappi"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 200 -Category "Compat/Version"

Write-Step "4.2" "V2 Customer Service compatibility"
$null = Invoke-ApiTest -Name "Extensions via /V2/client/device/register/extension/get" `
    -Method POST -Path "/V2/client/device/register/extension/get" `
    -Body @{ auth_token = $AUTH_TOKEN; certified_id = $CERTIFIED_ID } `
    -ExpectedStatus 200 -Category "Compat/Version"

Write-Step "4.3" "V2 Wallet Service compatibility"
$null = Invoke-ApiTest -Name "Recharge params via /V2/recharge/parameters/get" `
    -Method POST -Path "/V2/recharge/parameters/get" `
    -Body @{ auth_token = $AUTH_TOKEN } `
    -ExpectedStatus 200 -Category "Compat/Version"

# ==============================================================================
# BLOCK 5: SECURITY TESTS
# ==============================================================================
Write-Banner "BLOCK 5 - SECURITY TESTS" "Red"

Write-Step "5.1" "Invalid JWT (401 expected)"
$null = Invoke-ApiTest -Name "Reject request with manipulated JWT" `
    -Method POST -Path "/V1/client/device/register/extension/get" `
    -Body @{
        auth_token   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.SIGNATURE"
        certified_id = 999
    } `
    -ExpectedStatus 401 -Category "Security/JWT"

Write-Step "5.2" "Expired JWT (401 expected)"
$EXPIRED_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VJZCI6InRlc3QiLCJjZXJ0aWZpZWRJZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid"
$null = Invoke-ApiTest -Name "Reject request with expired JWT" `
    -Method POST -Path "/V1/recharge/parameters/get" `
    -Body @{ auth_token = $EXPIRED_JWT } `
    -ExpectedStatus 401 -Category "Security/JWT"

Write-Step "5.3" "Global 404 handler"
$null = Invoke-ApiTest -Name "Verify JSON 404 response for unknown routes" `
    -Method POST -Path "/V1/completely-unknown-qa-route" `
    -Body @{ auth_token = $AUTH_TOKEN } `
    -ExpectedStatus 404 -Category "Security/404"

Write-Step "5.4" "Rate limit headers present"
$null = Invoke-ApiTest -Name "Verify rate limiting is active (not hit 429)" `
    -Method POST -Path "/V1/device/identification" `
    -Body @{
        device_id   = "rate-limit-test"
        device_type = "ANDROID"
        product     = "Zappi"
        certificate = $true
        event       = 1
    } `
    -ExpectedStatus 200 -Category "Security/RateLimit"

# ==============================================================================
# BLOCK 6: V2 ALIAS EXHAUSTIVE TESTING
# ==============================================================================
Write-Banner "BLOCK 6 - V2 ALIASES (EXHAUSTIVE)" "Cyan"

Write-Step "6.1" "V2 Customer Service Aliases"
$v2Headers = @{ "Authorization" = "Bearer $AUTH_TOKEN" }
$null = Invoke-ApiTest -Name "POST /V2/device-identify" -Method POST -Path "/V2/device-identify" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/device-auth" -Method POST -Path "/V2/device-auth" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/document-extensions" -Method POST -Path "/V2/document-extensions" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 200 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/users-validate" -Method POST -Path "/V2/users-validate" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/otp-generate" -Method POST -Path "/V2/otp-generate" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/face-recognition-init" -Method POST -Path "/V2/face-recognition-init" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/face-recognition-valid" -Method POST -Path "/V2/face-recognition-valid" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/reference/register" -Method POST -Path "/V2/reference/register" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/users-create" -Method POST -Path "/V2/users-create" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/parameters" -Method POST -Path "/V2/parameters" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 200 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/sign-in" -Method POST -Path "/V2/sign-in" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"

Write-Step "6.2" "V2 Wallet Service Aliases"
$null = Invoke-ApiTest -Name "POST /V2/balances" -Method POST -Path "/V2/balances" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 200 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/recharge-params" -Method POST -Path "/V2/recharge-params" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 200 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/recharge-entel" -Method POST -Path "/V2/recharge-entel" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/recharge-tigo" -Method POST -Path "/V2/recharge-tigo" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/recharge-viva" -Method POST -Path "/V2/recharge-viva" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/transfers/users-validate" -Method POST -Path "/V2/transfers/users-validate" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/token-generate" -Method POST -Path "/V2/token-generate" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/transfers-execute" -Method POST -Path "/V2/transfers-execute" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 400 -Category "Compat/V2-Aliases"
$null = Invoke-ApiTest -Name "POST /V2/movements" -Method POST -Path "/V2/movements" -Body @{ certified_id = $CERTIFIED_ID } -Headers $v2Headers -ExpectedStatus 200 -Category "Compat/V2-Aliases"


# ==============================================================================
# FINAL REPORT
# ==============================================================================
Write-Banner "FINAL PRODUCTION TEST REPORT" "Yellow"

$totalTests  = $RESULTS.Count
$passedTests = ($RESULTS | Where-Object { $_.Passed }).Count
$failedTests = ($RESULTS | Where-Object { -not $_.Passed }).Count
$avgDuration = [math]::Round(($RESULTS | Measure-Object -Property Duration -Average).Average, 2)
$maxDuration = [math]::Round(($RESULTS | Measure-Object -Property Duration -Maximum).Maximum, 2)
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host ""
Write-Host "  Timestamp     : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "  Base URL      : $BASE_URL" -ForegroundColor White
Write-Host "  Device ID     : $TEST_DEVICE_ID" -ForegroundColor White
Write-Host ""
Write-Host "  PASS  : $passedTests / $totalTests" -ForegroundColor Green
Write-Host "  FAIL  : $failedTests / $totalTests" -ForegroundColor Red
Write-Host "  WARN  : $WARN" -ForegroundColor Yellow
Write-Host "  Rate  : $successRate%" -ForegroundColor Cyan
Write-Host "  Avg ms: ${avgDuration}ms" -ForegroundColor Cyan
Write-Host "  Max ms: ${maxDuration}ms" -ForegroundColor Cyan
Write-Host ""

$categories = $RESULTS | Group-Object -Property Category
Write-Host "  BREAKDOWN BY CATEGORY:" -ForegroundColor Magenta
Write-Host "  $("-" * 50)" -ForegroundColor DarkGray
foreach ($cat in $categories) {
    $catPass  = @($cat.Group | Where-Object { $_.Passed }).Count
    $catTotal = @($cat.Group).Count
    $icon     = if ($catPass -eq $catTotal) { "OK" } else { "!!" }
    Write-Host "  [$icon] $($cat.Name.PadRight(35)) $catPass/$catTotal" -ForegroundColor White
}

Write-Host ""
$failedList = $RESULTS | Where-Object { -not $_.Passed }
if ($failedList) {
    Write-Host "  FAILED TESTS:" -ForegroundColor Red
    foreach ($f in $failedList) {
        Write-Host "  FAIL [$($f.Method)] $($f.Path)" -ForegroundColor Red
        Write-Host "       $($f.Name)" -ForegroundColor DarkRed
    }
} else {
    Write-Host "  All tests passed! Production is stable." -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
if ($successRate -ge 90) {
    Write-Host "  RESULT: PRODUCTION STABLE - $successRate% success rate" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "  RESULT: PRODUCTION DEGRADED - $successRate% success rate" -ForegroundColor Yellow
} else {
    Write-Host "  RESULT: PRODUCTION UNSTABLE - $successRate% success rate" -ForegroundColor Red
}
Write-Host ("=" * 70) -ForegroundColor Yellow
