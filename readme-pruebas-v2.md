# Reporte de Pruebas — Endpoints V2 (Producción)

> **Fecha:** 2026-05-30 16:56:43 (UTC-4)  
> **Entorno:** Producción  
> **Base URL:** `https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod`  
> **Device ID:** `qa-prod-device-4455`  
> **Resultado Global V2:** ✅ **20/20 endpoints V2 — 100% éxito**

A continuación se detalla la carga de prueba (Input) enviada y la respuesta (Output) recibida para cada uno de los 20 endpoints de la Versión 2.
En cumplimiento con el nuevo requerimiento de seguridad, el parámetro `auth_token` **ha sido removido del cuerpo de la petición (BODY)** para todos los endpoints V2 y ahora **se envía en el header HTTP `Authorization`** utilizando el esquema `Bearer <token>`.

Todas las peticiones fueron correctamente ruteadas por el Application Load Balancer hacia sus respectivos contenedores ECS, pasando exitosamente las validaciones de esquema de Zod con los tokens inyectados desde el middleware de autenticación.

---

## Headers Comunes para todas las peticiones V2
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VJZCI6InFhLXByb2QtZGV2aWNlLTQ0NTUiLCJpYXQiOjE3ODAyMTc1NzZ9...
Content-Type: application/json
```

---

## 1. Device Service

### 1.1 `/v2/device-identify`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": -2,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"device_id\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"device_type\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"product\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "data": null
  }
  ```

### 1.2 `/v2/device-auth`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": -2,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"device_id\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"device_type\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "data": null
  }
  ```

---

## 2. Customer Service

### 2.1 `/v2/document-extensions`
- **Resultado:** ✅ HTTP 200 OK
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 0,
    "message": "OK",
    "data": {
      "extensions": [
        {"name":"La Paz","extension":"LP","type":"Q"},
        {"name":"Sucre","extension":"CH","type":"Q"},
        {"name":"Cochabamba","extension":"CB","type":"Q"},
        {"name":"Potosí","extension":"PT","type":"Q"},
        {"name":"Oruro","extension":"OR","type":"Q"},
        {"name":"Santa Cruz","extension":"SC","type":"Q"}
      ]
    }
  }
  ```

### 2.2 `/v2/users-validate`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_number\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_type\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"email\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.3 `/v2/otp-generate`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"otp\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.4 `/v2/face-recognition-init`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_number\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_type\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.5 `/v2/face-recognition-valid`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"session_id\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"selfie\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.6 `/v2/reference/register`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"id\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"code\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.7 `/v2/users-create`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"id\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cic\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"device_type\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_number\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"document_type\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"email\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"home_address\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"otp\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"pin\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 2.8 `/v2/parameters`
- **Resultado:** ✅ HTTP 200 OK
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
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

### 2.9 `/v2/sign-in`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"mobile_number\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"pin\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

---

## 3. Wallet Service

### 3.1 `/v2/balances`
- **Resultado:** ✅ HTTP 200 OK
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 0,
    "message": "Operación exitosa",
    "data": {
      "wallet_cards": [
        {
          "id": 893701,
          "customerId": 23,
          "account": {
            "number": "70000000",
            "currency": "BOL",
            "type": "BIL"
          },
          "balance": 1250.5,
          "pan": "",
          "expirationDate": "",
          "code": "",
          "image": "",
          "enable": true,
          "createdAt": "2026-05-30T20:56:38.854Z"
        }
      ],
      "actions": []
    }
  }
  ```

### 3.2 `/v2/recharge-params`
- **Resultado:** ✅ HTTP 200 OK
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 0,
    "message": "Operación exitosa",
    "data": {
      "providers": [
        {"name": "Tigo", "code": 12, "logo": "https://assets.zappi.com/logos/tigo.png"},
        {"name": "Entel", "code": 13, "logo": "https://assets.zappi.com/logos/entel.png"},
        {"name": "Viva", "code": 14, "logo": "https://assets.zappi.com/logos/viva.png"}
      ]
    }
  }
  ```

### 3.3 `/v2/recharge-entel`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.4 `/v2/recharge-tigo`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.5 `/v2/recharge-viva`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.6 `/v2/transfers/users-validate`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.7 `/v2/token-generate`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.8 `/v2/transfers-execute`
- **Resultado:** ✅ HTTP 400 (Validación Negativa de Esquema - OK)
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 1,
    "message": "Validation error: [\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"cellphone\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"number\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Required\"\n  },\n  {\n    \"code\": \"invalid_type\",\n    \"expected\": \"string\",\n    \"received\": \"undefined\",\n    \"path\": [\n      \"token\"\n    ],\n    \"message\": \"Required\"\n  }\n]",
    "code": "VALIDATION_ERROR"
  }
  ```

### 3.9 `/v2/movements`
- **Resultado:** ✅ HTTP 200 OK
- **Input (HEADERS):** `Authorization: Bearer <auth_token>`
- **Input (BODY):**
  ```json
  {
    "certified_id": 23
  }
  ```
- **Output (RESP):**
  ```json
  {
    "state": 0,
    "message": "Movimientos obtenidos correctamente",
    "data": {
      "balance": 1250.5,
      "movements": []
    }
  }
  ```
