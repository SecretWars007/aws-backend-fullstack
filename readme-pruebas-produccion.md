# Reporte de Pruebas en Producción y Documentación de Endpoints

Este documento resume los endpoints verificados en la suite de pruebas de producción (`test-produccion.ps1`) y su funcionamiento en el ambiente de producción (`us-east-2`).

## Device Service

### 1. `POST /V1/device/identification`
- **Descripción:** Registra un nuevo dispositivo o devuelve el token si ya existe.
- **Request:**
  ```json
  {
      "device_id": "string",
      "device_type": "ANDROID | IOS",
      "product": "Zappi",
      "certificate": true,
      "version": "2.1.0",
      "event": 1
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "state": 1,
      "message": "Operación exitosa",
      "data": {
          "auth_token": "eyJhbG...",
          "certified_id": 1
      }
  }
  ```

### 2. `POST /V1/device/authenticate`
- **Descripción:** Autentica un dispositivo existente usando sus credenciales encriptadas.
- **Request:**
  ```json
  {
      "device_id": "string",
      "device_type": "ANDROID",
      "certificate": true,
      "encrypted_device": "string",
      "send_id": "string"
  }
  ```
- **Response (200 OK):** Devuelve `auth_token` y `certified_id`.

## Customer Service

### 3. `POST /V1/client/device/register/extension/get`
- **Descripción:** Obtiene el catálogo de extensiones de documento de identidad.
- **Request:** `{"auth_token": "...", "certified_id": 1}`
- **Response (200 OK):**
  ```json
  {
      "state": 1,
      "message": "Operación exitosa",
      "data": [
          {"name": "La Paz", "extension": "LP", "type": "Q"},
          {"name": "Santa Cruz", "extension": "SC", "type": "Q"}
      ]
  }
  ```

### 4. `POST /V1/register/validate/user`
- **Descripción:** Valida la existencia de un usuario por celular, CI o email.
- **Request:**
  ```json
  {
      "cellphone": "70000000",
      "document_number": "12345678",
      "document_type": "CI",
      "document_extension": "SC",
      "email": "correo@zappi.bo",
      "auth_token": "...",
      "certified_id": 1
  }
  ```
- **Response (200 OK):** Devuelve el ID interno del usuario registrado o esqueleto.

### 5. `POST /V1/register/init/face/recognition`
- **Descripción:** Inicializa una sesión para la prueba de vida (Biometría Facial). El TTL de la sesión es de 300 segundos.
- **Request:**
  ```json
  {
      "cellphone": "70000000",
      "document_number": "12345678",
      "document_type": "CI",
      "document_extension": "SC",
      "auth_token": "...",
      "certified_id": 1
  }
  ```
- **Response (200 OK):** Devuelve un `session_id`, imagen en base64 de instrucciones y texto indicativo.

### 6. `POST /V1/register/execute/face/recognition`
- **Descripción:** Recibe la selfie en Base64 y valida biométricamente.
- **Request:** `{"cellphone": "...", "selfie": "base64...", "session_id": "...", "auth_token": "...", "certified_id": 1}`
- **Response (200 OK):** Confirma la validación biométrica.

### 7. `POST /V1/register/create/account`
- **Descripción:** Completa el registro del usuario. Este proceso está configurado con **Rollback Transaccional** (si falla la DB se revierte en Cognito).
- **Request:**
  ```json
  {
      "id": 1,
      "cellphone": "70000000",
      "pin": "123456",
      "home_address": "Dirección",
      "is_married": false,
      "auth_token": "...",
      "certified_id": 1,
      "cic": "12345",
      "document_number": "12345678",
      "document_type": "CI",
      "email": "correo@zappi.bo"
  }
  ```
- **Response (200 OK):** Confirmación de creación de la cuenta en Cognito y PostgreSQL.

### 8. `POST /V1/client/login/get`
- **Descripción:** Inicia sesión con número de celular y PIN.
- **Request:** `{"mobile_number": "70000000", "pin": "123456", "auth_token": "...", "certified_id": 1}`
- **Response (200 OK):** Retorna `privateToken` del usuario.

## Wallet Service

### 9. `POST /V1/client/walletcards/information/get`
- **Descripción:** Obtiene los balances y tarjetas virtuales de la billetera.
- **Request:** `{"auth_token": "...", "certified_id": 1}`
- **Response (200 OK):** Devuelve la lista de cuentas con sus saldos respectivos en Bolivianos (BOL).

### 10. `POST /V1/recharge/parameters/get`
- **Descripción:** Obtiene la lista de proveedores de recargas (Tigo, Entel, Viva).
- **Request:** `{"auth_token": "..."}`
- **Response (200 OK):** Lista de proveedores habilitados.

### 11. `POST /V1/recharge/{provider}`
- **Descripción:** Realiza una recarga al proveedor (Ej. entel, tigo, viva).
- **Request:** `{"cellphone": "71234567", "amount": 20, "auth_token": "..."}`
- **Response (200 OK):** Movimiento de recarga confirmada y descuento del balance.

### 12. `POST /V1/transfers/token/generate`
- **Descripción:** Genera un token OTP de autorización (6 dígitos) para transferencias. El TTL en Redis/DB es de 180 segundos.
- **Request:** `{"cellphone": "70000099", "amount": 50, "auth_token": "..."}`
- **Response (200 OK):** Devuelve el token generado.

### 13. `POST /V1/transfers/execute`
- **Descripción:** Ejecuta una transferencia utilizando el token generado previamente.
- **Request:** `{"cellphone": "70000099", "amount": 50, "token": "123456", "auth_token": "..."}`
- **Response (200 OK):** Confirmación del movimiento en la billetera emisora y receptora.

### 14. `POST /V1/movements`
- **Descripción:** Obtiene el historial de movimientos (recargas y transferencias).
- **Request:** `{"auth_token": "...", "certified_id": 1}`
- **Response (200 OK):** Arreglo de movimientos (ID, monto, descripción).

---

## Verificación Adicional Implementada
- **Manejo de Errores Global**: Se ha estandarizado el patrón de respuesta para errores `{ "state": -1, "message": "...", "code": "...", "data": null }` o `-4` para 404 en todos los microservicios.
- **Versionamiento (V1 vs V2)**: Rutas como `/V2/device/identification` operan correctamente usando aliases configurados.
- **Inicialización de Base de Datos**: Las migraciones (scripts `schema.sql`) ahora se despliegan automáticamente al levantar los contenedores PostgreSQL a través del directorio `docker-entrypoint-initdb.d/`.
