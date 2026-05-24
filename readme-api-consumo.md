# Zappi API — Guía de Consumo Paso a Paso

**Base URL:**
```
https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod
```

**Región AWS:** `us-east-2`  
**Autenticación:** Todos los endpoints requieren `auth_token` en el body (JWT generado por Device Identification).

---

## Flujo Completo de Registro y Login

```
1. Device Identification  → obtener auth_token + certified_id
2. Device Authenticate    → refrescar auth_token (si el device ya existe)
3. Get Extension Catalog  → catálogo de extensiones de CI
4. Validate User          → validar identidad + pre-registrar en DB
5. Validate OTP           → confirmar código SMS
6. Init Face Recognition  → iniciar sesión biométrica
7. Execute Face Recognition → enviar selfie
8. Register Reference Code  → código de referido (opcional)
9. Create Account         → crear cuenta final en Cognito + wallet
10. Login                 → autenticar y obtener JWT (private_token)
11. Get Profile Parameters → parámetros de perfil post-login
12. Get Wallet Cards      → tarjetas y movimientos
13. Welcome Reference     → pantalla de bienvenida referidos
```

---

## Endpoints Detallados

---

### 1. Device Identification ⭐ PDF
**`POST /V1/device/identification`**

Registra o actualiza un dispositivo. Retorna claves de cifrado y `auth_token` necesario para todos los demás endpoints.

**Request:**
```json
{
  "event": 1,
  "product": "Zappi",
  "certificate": true,
  "device_id": "UNIQUE-DEVICE-ID-123",
  "device_type": "android",
  "notification_id": "FCM-TOKEN-OPCIONAL",
  "reference": "",
  "version": "1.0.0",
  "encrypted_device": "",
  "send_id": ""
}
```

**Campos requeridos:** `event`, `product`, `certificate`, `device_id`, `device_type`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "key": "115|59|58|...",
    "iv": "87|186|252|...",
    "certified_id": 2,
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> ⚠️ Guardar `auth_token` y `certified_id` — se usan en todos los pasos siguientes.

---

### 2. Device Authenticate ⭐ PDF
**`POST /V1/device/authenticate`**

Autentica un dispositivo ya registrado y refresca su `auth_token`.

**Request:**
```json
{
  "certificate": true,
  "device_id": "UNIQUE-DEVICE-ID-123",
  "device_type": "android",
  "encrypted_device": "",
  "send_id": ""
}
```

**Campos requeridos:** `certificate`, `device_id`, `device_type`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "key": "165|103|...",
    "iv": "28|108|...",
    "certified_id": 2,
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Extension Catalog ⭐ PDF
**`POST /V1/client/device/register/extension/get`**

Retorna el catálogo de extensiones departamentales de Bolivia para el CI.

**Request:**
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "extensions": [
      { "name": "La Paz",     "extension": "LP", "type": "Q" },
      { "name": "Sucre",      "extension": "CH", "type": "Q" },
      { "name": "Cochabamba", "extension": "CB", "type": "Q" },
      { "name": "Potosí",     "extension": "PT", "type": "Q" },
      { "name": "Oruro",      "extension": "OR", "type": "Q" },
      { "name": "Santa Cruz", "extension": "SC", "type": "Q" },
      { "name": "Tarija",     "extension": "TJ", "type": "Q" },
      { "name": "Beni",       "extension": "BE", "type": "Q" },
      { "name": "Pando",      "extension": "PA", "type": "Q" },
      { "name": "Extranjero", "extension": "EX", "type": "P" }
    ]
  }
}
```

---

### 4. Validate User ⭐ PDF
**`POST /V1/register/validate/user`**

Valida la identidad del usuario con su número de documento. Si no existe en la base de datos, lo pre-registra como skeleton. Retorna el `id` de usuario.

**Request:**
```json
{
  "cellphone": "70000099",
  "certified_id": 2,
  "document_number": "12345678",
  "document_type": "CI",
  "email": "usuario@gmail.com",
  "document_extension": "SC",
  "document_complement": "",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `cellphone`, `document_number`, `document_type`, `email`, `auth_token`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "id": 3,
    "cic": "",
    "home_address": "",
    "is_client": false,
    "is_married": false
  }
}
```

> ⚠️ Guardar `data.id` — es el `id` de usuario para los pasos siguientes.

---

### 5. Validate OTP ⭐ PDF
**`POST /V1/register/validate/otp`**

Valida el código OTP enviado por SMS al celular del usuario.

> **Nota:** En el entorno AWS actual, el OTP debe existir en la tabla `otp_sessions` de la BD. En producción, se envía vía Amazon SNS.

**Request:**
```json
{
  "cellphone": "70000099",
  "certified_id": 2,
  "otp": "123456",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `cellphone`, `certified_id`, `otp`, `auth_token`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "code": "OTP_VERIFIED",
    "transaction_id": 1234567890,
    "date": "2026-05-14 10:30:00"
  }
}
```

**Response 400 (OTP inválido o expirado):**
```json
{
  "state": 1,
  "message": "OTP not found or expired. Please request a new one."
}
```

---

### 6. Init Face Recognition ⭐ PDF
**`POST /V1/register/init/face/recognition`**

Inicia una sesión biométrica. Retorna instrucciones y un `session_id` que expira en 5 minutos.

**Request:**
```json
{
  "cellphone": "70000099",
  "certified_id": 2,
  "document_number": "12345678",
  "document_type": "CI",
  "document_extension": "SC",
  "document_complement": "",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `cellphone`, `certified_id`, `document_number`, `document_type`, `auth_token`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "instruction": "Por favor mire directamente a la cámara y mantenga su rostro dentro del marco",
    "image": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "session_id": "FR-SESSION-1778757538084-37287527e9e6"
  }
}
```

> ⚠️ Guardar `session_id` — expira en **5 minutos**.

---

### 7. Execute Face Recognition ⭐ PDF
**`POST /V1/register/execute/face/recognition`**

Envía la selfie en base64 para completar el desafío biométrico.

**Request:**
```json
{
  "session_id": "FR-SESSION-1778757538084-37287527e9e6",
  "selfie": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...",
  "certified_id": 2,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `session_id`, `selfie` (base64), `certified_id`, `auth_token`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "code": "FACE_VERIFIED",
    "transaction_id": 9605188896,
    "date": "2026-05-14 11:22:43"
  }
}
```

---

### 8. Register Reference Code ⭐ PDF
**`POST /V1/client/reference/register/code`**

Registra un código de referido asociado al usuario. Paso opcional del flujo de registro.

**Request:**
```json
{
  "cellphone": "70000099",
  "code": "AMIGO2026",
  "id": 3,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `code`, `id`, `auth_token`

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "code": "REFERENCE_APPLIED",
    "transaction_id": 4426888982,
    "date": "2026-05-14 11:22:45"
  }
}
```

---

### 9. Create Account ⭐ PDF
**`POST /V1/register/create/account`**

Finaliza el registro creando el usuario en **AWS Cognito**, actualizando el perfil en la BD y creando la **wallet** inicial.

**Request:**
```json
{
  "cellphone": "70000099",
  "certified_id": 2,
  "cic": "CIC12345",
  "device_type": "android",
  "document_number": "12345678",
  "document_type": "CI",
  "document_extension": "SC",
  "document_complement": "",
  "email": "usuario@gmail.com",
  "home_address": "Av. Principal 123",
  "id": 3,
  "is_citizen_eeuu": false,
  "is_client": false,
  "is_married": false,
  "otp": "123456",
  "pin": "123456",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `cellphone`, `certified_id`, `cic`, `device_type`, `document_number`, `document_type`, `email`, `id`, `otp`, `pin`, `auth_token`

> **Importante:** `pin` debe tener **mínimo 6 dígitos** (política de Cognito). El número de celular se convierte automáticamente a formato E.164 (`+591XXXXXXXX`).

**Response 200:**
```json
{
  "state": 0,
  "message": "¡Felicidades! Tu cuenta ha sido creada exitosamente.",
  "data": {
    "code": "ACCOUNT_CREATED",
    "transaction_id": 7272481320,
    "date": "2026-05-14 11:22:49"
  }
}
```

**Response 400 (usuario ya existe):**
```json
{
  "state": 1,
  "message": "User already exists in the system."
}
```

---

### 10. Login ⭐ PDF
**`POST /V1/client/login/get`**

Autentica al usuario contra **AWS Cognito** y retorna el `private_token` (JWT ID Token) junto con los datos del perfil.

**Request:**
```json
{
  "application": "Zappi",
  "certified_id": 2,
  "device_id": "UNIQUE-DEVICE-ID-123",
  "device_name": "Samsung Galaxy S21",
  "device_os": "Android",
  "is_root": false,
  "mobile_number": "70000099",
  "notification_id": "FCM-TOKEN-OPCIONAL",
  "pin": "123456",
  "version": "1.0.0",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos requeridos:** `mobile_number`, `pin`, `auth_token`

> **Importante:** El `mobile_number` se convierte automáticamente a E.164 (`+591XXXXXXXX`) para autenticarse en Cognito.

**Response 200:**
```json
{
  "state": 0,
  "message": "Bienvenido a Zappi",
  "data": {
    "private_token": "eyJraWQiOiJTR1Jn...",
    "mobile_number": "70000099",
    "time_session": 3600,
    "name": "GUSTAVO",
    "last_name": "PARKER",
    "second_last_name": "",
    "document_number": "12345678",
    "document_extension": "SC",
    "document_type": "CI",
    "email": "usuario@gmail.com",
    "city": "Santa Cruz",
    "id": 3,
    "register_completed": true,
    "is_client": false,
    "number_show_form": 0,
    "business": "",
    "RegisterShowForm": false
  }
}
```

> ⚠️ `private_token` es el JWT de Cognito (ID Token). Válido por **1 hora** (`time_session: 3600`).

---

### 11. Get Profile Parameters ⭐ PDF
**`POST /V1/profile/parameters/get`**

Retorna parámetros de configuración del perfil (greeting, dialogs, etc).

**Request:**
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "state": 0,
  "message": "OK",
  "data": {
    "greeting": "¡Hola Gus!",
    "show_dialog": false
  }
}
```

---

### 12. Get Wallet Cards ⭐ PDF
**`POST /V1/client/walletcards/information/get`**

Retorna las tarjetas de la wallet del usuario y el historial de movimientos.

**Request:**
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "state": 0,
  "message": "Operación exitosa",
  "data": {
    "wallet_cards": [
      {
        "id": 456789,
        "account": {
          "number": "70012345",
          "currency": "BOL",
          "type": "BIL"
        },
        "balance": 1250.50,
        "pan": "",
        "expiration_date": "",
        "code": "",
        "image": "",
        "enable": true
      }
    ],
    "actions": [
      {
        "date": "2026-05-10 09:00",
        "amount": -50.00,
        "currency": "BOL",
        "type": 12,
        "description": "BL PAGO TIGO",
        "detail": "Recarga de crédito",
        "destination_account": "77011223",
        "destination_account_name": null
      }
    ]
  }
}
```

---

### 13. Welcome Reference ⭐ PDF
**`POST /V1/client/reference/welcome`**

Pantalla de bienvenida para usuarios referidos.

> **Nota:** Según el PDF original, este endpoint retorna **404** intencionalmente. Es el comportamiento esperado del servidor de referencia.

**Response 404:**
```html
<!DOCTYPE html><html><body><pre>Cannot POST /V1/client/reference/welcome</pre></body></html>
```

---

## Manejo de Errores

Todos los endpoints retornan el mismo formato de error:

```json
{
  "state": 1,
  "message": "Descripción del error",
  "code": "ERROR_CODE"
}
```

| `state` | Significado |
|---------|-------------|
| `0` | Éxito |
| `1` | Error de negocio (400) |
| `-1` | Error interno del servidor (500) |

---

## Códigos de Transacción

Los endpoints de escritura retornan un objeto `TransactionData`:

| Campo | Descripción |
|-------|-------------|
| `code` | Identificador semántico del resultado |
| `transaction_id` | ID numérico aleatorio de la transacción |
| `date` | Timestamp de la operación (UTC) |

| `code` | Endpoint |
|--------|---------|
| `OTP_VERIFIED` | Validate OTP |
| `FACE_VERIFIED` | Execute Face Recognition |
| `REFERENCE_APPLIED` | Register Reference Code |
| `ACCOUNT_CREATED` | Create Account |

---

## Prueba Rápida con PowerShell

```powershell
# 1. Device Identification
$r = Invoke-RestMethod -Uri "https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod/V1/device/identification" `
     -Method POST -ContentType "application/json" `
     -Body '{"event":1,"product":"Zappi","certificate":true,"device_id":"mi-device","device_type":"android"}'

$token = $r.data.auth_token
$certId = $r.data.certified_id

# 10. Login (usuario ya registrado)
Invoke-RestMethod -Uri "https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod/V1/client/login/get" `
     -Method POST -ContentType "application/json" `
     -Body (@{mobile_number="70000099"; pin="123456"; application="Zappi"; certified_id=$certId; device_id="mi-device"; device_name="Test"; device_os="Android"; auth_token=$token} | ConvertTo-Json)
```

---

## Prueba Rápida con cURL

```bash
BASE="https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod"

# 1. Device Identification
curl -s -X POST "$BASE/V1/device/identification" \
  -H "Content-Type: application/json" \
  -d '{"event":1,"product":"Zappi","certificate":true,"device_id":"curl-device","device_type":"android"}' | jq .

# 10. Login
curl -s -X POST "$BASE/V1/client/login/get" \
  -H "Content-Type: application/json" \
  -d '{"mobile_number":"70000099","pin":"123456","application":"Zappi","certified_id":2,"device_id":"curl-device","device_name":"cURL","device_os":"Linux","auth_token":"TOKEN_AQUI"}' | jq .
```

---

## Estado de los Endpoints

| Endpoint | Origen | Estado |
|----------|--------|--------|
| `POST /V1/device/identification` | ⭐ PDF | ✅ Funcional |
| `POST /V1/device/authenticate` | ⭐ PDF | ✅ Funcional |
| `POST /V1/client/device/register/extension/get` | ⭐ PDF | ✅ Funcional |
| `POST /V1/register/validate/user` | ⭐ PDF | ✅ Funcional |
| `POST /V1/register/validate/otp` | ⭐ PDF | ✅ Funcional (requiere OTP en DB) |
| `POST /V1/register/init/face/recognition` | ⭐ PDF | ✅ Funcional |
| `POST /V1/register/execute/face/recognition` | ⭐ PDF | ✅ Funcional |
| `POST /V1/client/reference/register/code` | ⭐ PDF | ✅ Funcional |
| `POST /V1/register/create/account` | ⭐ PDF | ✅ Funcional (Cognito + DB + Wallet) |
| `POST /V1/client/login/get` | ⭐ PDF | ✅ Funcional (JWT Cognito real) |
| `POST /V1/profile/parameters/get` | ⭐ PDF | ✅ Funcional |
| `POST /V1/client/walletcards/information/get` | ⭐ PDF | ✅ Funcional |
| `POST /V1/client/reference/welcome` | ⭐ PDF | ⚠️ 404 intencional (según PDF) |
