$version: "2"

namespace com.zappi

use aws.protocols#restJson1

/// Zappi Registration and Authentication API
@restJson1
@title("Zappi API")
service ZappiApi {
    version: "1.0"
    operations: [
        DeviceIdentification
        DeviceAuthenticate
        GetExtensionCatalog
        ValidateUser
        ValidateOtp
        InitFaceRecognition
        ExecuteFaceRecognition
        RegisterReferenceCode
        CreateAccount
        Login
        GetProfileParameters
        GetWalletCards
        WelcomeReference
    ]
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Device Identification  POST /V1/device/identification
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/device/identification")
operation DeviceIdentification {
    input: DeviceIdentificationInput
    output: DeviceIdentificationOutput
    errors: [ApiError]
}

structure DeviceIdentificationInput {
    @required event: Integer
    notification_id: String
    @required product: String
    reference: String
    version: String
    @required certificate: Boolean
    @required device_id: String
    @required device_type: String
    encrypted_device: String
    send_id: String
}

structure DeviceIdentificationOutput {
    @required state: Integer
    @required message: String
    data: DeviceIdentificationData
}

structure DeviceIdentificationData {
    key: String
    iv: String
    certified_id: Integer
    auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Device Authenticate  POST /V1/device/authenticate
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/device/authenticate")
operation DeviceAuthenticate {
    input: DeviceAuthenticateInput
    output: DeviceAuthenticateOutput
    errors: [ApiError]
}

structure DeviceAuthenticateInput {
    @required certificate: Boolean
    @required device_id: String
    @required device_type: String
    encrypted_device: String
    send_id: String
}

structure DeviceAuthenticateOutput {
    @required state: Integer
    @required message: String
    data: DeviceAuthData
}

structure DeviceAuthData {
    key: String
    iv: String
    certified_id: Integer
    auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Extension Catalog  POST /V1/client/device/register/extension/get
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/client/device/register/extension/get")
operation GetExtensionCatalog {
    input: TokenInput
    output: GetExtensionCatalogOutput
    errors: [ApiError]
}

structure TokenInput {
    @required auth_token: String
}

structure GetExtensionCatalogOutput {
    @required state: Integer
    @required message: String
    data: ExtensionCatalogData
}

structure ExtensionCatalogData {
    extensions: ExtensionList
}

list ExtensionList {
    member: Extension
}

structure Extension {
    @required name: String
    @required extension: String
    @required type: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Validate User  POST /V1/register/validate/user
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/register/validate/user")
operation ValidateUser {
    input: ValidateUserInput
    output: ValidateUserOutput
    errors: [ApiError]
}

structure ValidateUserInput {
    @required cellphone: String
    @required certified_id: Integer
    document_complement: String
    document_extension: String
    @required document_number: String
    @required document_type: String
    @required email: String
    @required auth_token: String
}

structure ValidateUserOutput {
    @required state: Integer
    @required message: String
    data: ValidateUserData
}

structure ValidateUserData {
    id: Long
    cic: String
    home_address: String
    is_client: Boolean
    is_married: Boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Validate OTP  POST /V1/register/validate/otp
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/register/validate/otp")
operation ValidateOtp {
    input: ValidateOtpInput
    output: TransactionOutput
    errors: [ApiError]
}

structure ValidateOtpInput {
    @required cellphone: String
    @required certified_id: Integer
    @required otp: String
    @required auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Init Face Recognition  POST /V1/register/init/face/recognition
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/register/init/face/recognition")
operation InitFaceRecognition {
    input: FaceRecognitionInitInput
    output: FaceRecognitionInitOutput
    errors: [ApiError]
}

structure FaceRecognitionInitInput {
    @required cellphone: String
    @required certified_id: Integer
    @required document_number: String
    @required document_type: String
    document_extension: String
    document_complement: String
    @required auth_token: String
}

structure FaceRecognitionInitOutput {
    @required state: Integer
    @required message: String
    data: FaceRecognitionInitData
}

structure FaceRecognitionInitData {
    instruction: String
    image: String
    session_id: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Execute Face Recognition  POST /V1/register/execute/face/recognition
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/register/execute/face/recognition")
operation ExecuteFaceRecognition {
    input: ExecuteFaceRecognitionInput
    output: TransactionOutput
    errors: [ApiError]
}

structure ExecuteFaceRecognitionInput {
    @required session_id: String
    @required selfie: String
    @required certified_id: Integer
    @required auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Register Reference Code  POST /V1/client/reference/register/code
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/client/reference/register/code")
operation RegisterReferenceCode {
    input: RegisterReferenceCodeInput
    output: TransactionOutput
    errors: [ApiError]
}

structure RegisterReferenceCodeInput {
    @required cellphone: String
    @required code: String
    @required id: Long
    @required auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Create Account  POST /V1/register/create/account
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/register/create/account")
operation CreateAccount {
    input: CreateAccountInput
    output: TransactionOutput
    errors: [ApiError]
}

structure CreateAccountInput {
    @required cellphone: String
    @required certified_id: Integer
    @required cic: String
    @required device_type: String
    document_complement: String
    document_extension: String
    @required document_number: String
    @required document_type: String
    @required email: String
    home_address: String
    @required id: Long
    is_citizen_eeuu: Boolean
    is_client: Boolean
    is_married: Boolean
    @required otp: String
    @required pin: String
    @required auth_token: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Login  POST /V1/client/login/get
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/client/login/get")
operation Login {
    input: LoginInput
    output: LoginOutput
    errors: [ApiError]
}

structure LoginInput {
    @required application: String
    @required certified_id: Integer
    @required device_id: String
    @required device_name: String
    @required device_os: String
    is_root: Boolean
    @required mobile_number: String
    notification_id: String
    @required pin: String
    version: String
    @required auth_token: String
}

structure LoginOutput {
    @required state: Integer
    @required message: String
    data: LoginData
}

structure LoginData {
    private_token: String
    mobile_number: String
    time_session: Integer
    name: String
    last_name: String
    second_last_name: String
    document_number: String
    document_extension: String
    document_type: String
    email: String
    city: String
    id: Long
    register_completed: Boolean
    is_client: Boolean
    number_show_form: Integer
    business: String
    RegisterShowForm: Boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Get Profile Parameters  POST /V1/profile/parameters/get
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/profile/parameters/get")
operation GetProfileParameters {
    input: TokenInput
    output: GetProfileParametersOutput
    errors: [ApiError]
}

structure GetProfileParametersOutput {
    @required state: Integer
    @required message: String
    data: ProfileParametersData
}

structure ProfileParametersData {
    greeting: String
    show_dialog: Boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Get Wallet Cards  POST /V1/client/walletcards/information/get
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/client/walletcards/information/get")
operation GetWalletCards {
    input: TokenInput
    output: GetWalletCardsOutput
    errors: [ApiError]
}

structure GetWalletCardsOutput {
    @required state: Integer
    @required message: String
    data: WalletCardsData
}

structure WalletCardsData {
    wallet_cards: WalletCardList
    actions: ActionList
}

list WalletCardList {
    member: WalletCard
}

structure WalletCard {
    id: Long
    account: AccountInfo
    balance: Double
    pan: String
    expiration_date: String
    code: String
    image: String
    enable: Boolean
}

structure AccountInfo {
    number: String
    currency: String
    type: String
}

list ActionList {
    member: WalletAction
}

structure WalletAction {
    date: String
    amount: Double
    currency: String
    type: Integer
    description: String
    detail: String
    destination_account: String
    destination_account_name: String
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Welcome Reference  POST /V1/client/reference/welcome
// ─────────────────────────────────────────────────────────────────────────────
@http(method: "POST", uri: "/V1/client/reference/welcome")
operation WelcomeReference {
    input: TokenInput
    output: WelcomeReferenceOutput
    errors: [ApiError]
}

structure WelcomeReferenceOutput {
    @required state: Integer
    @required message: String
    data: Document
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared structures
// ─────────────────────────────────────────────────────────────────────────────
structure TransactionOutput {
    @required state: Integer
    @required message: String
    data: TransactionData
}

structure TransactionData {
    code: String
    transaction_id: Long
    date: String
}

@error("client")
@httpError(400)
structure ApiError {
    @required message: String
    code: String
}
