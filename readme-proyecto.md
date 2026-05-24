# Documentación del Proyecto Zappi Backend

Este documento describe la arquitectura, la estructura del proyecto, y los pasos necesarios para compilar y desplegar toda la infraestructura en AWS.

## 🏗️ Arquitectura del Sistema

El proyecto está diseñado como una aplicación Serverless orientada a microservicios en AWS. Utiliza las siguientes tecnologías principales:

1.  **Backend (Lógica de Negocio):**
    *   **Node.js & TypeScript:** Todo el código backend está escrito en TypeScript, garantizando tipado estricto.
    *   **AWS Lambda:** Cada endpoint de la API está respaldado por una función Lambda independiente.
    *   **AWS Smithy:** Se utiliza para el modelado formal de la API, definiendo operaciones, estructuras de entrada/salida y errores en un IDL (Interface Definition Language).
    *   **esbuild:** Bundler ultra-rápido que empaqueta cada handler de Lambda con sus dependencias en un solo archivo `.js`.
    *   **PostgreSQL (RDS):** Base de datos relacional para almacenar usuarios, dispositivos, transacciones y sesiones OTP.

2.  **Infraestructura (IaC - Infrastructure as Code):**
    *   **AWS CDK (Cloud Development Kit):** Toda la infraestructura en la nube está codificada en TypeScript (`/infrastructure/lib/`).
    *   **AWS API Gateway:** Expone las funciones Lambda mediante una API REST (`/V1/...`).
    *   **AWS Cognito:** Administra la identidad de los usuarios, la política de contraseñas y genera los JSON Web Tokens (JWT).
    *   **AWS Secrets Manager:** Maneja las credenciales seguras de la base de datos de forma encriptada.

---

## 📂 Estructura del Repositorio

El proyecto está dividido en dos directorios principales:

```text
/
├── backend/                  # Lógica de la aplicación
│   ├── smithy/               # Definición formal de la API
│   │   ├── main.smithy       # Modelo Smithy (13 operaciones, estructuras, errores)
│   │   └── smithy-build.json # Configuración del build Smithy (plugin OpenAPI)
│   ├── src/
│   │   ├── handlers/         # Controladores (una Lambda por endpoint)
│   │   ├── layers/           # Conexiones compartidas (Cognito, DB)
│   │   ├── utils/            # Utilidades (Respuestas HTTP, JWT, helpers)
│   │   └── types/            # Interfaces TypeScript (derivadas del modelo Smithy)
│   ├── package.json
│   └── tsconfig.json
│
├── infrastructure/           # Código de despliegue (AWS CDK)
│   ├── bin/
│   │   └── aws-backend-onboarding.ts  # Punto de entrada de la App CDK
│   ├── lib/
│   │   ├── api-stack.ts       # API Gateway + Lambdas + permisos
│   │   ├── auth-stack.ts      # AWS Cognito (User Pool + Client)
│   │   └── database-stack.ts  # VPC + RDS PostgreSQL + Secrets Manager
│   ├── package.json
│   ├── cdk.json
│   └── tsconfig.json
│
├── test-endpoints.ps1        # Script PowerShell para probar los 13 endpoints
├── readme-api.md             # Documentación técnica de la API
└── readme-api-consumo.md     # Guía de consumo paso a paso con cURL/PowerShell
```

---

## 📐 Modelado de la API con AWS Smithy

### ¿Qué es Smithy?

[AWS Smithy](https://smithy.io/) es un lenguaje de definición de interfaces (IDL) creado por Amazon para modelar APIs de forma declarativa. Permite definir servicios, operaciones, estructuras de datos y errores en un formato legible y reutilizable.

### Archivo del Modelo: `backend/smithy/main.smithy`

El modelo Smithy define el servicio `ZappiApi` con **13 operaciones** que representan el flujo completo de registro y autenticación:

```smithy
$version: "2"
namespace com.zappi
use aws.protocols#restJson1

@restJson1
@title("Zappi API")
service ZappiApi {
    version: "1.0"
    operations: [
        DeviceIdentification       // POST /V1/device/identification
        DeviceAuthenticate         // POST /V1/device/authenticate
        GetExtensionCatalog        // POST /V1/client/device/register/extension/get
        ValidateUser               // POST /V1/register/validate/user
        ValidateOtp                // POST /V1/register/validate/otp
        InitFaceRecognition        // POST /V1/register/init/face/recognition
        ExecuteFaceRecognition     // POST /V1/register/execute/face/recognition
        RegisterReferenceCode      // POST /V1/client/reference/register/code
        CreateAccount              // POST /V1/register/create/account
        Login                      // POST /V1/client/login/get
        GetProfileParameters       // POST /V1/profile/parameters/get
        GetWalletCards             // POST /V1/client/walletcards/information/get
        WelcomeReference           // POST /V1/client/reference/welcome
    ]
}
```

Cada operación tiene definida su estructura de entrada (`Input`), salida (`Output`) y errores (`ApiError`). Por ejemplo, la operación `Login`:

```smithy
@http(method: "POST", uri: "/V1/client/login/get")
operation Login {
    input: LoginInput
    output: LoginOutput
    errors: [ApiError]
}

structure LoginInput {
    @required application: String
    @required mobile_number: String
    @required pin: String
    @required auth_token: String
    // ... más campos
}

structure LoginData {
    private_token: String
    mobile_number: String
    name: String
    last_name: String
    city: String
    id: Long
    // ... más campos
}
```

### Archivo de Configuración: `backend/smithy/smithy-build.json`

Este archivo configura la compilación del modelo Smithy y los plugins de generación de código:

```json
{
  "version": "1.0",
  "sources": ["./"],
  "maven": {
    "dependencies": [
      "software.amazon.smithy:smithy-openapi:1.50.0",
      "software.amazon.smithy:smithy-aws-traits:1.50.0"
    ]
  },
  "plugins": {
    "openapi": {
      "service": "com.yape.bcp#YapeApi",
      "protocol": "aws.protocols#restJson1",
      "defaultBlobFormat": "byte",
      "outputDirectory": "../generated/openapi"
    }
  }
}
```

**Dependencias Maven utilizadas:**
- `smithy-openapi:1.50.0` — Plugin que genera una especificación OpenAPI 3.0 a partir del modelo Smithy.
- `smithy-aws-traits:1.50.0` — Traits de AWS como `@restJson1`, `@httpError`, etc.

### Compilar el Modelo Smithy

Para compilar el modelo Smithy y generar la especificación OpenAPI, se requiere tener instalado el [Smithy CLI](https://smithy.io/2.0/guides/smithy-cli/cli_installation.html).

```bash
# Navegar al directorio Smithy
cd backend/smithy

# Compilar y validar el modelo
smithy build

# O validar sin generar artefactos
smithy validate main.smithy
```

La compilación con `smithy build`:
1.  **Valida** que el modelo sea correcto sintáctica y semánticamente.
2.  **Genera** la especificación OpenAPI 3.0 en `backend/generated/openapi/` (según la configuración del plugin).

> **Nota:** El modelo Smithy sirvió como **fuente de verdad** para diseñar las interfaces TypeScript en `backend/src/types/index.ts`. Todas las estructuras (`LoginData`, `DeviceIdentificationInput`, etc.) se derivan directamente de las definiciones en `main.smithy`.

### Flujo: De Smithy a Código

```text
main.smithy (modelo formal)
    │
    ├──> smithy build ──> OpenAPI 3.0 JSON (documentación)
    │
    └──> Manualmente ──> types/index.ts (interfaces TypeScript)
                              │
                              └──> handlers/*.ts (implementación de cada operación)
```

---

## ⚙️ Compilación del Proyecto

El proceso de construcción debe hacerse en orden: primero el backend y luego la infraestructura.

### 1. Compilar el Backend (TypeScript → JavaScript)

Las funciones Lambda deben transpirarse de TypeScript a JavaScript antes de que CDK pueda empaquetarlas. El proyecto usa **esbuild** para crear bundles optimizados.

```bash
# Navegar al directorio del backend
cd backend

# Instalar las dependencias
npm install

# Compilar el código TypeScript con esbuild
npm run build
```

El comando `npm run build` ejecuta internamente:

```bash
tsc --noEmit && esbuild src/handlers/*.ts --bundle --platform=node --target=node20 --outdir=dist/handlers --external:@aws-sdk/*
```

Esto hace dos cosas:
1.  `tsc --noEmit` — Verifica el tipado de TypeScript sin generar archivos (solo validación).
2.  `esbuild` — Empaqueta cada handler (`login.ts`, `createAccount.ts`, etc.) como un bundle independiente en `backend/dist/handlers/`, excluyendo los SDK de AWS (que ya están disponibles en el runtime de Lambda).

### 2. Preparar la Infraestructura (CDK)

```bash
# Volver a la raíz y entrar a infraestructura
cd ../infrastructure

# Instalar las dependencias de CDK
npm install
```

---

## 🚀 Comandos de Despliegue

Una vez que el backend está compilado, puedes proceder a desplegar la infraestructura a AWS usando el CLI de CDK. Asegúrate de tener configuradas tus credenciales de AWS CLI.

### Prerequisitos

- **Node.js** >= 20
- **AWS CLI** configurado con credenciales (`aws configure`)
- **AWS CDK CLI** (`npm install -g aws-cdk`)
- **Smithy CLI** (opcional, solo si necesitas regenerar el OpenAPI)

### 1. Bootstrap (Solo la primera vez)

Si es la primera vez que despliegas con CDK en esta cuenta/región de AWS, debes preparar el entorno:

```bash
cd infrastructure
npx cdk bootstrap
```

### 2. Sintetizar la Plantilla (Opcional)

Para validar que el código CDK está correcto y ver el CloudFormation que se va a generar:

```bash
npx cdk synth
```

### 3. Desplegar los Stacks

Puedes desplegar todos los recursos de una sola vez ejecutando el siguiente comando desde la carpeta `/infrastructure`:

```bash
npx cdk deploy --all --require-approval never
```

*(El flag `--require-approval never` evita que la consola te pida confirmación manual para cambios en roles de IAM).*

El despliegue creará tres *Stacks* en CloudFormation en este orden:

| Stack | Clase CDK | Recursos creados |
|-------|-----------|------------------|
| `ZappiDatabaseStack` | `DatabaseStack` | VPC, Subnets, Security Groups, RDS PostgreSQL, Secret Manager |
| `ZappiAuthStack` | `AuthStack` | Cognito User Pool, User Pool Client |
| `ZappiApiStack` | `ApiStack` | 13 funciones Lambda, API Gateway REST, permisos IAM |

### 4. Inicializar la Base de Datos

Tras el despliegue exitoso, la terminal mostrará un Output con la URL base de la API (Ej. `https://XXXXX.execute-api.us-east-2.amazonaws.com/prod/`).

Para crear las tablas requeridas en PostgreSQL (Users, Devices, OtpSessions), debes llamar al endpoint especial de inicialización desde tu navegador o terminal:

```bash
curl -X GET "https://<TU_API_URL>/prod/init-db"
```

### 5. Verificar el Despliegue

Ejecutar la suite de pruebas que valida los 13 endpoints:

```powershell
# Desde la raíz del proyecto
powershell -ExecutionPolicy Bypass -File .\test-endpoints.ps1
```

---

## 🔄 Flujo Completo de Compilación y Despliegue

Resumen de todos los comandos en orden:

```bash
# 1. Compilar el backend
cd backend
npm install
npm run build

# 2. (Opcional) Compilar el modelo Smithy
cd smithy
smithy build
cd ..

# 3. Preparar e instalar CDK
cd ../infrastructure
npm install

# 4. (Solo la primera vez) Bootstrap de CDK
npx cdk bootstrap

# 5. Desplegar a AWS
npx cdk deploy --all --require-approval never

# 6. Inicializar la base de datos
curl -X GET "https://<API_URL>/prod/init-db"

# 7. Ejecutar pruebas
cd ..
powershell -ExecutionPolicy Bypass -File .\test-endpoints.ps1
```

---

## 📜 Historial de Comandos Ejecutados en el Proyecto

Esta sección documenta la secuencia cronológica de todos los comandos que se ejecutaron durante la construcción, compilación, corrección, despliegue y pruebas del proyecto.

### Fase 1: Preparación y Lectura del Documento Fuente

```bash
# Verificar la versión de Python disponible
python -c "import sys; print(sys.version)"

# Instalar la librería para leer PDFs
pip install pypdf

# Extraer el contenido del PDF de especificaciones de la API
python read_pdf.py
# → Genera pdf_content.txt con los 13 endpoints documentados
```

### Fase 2: Creación de la Estructura del Proyecto

```powershell
# Crear los directorios raíz
New-Item -ItemType Directory -Force -Path "c:/maestria/aws-backend-onboarding"

# Crear la estructura completa del backend
mkdir "c:\maestria\aws-backend-onboarding\backend\smithy" -Force
mkdir "c:\maestria\aws-backend-onboarding\backend\src\handlers" -Force
mkdir "c:\maestria\aws-backend-onboarding\backend\src\layers\database" -Force
mkdir "c:\maestria\aws-backend-onboarding\backend\src\layers\cognito" -Force
mkdir "c:\maestria\aws-backend-onboarding\backend\src\utils" -Force
mkdir "c:\maestria\aws-backend-onboarding\backend\src\types" -Force

# Crear la estructura de la infraestructura CDK
mkdir "c:\maestria\aws-backend-onboarding\infrastructure\bin" -Force
mkdir "c:\maestria\aws-backend-onboarding\infrastructure\lib" -Force
```

### Fase 3: Generación de Archivos (se crearon programáticamente)

Se generaron los siguientes archivos en esta fase:

| Orden | Archivo | Descripción |
|-------|---------|-------------|
| 1 | `backend/smithy/main.smithy` | Modelo Smithy con 13 operaciones |
| 2 | `backend/smithy/smithy-build.json` | Config del plugin OpenAPI |
| 3 | `backend/package.json` | Dependencias del backend |
| 4 | `backend/tsconfig.json` | Configuración de TypeScript |
| 5 | `backend/jest.config.ts` | Configuración de Jest |
| 6 | `backend/.env.example` | Variables de entorno de ejemplo |
| 7 | `backend/src/types/index.ts` | Interfaces TypeScript (derivadas de Smithy) |
| 8 | `backend/src/layers/database/db.ts` | Capa de conexión a PostgreSQL |
| 9 | `backend/src/layers/database/schema.sql` | DDL de la base de datos |
| 10 | `backend/src/layers/cognito/cognito.ts` | Capa de integración con Cognito |
| 11 | `backend/src/utils/response.ts` | Utilidades HTTP, JWT, helpers |
| 12-24 | `backend/src/handlers/*.ts` | 13 handlers Lambda (uno por endpoint) |
| 25 | `infrastructure/package.json` | Dependencias de CDK |
| 26 | `infrastructure/cdk.json` | Configuración del CDK App |
| 27 | `infrastructure/tsconfig.json` | TypeScript para CDK |
| 28 | `infrastructure/lib/database-stack.ts` | VPC + RDS + Secrets Manager |
| 29 | `infrastructure/lib/auth-stack.ts` | Cognito User Pool + Client |
| 30 | `infrastructure/lib/api-stack.ts` | API Gateway + 13 Lambdas |
| 31 | `infrastructure/bin/aws-backend-onboarding.ts` | Entry point CDK App |

### Fase 4: Compilación Inicial y Corrección de Errores

```bash
# ── Backend ──
cd backend
npm install
npm run build
# ❌ Error: Faltaban propiedades city, register_completed en DbUser
# ❌ Error: T genérico sin QueryResultRow constraint en db.ts

# ── Correcciones aplicadas ──
# 1. Se agregó city y register_completed a la interfaz DbUser (types/index.ts)
# 2. Se cambió query<T = Record> a query<T extends QueryResultRow> (db.ts)
# 3. Se movió import { QueryResultRow } al inicio de db.ts

# Recompilar tras correcciones
npm run build    # ✅ OK

# ── Infraestructura ──
cd ../infrastructure
npm install
npm run build
# ❌ Error: defaultDatabaseName no existe en DatabaseInstanceProps
# ── Corrección: cambiado a databaseName ──
npm run build    # ✅ OK
```

### Fase 5: Renombrado del Proyecto (YapeBcp → Zappi)

```bash
# Se renombraron todas las referencias de Yape/YapeBcp a Zappi en:
# - package.json (backend e infrastructure)
# - main.smithy (namespace com.zappi, servicio ZappiApi)
# - database-stack.ts (IDs: ZappiVpc, ZappiDbSecret, etc.)
# - auth-stack.ts (ZappiUserPool, zappi-users)
# - api-stack.ts (ZappiApi)
# - bin/aws-backend-onboarding.ts (ZappiDatabaseStack, ZappiAuthStack, ZappiApiStack)
# - db.ts (DB name: zappi, user: zappiuser)
# - login.ts (mensaje: "Bienvenido a Zappi")
# - README.md (raíz, backend, infrastructure)

# Recompilar ambos proyectos tras el renombrado
cd backend && npm run build      # ✅ OK
cd ../infrastructure && npm run build   # ✅ OK
```

### Fase 6: Validación Pre-Despliegue

```bash
# Verificar credenciales AWS
aws sts get-caller-identity

# Sintetizar CloudFormation para validar
cd infrastructure
npx cdk synth --all              # ✅ 3 stacks sintetizados correctamente
```

### Fase 7: Despliegue a AWS

```bash
# Bootstrap de CDK (solo primera vez)
cd infrastructure
npx cdk bootstrap

# Desplegar todos los stacks
npx cdk deploy --all --require-approval never
# ❌ Error: PostgreSQL 15.4 no disponible en us-east-2
# ── Corrección: cambiado a VER_15_10 ──

# Redesplegar tras corrección
npm run build
npx cdk deploy --all --require-approval never
# ⏳ ~15 minutos para crear la instancia RDS

# Verificar estado de los stacks
aws cloudformation describe-stacks --region us-east-2 \
  --query "Stacks[?contains(StackName,'Zappi')].{Name:StackName,Status:StackStatus}" \
  --output table
# → ZappiDatabaseStack: CREATE_COMPLETE
# → ZappiAuthStack:     CREATE_COMPLETE
# → ZappiApiStack:      CREATE_COMPLETE

# Deploy individual del ApiStack (cuando fue necesario redesplegar solo Lambdas)
npx cdk deploy ZappiApiStack --require-approval never
```

### Fase 8: Inicialización de la Base de Datos

```bash
# Crear handler initDb.ts con el DDL embebido
# (se creó backend/src/handlers/initDb.ts con todas las tablas)

# Compilar y desplegar el nuevo handler
cd backend && npm run build
cd ../infrastructure && npx cdk deploy ZappiApiStack --require-approval never

# Ejecutar la inicialización de la BD
curl.exe -X GET https://9pptzppe44.execute-api.us-east-2.amazonaws.com/prod/init-db
# → Tablas creadas: devices, users, otp_sessions, wallet_accounts, wallet_actions, reference_codes
```

### Fase 9: Pruebas de los Endpoints y Corrección de Bugs

```bash
# ── Primera ejecución de pruebas ──
powershell -ExecutionPolicy Bypass -File test-endpoints.ps1
# Resultado: 9 OK, 4 FAIL

# ── Bug 1: CreateAccount → 500 (Cognito username format) ──
# Diagnóstico: Cognito requiere formato E.164 (+591XXXXXXXX)
# Revisión de logs:
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ZappiApiStack-CreateAccountFn0BA6E686-WgSalvzp96x6" \
  --region us-east-2 --query "events[*].message" --output text
# Error: "Username should be either an email or a phone number"

# Corrección: Normalizar cellphone a E.164 en createAccount.ts y login.ts
# - createAccount.ts: const e164Phone = body.cellphone.startsWith('+') ? body.cellphone : `+591${body.cellphone}`
# - login.ts: mismo patrón + strip +591 antes de buscar en DB

# ── Compilar y desplegar Lambdas individuales (hot-deploy) ──
cd backend
npm run build

# Deploy rápido sin CDK (directamente con AWS CLI)
Compress-Archive -Force -Path dist\handlers\createAccount.js -DestinationPath dist\createAccount.zip
aws lambda update-function-code \
  --function-name ZappiApiStack-CreateAccountFn0BA6E686-WgSalvzp96x6 \
  --zip-file fileb://dist/createAccount.zip --region us-east-2

Compress-Archive -Force -Path dist\handlers\login.js -DestinationPath dist\login.zip
aws lambda update-function-code \
  --function-name ZappiApiStack-LoginFn9B45172B-rMN7n9XngUDx \
  --zip-file fileb://dist/login.zip --region us-east-2

# Esperar a que las funciones se actualicen
aws lambda wait function-updated --function-name ZappiApiStack-CreateAccountFn0BA6E686-WgSalvzp96x6 --region us-east-2
aws lambda wait function-updated --function-name ZappiApiStack-LoginFn9B45172B-rMN7n9XngUDx --region us-east-2

# ── Segunda ejecución de pruebas ──
powershell -ExecutionPolicy Bypass -File test-endpoints.ps1
# Resultado: 10 OK, 3 FAIL (CreateAccount ahora pasa ✅)

# ── Bug 2: Login → 400 (user not found in DB) ──
# Diagnóstico: DB almacena cellphone sin prefijo, pero login buscaba con prefijo
# Corrección: strip +591 antes de buscar en DB
# login.ts: const dbCellphone = body.mobile_number.replace(/^\+591/, '');

# Recompilar y redesplegar login
npm run build
Compress-Archive -Force -Path dist\handlers\login.js -DestinationPath dist\login.zip
aws lambda update-function-code \
  --function-name ZappiApiStack-LoginFn9B45172B-rMN7n9XngUDx \
  --zip-file fileb://dist/login.zip --region us-east-2

# ── Tercera ejecución de pruebas (final) ──
powershell -ExecutionPolicy Bypass -File test-endpoints.ps1
# Resultado Final: 11 OK, 2 esperados (OTP sin SMS real, Welcome 404 por diseño)
```

### Fase 10: Verificación de Cognito

```bash
# Listar usuarios creados en Cognito
aws cognito-idp list-users \
  --user-pool-id <POOL_ID> \
  --region us-east-2 \
  --query "Users[*].{Username:Username,Status:UserStatus}" \
  --output table

# Verificar atributos de un usuario
aws cognito-idp admin-get-user \
  --user-pool-id <POOL_ID> \
  --username "<USER_UUID>" \
  --region us-east-2 \
  --query "UserAttributes[*].{Name:Name,Value:Value}" \
  --output table
```

### Fase 11: Prueba Aislada del Login

```bash
# Se creó test-login.ps1 para probar solo el flujo de login (2 pasos)
powershell -ExecutionPolicy Bypass -File .\test-login.ps1
# Paso 1: Device Identification → ✅ auth_token obtenido
# Paso 2: Login → ✅ JWT de Cognito + datos del usuario
```

---

## 🗑️ Destruir la Infraestructura

Si necesitas eliminar todos los recursos de AWS creados por el proyecto para evitar costos, ejecuta:

```bash
cd infrastructure
npx cdk destroy --all
```

*(Asegúrate de confirmar la eliminación cuando la consola te lo solicite).*
