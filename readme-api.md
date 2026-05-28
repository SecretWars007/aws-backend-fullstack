# 📖 Guía de Consumo y Pruebas — Zappi Mobile Wallet API (V1 & V2)

Bienvenido a la documentación oficial de consumo para los servicios backend de la Billetera Móvil **Zappi**. Esta guía detalla cómo invocar los endpoints de la API en producción, tanto en su versión canónica (`/V1`) como en sus alias simplificados (`/V2`), y explica cómo ejecutar la suite completa de pruebas automatizadas.

---

## 🌍 Entorno de Producción

- **Región AWS:** `us-east-2` (Ohio)
- **API Gateway (Base URL):** `https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod`
- **Protocolo:** HTTPS (TLS 1.2+)
- **Content-Type Requerido:** `application/json`

---

## 🔀 Arquitectura de Rutas: V1 vs V2

La API está diseñada para ser retrocompatible y ofrecer rutas simplificadas en la versión 2. **Ambas versiones apuntan a la misma lógica de negocio subyacente**.

| Flujo | Ruta Canónica V1 | Alias Simplificado V2 |
|---|---|---|
| **Identificación** | `/V1/device/identification` | `/V2/device-identify` |
| **Autenticación Disp.** | `/V1/device/authenticate` | `/V2/device-auth` |
| **Catálogo Regiones** | `/V1/client/device/register/extension/get` | `/V2/document-extensions` |
| **Validar Usuario** | `/V1/register/validate/user` | `/V2/users-validate` |
| **Generar OTP** | `/V1/register/validate/otp` | `/V2/otp-generate` |
| **Inicio Biometría** | `/V1/register/init/face/recognition` | `/V2/face-recognition-init` |
| **Validar Biometría** | `/V1/register/execute/face/recognition` | `/V2/face-recognition-valid` |
| **Crear Cuenta** | `/V1/register/create/account` | `/V2/users-create` |
| **Login (Sign In)** | `/V1/client/login/get` | `/V2/sign-in` |
| **Saldos Billetera** | `/V1/client/walletcards/information/get` | `/V2/balances` |
| **Catálogo Recargas** | `/V1/recharge/parameters/get` | `/V2/recharge-params` |
| **Recarga Entel** | `/V1/recharge/entel` | `/V2/recharge-entel` |
| **Validar Destinatario** | `/V1/transfers/validate` | `/V2/transfers/users-validate` |
| **Token Transferencia**| `/V1/transfers/token/generate` | `/V2/token-generate` |
| **Ejecutar Transf.** | `/V1/transfers/execute` | `/V2/transfers-execute` |

> 💡 **Tip:** Recomendamos el uso de `/V2/*` para nuevas integraciones por su simplicidad y claridad.

---

## 💻 Ejemplos de Consumo

### 1. Identificación Inicial de Dispositivo (V1 y V2)

Este es el **primer endpoint** que debes llamar. Registra el dispositivo y te devuelve un `auth_token` (JWT) válido por 24 horas.

**Ejemplo en V1:**
```bash
curl -X POST https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod/V1/device/identification \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "mi-android-001",
    "device_type": "ANDROID",
    "product": "Zappi",
    "certificate": true,
    "event": 1
  }'
```

**Ejemplo equivalente en V2 (`/V2/device-identify`):**
```bash
curl -X POST https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod/V2/device-identify \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "mi-android-001",
    "device_type": "ANDROID",
    "product": "Zappi",
    "certificate": true,
    "event": 1
  }'
```

**Respuesta Exitosa:**
```json
{
  "state": 0,
  "message": "Dispositivo identificado",
  "data": {
    "key": "...",
    "iv": "...",
    "certified_id": 1,
    "auth_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Consultar Saldos de Billetera (Requiere Auth)

Una vez obtenido el `auth_token`, puedes realizar operaciones seguras. Debe ser incluido dentro del `body` del request JSON.

**Ejemplo en V2 (`/V2/balances`):**
```bash
curl -X POST https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod/V2/balances \
  -H "Content-Type: application/json" \
  -d '{
    "auth_token": "eyJhbGciOiJIUzI1NiIs...",
    "certified_id": 1
  }'
```

---

## 🧪 Ejecución de la Suite de Pruebas Automatizadas

El archivo `test-produccion.ps1` contiene una suite exhaustiva diseñada por QA Senior. **Prueba absolutamente todas las rutas V1 y sus equivalentes V2**, asegurando compatibilidad, flujos completos y seguridad.

### Pasos para ejecutar:

1. **Abre una terminal de PowerShell** (Versión 5.1 o superior).
2. Asegúrate de estar en el directorio raíz del proyecto:
   ```powershell
   cd C:\Maestria\aws-backend-onboarding
   ```
3. Ejecuta el script. Al hacerlo, el script generará aleatoriamente un número de celular y un device_id para no colisionar con datos existentes, y ejecutará más de 55 casos de prueba consecutivos:
   ```powershell
   .\test-produccion.ps1
   ```

### ¿Qué prueba este script?
- **BLOCK 1:** Device Service (Registro y autenticación de dispositivos).
- **BLOCK 2:** Customer Service (Validación de usuarios, OTP simulado, Reconocimiento Facial mock, Creación de cuenta y Login).
- **BLOCK 3:** Wallet Service (Validación de transferencias, recargas Entel/Tigo/Viva, historial de movimientos).
- **BLOCK 4:** Compatibilidad legacy.
- **BLOCK 5:** Seguridad (Inyección de JWT falsos, JWT expirados, Rate Limiting y manejadores globales 404).
- **BLOCK 6:** **V2 ALIASES (EXHAUSTIVE)**: Garantiza que todas las rutas modernas `/V2/*` (ej. `/V2/sign-in`, `/V2/balances`, `/V2/transfers-execute`) funcionen exactamente igual que las rutas V1 sin romper los contratos Zod.

Al finalizar, verás un "Banner" verde con el porcentaje de éxito. En entornos estables, la tasa de éxito supera el **95%**.

---
> 🔐 **Importante**: La base de datos de producción implementa restricciones estrictas (Data Integrity). Si ejecutas la prueba manualmente enviando un número de celular (`cellphone`) que ya existe, el endpoint `/V1/register/validate/user` retornará correctamente un error 400 (Estado -1). El script automatizado previene esto generando números dinámicos en cada corrida.
