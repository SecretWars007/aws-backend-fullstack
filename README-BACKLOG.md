# Backlog de Requerimientos y Casos de Prueba - Proyecto Zappi

Este archivo contiene el backlog de requerimientos (historias de usuario, tareas), el plan de acción detallado para las dos fases del proyecto (Mock y Funcional), y los casos de prueba detallados con los nuevos estándares de seguridad (cabeceras JWT y OWASP).

---

## 📅 Plan de Acción del Proyecto

El desarrollo se ejecutará en **dos fases** incrementales para mitigar riesgos e integrar progresivamente las bases de datos y la seguridad:

```mermaid
graph TD
    A[Fase 1: Mock Backend] --> B[Diseño de Interfaces Clean Architecture]
    B --> C[Endpoints Hardcoded con Headers JWT]
    C --> D[Pruebas de Integración y Contrato]
    D --> E[Fase 2: Functional Backend]
    E --> F[Migración a 3 Bases de Datos]
    F --> G[Lógica de Negocio y Cognito Integrado]
    G --> H[Seguridad OWASP y Pruebas de Carga 10k]
```

### 1. Fase 1: Backend con Endpoints Mock (Simulados)
El objetivo es proveer una API estable de inmediato para que los clientes frontend/móviles puedan integrarse.
* **Semana 1: Configuración de la Arquitectura Limpia**
  * Creación del monorepositorio con las carpetas de microservicios: `device-service`, `customer-service` y `wallet-service`.
  * Estructuración del boilerplate de Clean Architecture (Domain, Use Cases, Adapters, Infrastructure).
  * Configuración de Docker Compose local con mocks de JWT y bases de datos vacías.
* **Semana 2: Implementación de Endpoints Mock**
  * Codificación de los 18 controladores REST retornando respuestas fijas idénticas al PDF.
  * Configuración del middleware de parsing de cabeceras para validar la presencia de `X-Device-Token` y `Authorization: Bearer`.
  * Entrega y validación local de la API mock mediante scripts de cURL/PowerShell.

### 2. Fase 2: Backend con Procesos Funcionales Reales
El objetivo es reemplazar la simulación por lógica real de negocio, conectividad y seguridad de producción.
* **Semana 3: Descentralización de Datos e Integración de Cognito**
  * Creación de esquemas e inicialización de las 3 bases de datos (`device_db`, `customer_db`, `wallet_db`).
  * Implementación de la capa de acceso a datos utilizando repositorios e inyección de dependencias.
  * Integración con AWS Cognito para la creación de usuarios y login funcional (`/v1/sign-in` generará un JWT firmado real).
* **Semana 4: Biometría, Transferencias y Transaccionalidad**
  * Implementación del simulador de biometría facial y OTP de seguridad.
  * Lógica transaccional real para transferencias `/v1/transfers-execute` (descuento de saldo, abono a cuenta destino con aislamiento ACID y bloqueos optimistas para evitar doble gasto).
  * Comunicación síncrona inter-servicios usando clientes HTTP internos con reintentos para validar usuarios entre microservicios.
* **Semana 5: OWASP y Optimización de Alta Concurrencia**
  * Implementación de Rate Limiting y CORS restrictivo.
  * Habilitación de RDS Proxy, Pools de conexiones (pgBouncer/pg-pool) y caché con Redis.
  * Pruebas de carga de 10,000 conexiones concurrentes y despliegue final en ECS Fargate con auto-escalado.

---

## 📋 Backlog de Requerimientos (Product Backlog)

### Épica 1: Identificación y Autenticación del Dispositivo (Microservicio: Device)
* **US1.1: Identificación del Dispositivo**
  * **Descripción**: Como dispositivo móvil, quiero identificarme ante el servidor para obtener mis llaves de cifrado y un token de dispositivo seguro.
  * **Tareas**:
    * Crear endpoint `POST /v1/device-identify`.
    * Implementar generación de `key` y `iv` dinámicos (criptografía AES).
    * Firmar digitalmente el `X-Device-Token` inicial con expiración corta (30 min).
* **US1.2: Renovación de Autenticación del Dispositivo**
  * **Descripción**: Como dispositivo ya registrado, quiero autenticarme para actualizar mis llaves y mi token.
  * **Tareas**:
    * Crear endpoint `POST /v1/device-auth`.
    * Validar existencia del `device_id` en la BD `device_db`.

### Épica 2: Registro y Validación de Usuario (Microservicio: Customer)
* **US2.1: Catálogo de Extensiones**
  * **Descripción**: Como cliente en onboarding, quiero obtener las extensiones de identidad válidas de Bolivia.
  * **Tareas**:
    * Crear endpoint `POST /v1/document-extensions`.
    * Retornar catálogo departamental (LP, SC, CB, etc.).
* **US2.2: Validación de Datos de Identidad**
  * **Descripción**: Como usuario nuevo, quiero ingresar mi número de CI, tipo, celular y correo para verificar si ya estoy registrado.
  * **Tareas**:
    * Crear endpoint `POST /v1/users-validate`.
    * Pre-registrar usuario esqueleto en la base de datos `customer_db`.
* **US2.3: Generación y Validación de OTP**
  * **Descripción**: Como usuario en onboarding, quiero validar el código OTP recibido para verificar mi número celular.
  * **Tareas**:
    * Crear endpoint `POST /v1/otp-generate` (procesa la verificación del OTP provisto).
    * Almacenar sesión OTP en `customer_db` con hash SHA-256 de seguridad.
* **US2.4: Biometría Facial (Inicio y Validación)**
  * **Descripción**: Como usuario en onboarding, quiero tomarme una selfie para validar mi rostro contra la base de datos de identificación nacional.
  * **Tareas**:
    * Crear endpoint `POST /v1/face-recognition-init` (retorna imagen guía base64 y `session_id`).
    * Crear endpoint `POST /v1/face-recognition-valid` (valida la selfie enviada en base64).
* **US2.5: Código de Referido**
  * **Descripción**: Como usuario nuevo, quiero registrar el código de referido de un amigo para aplicar a promociones.
  * **Tareas**:
    * Crear endpoint `POST /v1/reference/register`.
* **US2.6: Creación Definitiva de Cuenta**
  * **Descripción**: Como usuario verificado, quiero ingresar un PIN y completar mi registro para poseer una cuenta de billetera digital activa.
  * **Tareas**:
    * Crear endpoint `POST /v1/users-create`.
    * Registrar credenciales en AWS Cognito User Pool.
    * Crear un registro inicial en `wallet_db` enviando un evento HTTP interno o de integración.

### Épica 3: Autenticación e Información del Cliente (Microservicios: Customer / Wallet)
* **US3.1: Inicio de Sesión de Usuario**
  * **Descripción**: Como cliente registrado, quiero ingresar mi PIN de seguridad para iniciar sesión y obtener mi token de usuario privado.
  * **Tareas**:
    * Crear endpoint `POST /v1/sign-in`.
    * Autenticar contra Cognito y retornar el ID Token (JWT) en la respuesta (que luego se usará en la cabecera `Authorization: Bearer`).
* **US3.2: Parámetros del Perfil**
  * **Descripción**: Como cliente logueado, quiero obtener mis configuraciones de inicio (saludos, notificaciones).
  * **Tareas**:
    * Crear endpoint `POST /v1/parameters`.
    * Extraer el ID del usuario del JWT presente en la cabecera `Authorization`.
* **US3.3: Saldos y Tarjetas**
  * **Descripción**: Como cliente logueado, quiero visualizar mi saldo y últimas transacciones en la pantalla principal.
  * **Tareas**:
    * Crear endpoint `POST /v1/balances`.
    * Consultar base de datos `wallet_db` filtrando por el ID de usuario proveniente de la cabecera `Authorization`.

### Épica 4: Recargas y Transferencias (Microservicio: Wallet)
* **US4.1: Catálogo y Ejecución de Recargas Móviles**
  * **Descripción**: Como cliente, quiero recargar saldo para Entel, Tigo o Viva utilizando el dinero de mi cuenta.
  * **Tareas**:
    * Crear endpoint `POST /v1/recharge-params` (montos disponibles).
    * Crear endpoints `/v1/recharge-entel`, `/v1/recharge-tigo` y `/v1/recharge-viva`.
* **US4.2: Transferencias y Token de Autorización**
  * **Descripción**: Como cliente, quiero validar una cuenta destino y generar un token temporal de un solo uso para confirmar mi transferencia.
  * **Tareas**:
    * Crear endpoint `POST /v1/transfers/users-validate` (consulta externa al microservicio Customer).
    * Crear endpoint `POST /v1/token-generate` (genera código temporal de 6 dígitos con expiración corta, ej. 60s).
    * Crear endpoint `POST /v1/transfers-execute` (realiza el débito/crédito transaccional e incrementa saldo destino).
    * Crear endpoint `POST /v1/movements` (historial detallado).

---

## 🧪 Casos de Prueba Detallados

> [!IMPORTANT]
> **Requisito de Cabeceras de Seguridad**: Todos los endpoints (excepto identificación inicial) deben validar obligatoriamente:
> * `X-Device-Token`: Token de dispositivo válido, firmado por el Microservicio de Dispositivos.
> * `Authorization`: Formato `Bearer <JWT>` (para endpoints autenticados post-login).

### Caso de Prueba 1: Identificación Inicial del Dispositivo
* **ID**: `TC-DEV-001`
* **Precondición**: Dispositivo móvil conectado a internet.
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/device-identify`.
  2. El cuerpo debe incluir un `device_id` único y `device_type`.
* **Resultado Esperado**: Código HTTP 200. Retorna `key`, `iv`, `certified_id` y `auth_token`. El `state` es 0.
* **Comando de Verificación**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3001/v1/device-identify" -Method POST -ContentType "application/json" -Body '{"device_id": "test-device-123", "device_type": "android", "product": "Zappi", "version": "1.0.0"}'
  ```

### Caso de Prueba 2: Rechazo de Endpoint por Token de Dispositivo Faltante/Inválido
* **ID**: `TC-SEC-001` (Cumplimiento OWASP - Control de Acceso)
* **Precondición**: El dispositivo no envía la cabecera requerida.
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/document-extensions` sin cabeceras.
* **Resultado Esperado**: Código HTTP 401 Unauthorized. Retorna `state` = -3 (No Autorizado) y mensaje "Token de dispositivo inválido o expirado".
* **Comando de Verificación**:
  ```powershell
  # Sin cabecera X-Device-Token debe fallar
  try {
      Invoke-RestMethod -Uri "http://localhost:3002/v1/document-extensions" -Method POST -ContentType "application/json"
  } catch {
      $_.Exception.Response.StatusCode.value__ # Esperado: 401
  }
  ```

### Caso de Prueba 3: Consulta Exitosa de Catálogo con Cabecera Correcta
* **ID**: `TC-CAT-001`
* **Precondición**: Poseer un `auth_token` de dispositivo válido obtenido en `TC-DEV-001`.
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/document-extensions`.
  2. Agregar cabecera `X-Device-Token` con el valor del token.
* **Resultado Esperado**: Código HTTP 200. Retorna el listado de extensiones (LP, SC, CB, etc.).
* **Comando de Verificación**:
  ```powershell
  $headers = @{"X-Device-Token" = "EL_TOKEN_OBTENIDO"}
  Invoke-RestMethod -Uri "http://localhost:3002/v1/document-extensions" -Method POST -Headers $headers -ContentType "application/json"
  ```

### Caso de Prueba 4: Validación de Identidad de Usuario (Creación de Esqueleto)
* **ID**: `TC-USR-001`
* **Precondición**: Token de dispositivo válido en cabeceras.
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/users-validate`.
  2. Incluir cabecera `X-Device-Token`.
  3. Enviar en el cuerpo celular, documento de identidad, tipo y correo electrónico.
* **Resultado Esperado**: Código HTTP 200. Retorna un objeto con el `id` asignado en base de datos.
* **Comando de Verificación**:
  ```powershell
  $body = '{"cellphone": "77011223", "document_number": "12345678", "document_type": "CI", "email": "test@zappi.com", "certified_id": 42}'
  Invoke-RestMethod -Uri "http://localhost:3002/v1/users-validate" -Method POST -Headers $headers -ContentType "application/json" -Body $body
  ```

### Caso de Prueba 5: Validación Biométrica Facial Completa
* **ID**: `TC-BIO-001`
* **Precondición**: Dispositivo identificado, sesión facial iniciada.
* **Pasos**:
  1. Iniciar sesión llamando a `/v1/face-recognition-init` con los datos del usuario.
  2. Capturar el `session_id` del response.
  3. Enviar petición POST a `/v1/face-recognition-valid` incluyendo la selfie en Base64 y el `session_id`.
* **Resultado Esperado**: Código HTTP 200. Retorna `code` = "FACE_VERIFIED" y un identificador de transacción único.
* **Comando de Verificación**:
  ```powershell
  $init = Invoke-RestMethod -Uri "http://localhost:3002/v1/face-recognition-init" -Method POST -Headers $headers -ContentType "application/json" -Body '{"cellphone":"77011223", "certified_id": 42, "document_number": "12345678", "document_type": "CI"}'
  $sessId = $init.data.session_id
  
  $body = @{cellphone="77011223"; certified_id=42; document_number="12345678"; selfie="iVBORw0KGgoAAAANS..."; session_id=$sessId} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3002/v1/face-recognition-valid" -Method POST -Headers $headers -ContentType "application/json" -Body $body
  ```

### Caso de Prueba 6: Inicio de Sesión de Usuario y Obtención de JWT Privado
* **ID**: `TC-AUTH-001`
* **Precondición**: Usuario creado previamente con su PIN de seguridad.
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/sign-in` con celular y PIN.
  2. Incluir cabecera `X-Device-Token`.
* **Resultado Esperado**: Código HTTP 200. Retorna `private_token` en `data` (representa el JWT de la sesión del usuario).
* **Comando de Verificación**:
  ```powershell
  $body = '{"mobile_number": "77011223", "pin": "123456", "application": "Zappi", "certified_id": 42}'
  Invoke-RestMethod -Uri "http://localhost:3002/v1/sign-in" -Method POST -Headers $headers -ContentType "application/json" -Body $body
  ```

### Caso de Prueba 7: Consulta de Saldos con JWT de Usuario en Cabeceras (OWASP BOLA)
* **ID**: `TC-WAL-001`
* **Precondición**: Usuario autenticado. Posee el JWT de sesión (`private_token`).
* **Pasos**:
  1. Enviar petición HTTP POST a `/v1/balances`.
  2. Incluir cabecera `X-Device-Token` y cabecera `Authorization: Bearer <JWT_DE_SESION>`.
* **Resultado Esperado**: Código HTTP 200. Retorna el saldo y movimientos del usuario correspondiente al token.
* **Comando de Verificación**:
  ```powershell
  $authHeaders = @{
      "X-Device-Token" = "TOKEN_DISPOSITIVO"
      "Authorization" = "Bearer JWT_OBTENIDO_EN_SIGN_IN"
  }
  Invoke-RestMethod -Uri "http://localhost:3003/v1/balances" -Method POST -Headers $authHeaders -ContentType "application/json"
  ```

### Caso de Prueba 8: Validación de Control de Acceso (Intento de BOLA / IDOR)
* **ID**: `TC-SEC-002` (OWASP BOLA)
* **Precondición**: Dos usuarios registrados (Usuario A y Usuario B). El atacante posee el JWT del Usuario A.
* **Pasos**:
  1. El atacante envía una petición a `/v1/movements` solicitando ver las transacciones de la cuenta del Usuario B.
  2. El atacante proporciona el JWT del Usuario A en la cabecera `Authorization`.
* **Resultado Esperado**: Código HTTP 403 Forbidden. El servidor valida que el ID de la cuenta solicitada en la base de datos no pertenece al ID del usuario codificado en el JWT.
* **Comando de Verificación**:
  ```powershell
  # Payload solicita una cuenta que no pertenece al token firmado
  $body = '{"account": "70099999"}' # Cuenta de la víctima B
  try {
      Invoke-RestMethod -Uri "http://localhost:3003/v1/movements" -Method POST -Headers $authHeaders -ContentType "application/json" -Body $body
  } catch {
      $_.Exception.Response.StatusCode.value__ # Esperado: 403
  }
  ```

### Caso de Prueba 9: Ejecución Segura de Transferencia (OWASP Inyección de SQL y Consistencia)
* **ID**: `TC-WAL-002`
* **Precondición**: Saldo suficiente en cuenta origen. Haber generado el token de un solo uso con `/v1/token-generate`.
* **Pasos**:
  1. Enviar petición POST a `/v1/transfers-execute`.
  2. Incluir cabeceras `X-Device-Token` y `Authorization: Bearer <JWT>`.
  3. Enviar en el cuerpo el monto, cuenta origen, PIN de confirmación y el token OTP transaccional.
* **Resultado Esperado**: Código HTTP 200. Retorna código "88991122" (éxito). Los saldos de origen y destino se actualizan concurrentemente en una transacción ACID aislada.
* **Comando de Verificación**:
  ```powershell
  $body = @{
      amount = 100.00
      certified_id = 42
      currency = "BOL"
      origin_account = "70012345"
      pin = "123456"
      target_account = "70054321"
      target_account_name = "MARIA LOPEZ VACA"
      token = "852369"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3003/v1/transfers-execute" -Method POST -Headers $authHeaders -ContentType "application/json" -Body $body
  ```
