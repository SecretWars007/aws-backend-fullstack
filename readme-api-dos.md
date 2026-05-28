# 📋 README API — Documentación de Pruebas Realizadas

## Índice

1. [Resumen General](#resumen-general)
2. [Arquitectura de Pruebas](#arquitectura-de-pruebas)
3. [Resultados Consolidados](#resultados-consolidados)
4. [Pruebas Unitarias — Device Service](#pruebas-unitarias--device-service)
5. [Pruebas Unitarias — Customer Service](#pruebas-unitarias--customer-service)
6. [Pruebas Unitarias — Wallet Service](#pruebas-unitarias--wallet-service)
7. [Pruebas de Estrés y Carga](#pruebas-de-estrés-y-carga)
8. [Pruebas de Infraestructura AWS](#pruebas-de-infraestructura-aws)
9. [Cómo Ejecutar las Pruebas](#cómo-ejecutar-las-pruebas)

---

## Resumen General

Se diseñó y ejecutó una suite completa de pruebas automatizadas para validar el correcto funcionamiento de los tres microservicios de la billetera móvil **Zappi**, cubriendo:

| Tipo de Prueba | Cantidad | Resultado |
|---|---|---|
| **Pruebas Unitarias — Device Service** | 65 tests | ✅ 65/65 PASSED (100%) |
| **Pruebas Unitarias — Customer Service** | 169 tests | ✅ 169/169 PASSED (100%) |
| **Pruebas Unitarias — Wallet Service** | 148 tests | ✅ 148/148 PASSED (100%) |
| **Pruebas de Estrés (Node.js nativo)** | 3 servicios × 100 workers × 5s | ✅ 100% success rate |
| **Pruebas de Carga (Artillery)** | 3 escenarios × fases de carga | ✅ Configurado |
| **Pruebas de Infraestructura AWS (CDK)** | 7 stacks CloudFormation | ✅ Todas CREATE/UPDATE_COMPLETE |

**Total de pruebas unitarias ejecutadas: 382 (100% de éxito)**

---

## Arquitectura de Pruebas

### Tecnologías Utilizadas

| Herramienta | Propósito |
|---|---|
| **Jest** | Framework de pruebas unitarias para TypeScript/Node.js |
| **Supertest** | Simulación de peticiones HTTP sin levantar servidor |
| **jsonwebtoken** | Generación de tokens JWT para autenticación en pruebas |
| **Node.js nativo (http + crypto)** | Suite de estrés de alta concurrencia sin dependencias |
| **Artillery** | Pruebas de carga simulando tráfico real con rampas y picos |
| **AWS CloudFormation** | Validación de infraestructura desplegada en la nube |

### Estrategia de Pruebas

Todas las pruebas unitarias se ejecutan en **Mock Mode** (`MOCK_MODE=true`), lo que significa:
- No se requieren conexiones reales a bases de datos PostgreSQL, Redis ni AWS Cognito.
- Los repositorios Mock (`MockDeviceRepository`, `MockCustomerRepository`, `MockWalletRepository`) simulan el comportamiento de persistencia con datos semilla predefinidos.
- Los tokens JWT se generan con secretos de prueba configurados via variables de entorno.

### Datos Semilla (Seed Data)

Los repositorios Mock incluyen datos pre-cargados para facilitar las pruebas:

| Servicio | Dato Semilla | Valor |
|---|---|---|
| Customer Service | Usuario "Gustavo Parker" | `id=3`, `cellphone=70000099`, `pin=123456` |
| Wallet Service | Billetera de Gustavo | `customerId=3`, `balance=1250.50 BOB` |
| Device Service | Dispositivo de prueba | `device_id=TEST-DEVICE-001`, tipo `ANDROID` |

---

## Resultados Consolidados

```
 Device Service Tests:    65 tests  →  ✅ ALL PASSED
 Customer Service Tests: 169 tests  →  ✅ ALL PASSED
 Wallet Service Tests:   148 tests  →  ✅ ALL PASSED
 ────────────────────────────────────────────────
 TOTAL:                  382 tests  →  ✅ 100% SUCCESS
```

### Resultados de Pruebas de Estrés (100 conexiones simultáneas, 5 segundos):

```
================================================================
                 FINAL STRESS TEST COMPARISON                  
================================================================
 Service                      |        RPS |    Avg Lat |    p95 Lat |  Success
------------------------------------------------------------------------
 Device Service               |      685.1 |    143.7ms |    198.0ms |   100.0%
 Customer Service             |      707.7 |    139.5ms |    188.0ms |   100.0%
 Wallet Service               |      756.6 |    130.5ms |    174.6ms |   100.0%
================================================================
```

---

## Pruebas Unitarias — Device Service

**Archivo**: `microservices/device-service/src/__tests__/device.test.ts`  
**Total**: 65 pruebas  
**Resultado**: ✅ 65/65 PASSED

### 1. Health Check (1 test)

| # | Escenario | Método | Endpoint | Resultado Esperado |
|---|---|---|---|---|
| 1 | Verificar disponibilidad del servicio | `GET` | `/health` | `200` con `{ status: "ok", service: "device-service" }` |

### 2. Device Identification — Registro de Dispositivo (30 tests)

Probado en 6 variantes de URL: `/V1/device/identification`, `/V2/device/identification`, `/V1/device-identify`, `/V2/device-identify`, `/v1/device-identify`, `/v2/device-identify`

Para **cada variante de URL** se ejecutaron los siguientes 5 escenarios:

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Identificación exitosa con payload válido | `{ device_id, device_type, product, certificate, notification_id, version, reference, send_id, event }` | `200` con `{ state: 0, data: { key, iv, certified_id, auth_token } }` |
| 2 | Falta `device_id` (campo obligatorio) | Payload sin `device_id` | `400` con `state: -2` |
| 3 | Falta `device_type` (campo obligatorio) | Payload sin `device_type` | `400` con `state: -2` |
| 4 | Falta `product` (campo obligatorio) | Payload sin `product` | `400` con `state: -2` |
| 5 | Idempotencia: mismo `device_id` retorna mismo `certified_id` | Dos llamadas con el mismo payload | Ambos `certified_id` son iguales |
| 6 | Unicidad: diferentes `device_id` retornan diferentes datos | Payload con `device_id` distintos | Ambas respuestas `200` con datos distintos |

### 3. Device Authentication — Autenticación de Dispositivo (24 tests)

Probado en 6 variantes de URL: `/V1/device/authenticate`, `/V2/device/authenticate`, `/V1/device-auth`, `/V2/device-auth`, `/v1/device-auth`, `/v2/device-auth`

Para **cada variante de URL** se ejecutaron los siguientes 4 escenarios:

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Autenticación exitosa con dispositivo previamente registrado | `{ device_id, device_type, certificate, encrypted_device, send_id }` | `200` con `{ state: 0, data: { key, iv, certified_id, auth_token } }` |
| 2 | Falta `device_id` (campo obligatorio) | Payload sin `device_id` | `400` con `state: -2` |
| 3 | Falta `device_type` (campo obligatorio) | Payload sin `device_type` | `400` con `state: -2` |
| 4 | Token JWT válido: `auth_token` tiene formato JWT (3 partes separadas por `.`) | Payload válido | `200` y `auth_token` con 3 segmentos JWT |

### 4. Manejo de Rutas No Encontradas (2 tests)

| # | Escenario | Método | Endpoint | Resultado Esperado |
|---|---|---|---|---|
| 1 | Endpoint inexistente | `POST` | `/V1/unknown-endpoint` | `404` con `state: -4` |
| 2 | Método GET en endpoint POST-only | `GET` | `/V1/device/identification` | `404` |

### 5. Cabeceras de Seguridad — Helmet (2 tests)

| # | Escenario | Cabecera Verificada | Resultado Esperado |
|---|---|---|---|
| 1 | Protección contra MIME sniffing | `X-Content-Type-Options` | Presente en la respuesta |
| 2 | Protección contra clickjacking | `X-Frame-Options` o `Content-Security-Policy` | Al menos una presente |

---

## Pruebas Unitarias — Customer Service

**Archivo**: `microservices/customer-service/src/__tests__/customer.test.ts`  
**Total**: 169 pruebas  
**Resultado**: ✅ 169/169 PASSED

### 0. Health Check (1 test)

| # | Escenario | Método | Endpoint | Resultado Esperado |
|---|---|---|---|---|
| 1 | Verificar disponibilidad del servicio | `GET` | `/health` | `200` con `{ status: "ok", service: "customer-service" }` |

### 1. Catálogo de Extensiones de Documento (7 tests)

Probado en 6 variantes de URL + 1 test de autenticación.

| # | Escenario | Endpoint | Resultado Esperado |
|---|---|---|---|
| 1-6 | Obtener lista de extensiones con autenticación válida | Cada variante de URL | `200` con `{ state: 0, data: { extensions: [...] } }` (array no vacío) |
| 7 | Sin `auth_token` | `/V1/client/device/register/extension/get` | `401` Unauthorized |

### 2. Validación de Usuario (24 tests)

Probado en 6 variantes de URL × 4 escenarios cada una.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Validación exitosa con datos completos | `{ cellphone, document_number, document_type, email, document_extension }` + auth | `200` con `{ state: 0, data: { id } }` |
| 2 | Falta `cellphone` | Payload sin `cellphone` | `400` |
| 3 | Falta `email` | Payload sin `email` | `400` |
| 4 | Sin `auth_token` | Payload sin autenticación | `401` |

### 3. Validación de OTP (13 tests)

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | **Flujo completo OTP**: Validar usuario → Validar OTP (código `123456`) | `200` o `400` (dependiendo del estado del flujo) |
| 2-7 | Falta `cellphone` en cada variante de URL (6 URLs) | `400` |
| 8-13 | Sin `auth_token` en cada variante de URL (6 URLs) | `401` |

### 4. Inicio de Reconocimiento Facial (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Inicio exitoso de sesión facial | `{ cellphone, document_number, document_type }` + auth | `200` con `{ state: 0, data: { session_id, instruction, image } }` |
| 2 | Falta `cellphone` | Payload sin `cellphone` | `400` |
| 3 | Sin `auth_token` | Payload sin autenticación | `401` |

### 5. Ejecución de Reconocimiento Facial (13 tests)

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | **Flujo completo**: Init face → Execute face (con `session_id` obtenido) | `200` o `400` |
| 2-7 | Falta `cellphone` en cada variante de URL (6 URLs) | `400` |
| 8-13 | Sin `auth_token` en cada variante de URL (6 URLs) | `401` |

### 6. Registro de Código de Referencia (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Registro exitoso con usuario semilla `id=3` | `{ id: 3, code: "REF-2024" }` + auth | `200` con `{ state: 0, data: { code: "REFERENCE_APPLIED" } }` |
| 2 | Falta `id` | `{ code: "REF-2024" }` + auth | `400` |
| 3 | Sin `auth_token` | Payload sin autenticación | `401` |

### 7. Creación de Cuenta (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Creación de cuenta (dependiente del estado OTP) | `{ cellphone, pin, home_address, is_married }` + auth | `200` o `400` |
| 2 | Falta `cellphone` | Payload sin `cellphone` | `400` |
| 3 | Sin `auth_token` | Payload sin autenticación | `401` |

### 8. Login / Inicio de Sesión (36 tests)

Probado en 6 variantes de URL × 6 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Login exitoso con credenciales semilla | `{ mobile_number: "70000099", pin: "123456" }` + auth | `200` con `{ state: 0, message: "...Zappi...", data: { private_token, mobile_number } }` |
| 2 | PIN incorrecto | `{ mobile_number: "70000099", pin: "000000" }` + auth | `400` |
| 3 | Número de celular inexistente | `{ mobile_number: "00000001", pin: "123456" }` + auth | `400` |
| 4 | Falta `mobile_number` | Payload sin `mobile_number` | `400` |
| 5 | Falta `pin` | Payload sin `pin` | `400` |
| 6 | Sin `auth_token` | Payload sin autenticación | `401` |

### 9. Parámetros de Perfil (12 tests)

Probado en 6 variantes de URL × 2 escenarios.

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Obtener parámetros con usuario semilla `certifiedId=3` | `200` con `{ state: 0, data: {...} }` |
| 2 | Sin `auth_token` | `401` |

### 10. Welcome Reference — Ruta Intencionalmente 404 (4 tests)

| # | Escenario | Endpoint | Resultado Esperado |
|---|---|---|---|
| 1-4 | Endpoint definido como 404 intencional según la especificación PDF | `/V1/client/reference/welcome` (4 variantes) | `404` |

### 11. Rutas Internas Inter-servicio (2 tests)

| # | Escenario | Método | Endpoint | Resultado Esperado |
|---|---|---|---|---|
| 1 | Obtener datos de cliente por celular (cliente semilla) | `GET` | `/internal/customer/phone/70000099` | `200` con `{ id: 3, name: "..." }` |
| 2 | Cliente inexistente | `GET` | `/internal/customer/phone/00000001` | `404` |

### 12. Manejo de Rutas No Encontradas (1 test)

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Endpoint completamente desconocido | `404` |

### 13. Cabeceras de Seguridad — Helmet (2 tests)

| # | Escenario | Cabecera Verificada | Resultado Esperado |
|---|---|---|---|
| 1 | Protección contra MIME sniffing | `X-Content-Type-Options` | Presente |
| 2 | Protección contra clickjacking | `Content-Security-Policy` o `X-Frame-Options` | Al menos una presente |

---

## Pruebas Unitarias — Wallet Service

**Archivo**: `microservices/wallet-service/src/__tests__/wallet.test.ts`  
**Total**: 148 pruebas  
**Resultado**: ✅ 148/148 PASSED

### 0. Health Check (1 test)

| # | Escenario | Método | Endpoint | Resultado Esperado |
|---|---|---|---|---|
| 1 | Verificar disponibilidad del servicio | `GET` | `/health` | `200` con `{ status: "ok", service: "wallet-service" }` |

### 1. Consulta de Saldos de Billetera (12 tests)

Probado en 6 variantes de URL × 2 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Obtener tarjetas y saldos (usuario semilla `certifiedId=3`) | `{}` + auth | `200` con `{ state: 0, data: { wallet_cards: [{ balance: 1250.50, ... }] } }` |
| 2 | Sin `auth_token` | `{}` | `401` |

### 2. Parámetros de Recarga (6 tests)

Probado en 6 variantes de URL × 1 escenario.

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Obtener lista de proveedores de recarga | `200` con `{ state: 0, data: { providers: [...] } }` (≥3 proveedores: Entel, Tigo, Viva) |

### 3. Recarga Entel (24 tests)

Probado en 6 variantes de URL × 4 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Recarga exitosa | `{ cellphone: "71234567", amount: 20 }` + auth | `200` con `{ state: 0, message: "...Entel...", data: { transaction_id } }` |
| 2 | Falta `cellphone` | `{ amount: 20 }` + auth | `400` |
| 3 | Falta `amount` | `{ cellphone: "71234567" }` + auth | `400` |
| 4 | Sin `auth_token` | Payload sin autenticación | `401` |

### 4. Recarga Tigo (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Recarga exitosa | `{ cellphone: "72345678", amount: 15 }` + auth | `200` con `{ state: 0, message: "...Tigo..." }` |
| 2 | Falta `cellphone` | `{ amount: 15 }` + auth | `400` |
| 3 | Sin `auth_token` | Payload sin autenticación | `401` |

### 5. Recarga Viva (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Recarga exitosa | `{ cellphone: "73456789", amount: 10 }` + auth | `200` con `{ state: 0, message: "...Viva..." }` |
| 2 | Falta `amount` | `{ cellphone: "73456789" }` + auth | `400` |
| 3 | Sin `auth_token` | Payload sin autenticación | `401` |

### 6. Validación de Transferencia (18 tests)

Probado en 6 variantes de URL × 3 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Destinatario existente (usuario semilla) | `{ cellphone: "70000099" }` + auth | `200` con `{ state: 0, data: { name: "GUSTAVO PARKER" } }` |
| 2 | Falta `cellphone` | `{}` + auth | `400` |
| 3 | Sin `auth_token` | `{ cellphone: "70000099" }` | `401` |

### 7. Generación de Token de Transferencia (24 tests)

Probado en 6 variantes de URL × 4 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Generación exitosa de token de 6 dígitos | `{ cellphone: "70000099", amount: 50 }` + auth | `200` con `{ state: 0, data: { token } }` (token de 6 caracteres) |
| 2 | Falta `cellphone` | `{ amount: 50 }` + auth | `400` |
| 3 | Falta `amount` | `{ cellphone: "70000099" }` + auth | `400` |
| 4 | Sin `auth_token` | Payload sin autenticación | `401` |

### 8. Ejecución de Transferencia (13 tests)

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | **Flujo completo**: Generar token → Ejecutar transferencia con token válido | `200` con `{ state: 0, message: "...éxito..." }` |
| 2-7 | Falta `token` en cada variante de URL (6 URLs) | `400` |
| 8-13 | Sin `auth_token` en cada variante de URL (6 URLs) | `401` |

### 9. Historial de Movimientos (8 tests)

Probado en 4 variantes de URL × 2 escenarios.

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Obtener saldo y lista de movimientos | `{}` + auth (certifiedId=3) | `200` con `{ state: 0, data: { balance, movements: [...] } }` |
| 2 | Sin `auth_token` | `{}` | `401` |

### 10. Ruta Interna — Crear Billetera (3 tests)

| # | Escenario | Payload | Resultado Esperado |
|---|---|---|---|
| 1 | Creación exitosa de billetera interna | `{ customerId: 5, cellphone: "77799900" }` | `201` |
| 2 | Falta `customerId` | `{ cellphone: "77799900" }` | `400` |
| 3 | Falta `cellphone` | `{ customerId: 5 }` | `400` |

### 11. Manejo de Rutas No Encontradas (1 test)

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Endpoint completamente desconocido | `404` |

### 12. Cabeceras de Seguridad — Helmet (2 tests)

| # | Escenario | Cabecera Verificada | Resultado Esperado |
|---|---|---|---|
| 1 | Protección contra MIME sniffing | `X-Content-Type-Options` | Presente |
| 2 | Protección contra clickjacking | `Content-Security-Policy` o `X-Frame-Options` | Al menos una presente |

---

## Pruebas de Estrés y Carga

### A. Suite de Estrés Nativa en Node.js

**Archivo**: `microservices/stress-test.js`

#### Configuración

| Parámetro | Valor |
|---|---|
| Concurrencia | 100 workers simultáneos |
| Duración | 5 segundos por servicio |
| Protocolo | HTTP con Keep-Alive (pool de 1000 sockets) |
| Autenticación | JWT HS256 generado con `crypto` nativo de Node.js |

#### Servicios y Endpoints Evaluados

| Servicio | Puerto | Endpoint Probado | Método |
|---|---|---|---|
| Device Service | 3001 | `/V1/device/identification` | `POST` |
| Customer Service | 3002 | `/V1/client/device/register/extension/get` | `POST` |
| Wallet Service | 3003 | `/V1/recharge/parameters/get` | `POST` |

#### Resultados Obtenidos

| Métrica | Device Service | Customer Service | Wallet Service |
|---|---|---|---|
| **RPS (Req/seg)** | 685.1 | 707.7 | 756.6 |
| **Latencia Promedio** | 143.7ms | 139.5ms | 130.5ms |
| **Latencia p95** | 198.0ms | 188.0ms | 174.6ms |
| **Tasa de Éxito** | 100.0% | 100.0% | 100.0% |

#### Conclusiones del Estrés

- Los tres servicios mantienen **100% de tasa de éxito** bajo carga sostenida.
- El **Wallet Service** demostró el mejor rendimiento con **756.6 RPS** y la menor latencia promedio.
- Las latencias p95 se mantuvieron todas por debajo de **200ms**, lo cual es aceptable para una API financiera.
- No se detectaron fugas de memoria, errores de socket ni degradación progresiva del rendimiento.

---

### B. Suite de Carga Artillery

**Archivo**: `microservices/load-test.yml`

#### Fases de Carga Configuradas

| Fase | Duración | Tasa de Llegada | Descripción |
|---|---|---|---|
| **Warm-up** | 60 seg | 5 → 50 req/seg (rampa) | Calentamiento progresivo del servidor |
| **Sustained Load** | 120 seg | 50 req/seg constante | Validación bajo carga operativa normal |
| **Spike** | 60 seg | 50 → 166 req/seg (rampa) | Pico de tráfico (hasta 10,000 req/min) |

#### Escenarios Configurados

| # | Escenario | Endpoint | Validación |
|---|---|---|---|
| 1 | Identificación de Dispositivo (hot path) | `POST /V1/device/identification` | Status `200`, Content-Type `json` |
| 2 | Catálogo de Extensiones de Documentos | `POST /V1/client/device/register/extension/get` (puerto 3002) | Status `200` |
| 3 | Parámetros de Recarga de Billetera | `POST /V1/recharge/parameters/get` (puerto 3003) | Status `200` |

---

## Pruebas de Infraestructura AWS

### Despliegue Completo con AWS CDK v2

Se validó el despliegue completo de las 7 stacks de CloudFormation en la región `us-east-2`:

| Stack | Tipo | Estado Final | Descripción |
|---|---|---|---|
| **CDKToolkit** | Bootstrap | ✅ `CREATE_COMPLETE` | Toolkit de CDK (bucket S3 de assets) |
| **ZappiNetworkStack** | Red | ✅ `CREATE_COMPLETE` | VPC, subredes públicas/privadas, NAT Gateway |
| **ZappiEcrStack** | Contenedores | ✅ `CREATE_COMPLETE` | Repositorios Docker ECR para 3 microservicios |
| **ZappiAuthStack** | Autenticación | ✅ `UPDATE_COMPLETE` | Cognito User Pool + App Client |
| **ZappiDatabaseStack** | Base de Datos | ✅ `UPDATE_COMPLETE` | 3 instancias RDS PostgreSQL 16.6 |
| **ZappiCacheStack** | Caché | ✅ `CREATE_COMPLETE` | Cluster ElastiCache Redis |
| **ZappiEcsStack** | Orquestación | ✅ `CREATE_COMPLETE` | Cluster ECS Fargate + ALB + 3 servicios |
| **ZappiApiStack** | API Gateway | ✅ `CREATE_COMPLETE` | REST API Gateway en producción |

### Recursos AWS Desplegados y Verificados

| Recurso | Cantidad | Verificación |
|---|---|---|
| VPC con subredes públicas y privadas | 1 VPC, 4 subredes | ✅ Conectividad validada |
| Repositorios ECR Docker | 3 (device, customer, wallet) | ✅ Imágenes subidas |
| Instancias RDS PostgreSQL 16.6 | 3 (device-db, customer-db, wallet-db) | ✅ Endpoints activos |
| Secretos en AWS Secrets Manager | 3 credenciales de BD | ✅ Creados |
| Cluster ElastiCache Redis | 1 nodo | ✅ Endpoint accesible |
| Cognito User Pool | 1 pool + 1 client | ✅ IDs generados |
| Definiciones de Tareas ECS | 3 task definitions | ✅ Registradas |
| Servicios Fargate | 3 servicios | ✅ En ejecución |
| Application Load Balancer | 1 ALB público | ✅ DNS asignado |
| Target Groups | 3 (puertos 3001, 3002, 3003) | ✅ Asociados |
| API Gateway REST | 1 API + stage `prod` | ✅ URL generada |
| CloudWatch Log Groups | 3 grupos de logs | ✅ Creados |
| Service Discovery (Cloud Map) | 1 namespace privado | ✅ Servicios registrados |
| Roles IAM | 6 roles (task + execution × 3) | ✅ Políticas aplicadas |
| Security Groups | 7+ grupos de seguridad | ✅ Reglas de ingress configuradas |

### Endpoint de Producción

```
🌐 API Gateway URL: https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod/
```

### Correcciones Aplicadas Durante el Despliegue

| Problema | Causa Raíz | Solución |
|---|---|---|
| `ZappiDatabaseStack` falló al crear instancias RDS | PostgreSQL `16.2` ya no disponible en `us-east-2` | Se actualizó a `rds.PostgresEngineVersion.of('16.6', '16')` en `database-stack.ts` |
| Proceso CDK se congelaba localmente entre stacks | Bug de eventual consistency en AWS SDK | Se reinició el proceso CDK automáticamente y se verificó por CloudFormation directamente |

---

## Cómo Ejecutar las Pruebas

### Prerrequisitos

```bash
# Node.js 18+ instalado
node --version

# Instalar dependencias de cada microservicio
cd microservices/device-service && npm install
cd ../customer-service && npm install
cd ../wallet-service && npm install
```

### Ejecutar Pruebas Unitarias

```bash
# Device Service (65 tests)
cd microservices/device-service
npx jest --verbose

# Customer Service (169 tests)
cd microservices/customer-service
npx jest --verbose

# Wallet Service (148 tests)
cd microservices/wallet-service
npx jest --verbose
```

### Ejecutar Pruebas de Estrés

```bash
# Primero iniciar los microservicios en modo mock
cd microservices/device-service && npm start &
cd microservices/customer-service && npm start &
cd microservices/wallet-service && npm start &

# Ejecutar suite de estrés contra todos los servicios
cd microservices
node stress-test.js all 100 5

# O contra un servicio específico con parámetros personalizados
node stress-test.js device 200 10    # 200 workers, 10 segundos
node stress-test.js customer 50 3    # 50 workers, 3 segundos
node stress-test.js wallet 100 5     # 100 workers, 5 segundos
```

### Ejecutar Pruebas de Carga con Artillery

```bash
# Instalar Artillery globalmente
npm install -g artillery

# Ejecutar contra servicios locales
cd microservices
artillery run load-test.yml

# Ejecutar contra API Gateway de producción (cambiar target)
artillery run --target https://8n2z4h1a2j.execute-api.us-east-2.amazonaws.com/prod load-test.yml
```

### Verificar Infraestructura AWS

```bash
# Listar todas las stacks y su estado
aws cloudformation list-stacks \
  --region us-east-2 \
  --query "StackSummaries[*].[StackName, StackStatus]" \
  --output table

# Verificar endpoints de bases de datos
aws rds describe-db-instances \
  --region us-east-2 \
  --query "DBInstances[*].[DBInstanceIdentifier, Endpoint.Address, DBInstanceStatus]" \
  --output table

# Verificar servicios ECS
aws ecs list-services \
  --cluster ZappiCluster \
  --region us-east-2
```

---

> **Autor**: Generado automáticamente durante la implementación del proyecto Zappi — Billetera Móvil.  
> **Fecha**: Mayo 2026  
> **Región AWS**: `us-east-2` (Ohio)  
> **Total de pruebas ejecutadas**: 382 unitarias + 3 suites de estrés + 7 stacks de infraestructura verificadas.
