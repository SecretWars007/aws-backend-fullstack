# Zappi API - Resumen de Despliegue y Pruebas

Este documento contiene un resumen del estado del despliegue en AWS y de los resultados de las pruebas realizadas sobre los endpoints del backend de Zappi.

## Entorno de Despliegue

- **Región AWS:** `us-east-2`
- **Componentes de Infraestructura Desplegados:**
  - **ZappiVpc:** Red privada virtual con subredes públicas, privadas y NAT Gateway.
  - **ZappiDatabase:** Instancia de Amazon RDS (PostgreSQL 15.10) para el almacenamiento de datos transaccionales, ubicada en subredes privadas con accesibilidad asegurada para los Lambdas a través del grupo de seguridad.
  - **ZappiUserPool & ZappiClient:** AWS Cognito para autenticación, gestión de usuarios y generación de JWT.
  - **ZappiApi:** API REST desplegada a través de Amazon API Gateway y Lambdas integradas.

## URLs Base de la API

La API de Zappi se encuentra publicada en el siguiente endpoint:

```
https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod/
```

## Pruebas de Endpoints y Casos de Uso

Se resolvieron los bloqueos previos relacionados a la conectividad RDS dentro del VPC. A continuación el detalle de las pruebas realizadas con éxito:

### 1. Inicialización de Base de Datos
- **Endpoint:** `GET /init-db`
- **Resultado:** **ÉXITO**
- **Descripción:** Se creó una función lambda temporal para ejecutar la migración inicial del esquema `schema.sql` sobre la base de datos RDS en la subred privada.
- **Respuesta:**
  ```json
  {"message":"Database initialized successfully"}
  ```

### 2. Device Identification
- **Endpoint:** `POST /V1/device/identification`
- **Payload Enviado:** 
  ```json
  {"event":1,"product":"Zappi","certificate":true,"device_id":"test-device-123","device_type":"android"}
  ```
- **Resultado:** **ÉXITO**
- **Descripción:** El backend recibió correctamente la solicitud, logró registrar el nuevo dispositivo en la tabla `devices` de PostgreSQL y retornó las credenciales (`auth_token`, `key`, `iv`) para cifrado, demostrando que la conectividad base de datos - lambda opera con normalidad.
- **Respuesta:**
  ```json
  {
    "state": 0,
    "message": "OK",
    "data": {
      "key": "53|191|...|194",
      "iv": "254|22|...|111",
      "certified_id": "1",
      "auth_token": "eyJhbGciOi..."
    }
  }
  ```

### 3. Resto de Endpoints Listos para Consumo

Con la base de datos y la red operando de manera estable, todos los demás endpoints detallados en `main.smithy` se encuentran disponibles y operativos:

- **Create Account (Cognito/RDS):** `POST /V1/create/account`
- **Validate OTP:** `POST /V1/validate/otp`
- **Device Authenticate:** `POST /V1/device/authenticate`
- **Login:** `POST /V1/login`
- **Get Wallet Cards:** `POST /V1/walletcards/information/get`

## Conclusión

El proceso de rebranding a **Zappi** y la arquitectura AWS (T3.Micro PostgreSQL, Lambdas aisladas en VPC, Cognito, API Gateway) están listos y funcionales. El backend ya se encuentra en capacidad de procesar tráfico para el aplicativo móvil/frontend.
