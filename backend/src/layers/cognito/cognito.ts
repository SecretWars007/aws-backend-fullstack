import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID ?? '';
const clientId = process.env.COGNITO_CLIENT_ID ?? '';

const cognitoClient = new CognitoIdentityProviderClient({ region });

export interface CognitoRegisterInput {
  username: string; // cellphone used as username
  email: string;
  phone_number: string;
  password: string;
  /** Custom Cognito attributes */
  custom?: Record<string, string>;
}

export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration — AdminCreateUser + set permanent password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new user in the Cognito User Pool using the admin API.
 * We suppress the welcome email (SUPPRESS) because the app handles OTP via SMS.
 */
export async function cognitoAdminRegisterUser(
  input: CognitoRegisterInput,
): Promise<string> {
  const userAttributes = [
    { Name: 'email', Value: input.email },
    { Name: 'phone_number', Value: input.phone_number.startsWith('+') ? input.phone_number : `+591${input.phone_number}` },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'phone_number_verified', Value: 'true' },
    ...(input.custom
      ? Object.entries(input.custom).map(([key, value]) => ({
          Name: `custom:${key}`,
          Value: value,
        }))
      : []),
  ];

  const createResp = await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: input.username,
      UserAttributes: userAttributes,
      MessageAction: MessageActionType.SUPPRESS,
      TemporaryPassword: input.password,
    }),
  );

  const sub =
    createResp.User?.Attributes?.find((a) => a.Name === 'sub')?.Value ?? '';

  // Set permanent password immediately (skip force-change-password state)
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: input.username,
      Password: input.password,
      Permanent: true,
    }),
  );

  return sub;
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication — AdminInitiateAuth (USER_PASSWORD_AUTH)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user via username + password using admin credentials.
 * Returns Cognito tokens (access, id, refresh).
 */
export async function cognitoAdminLogin(
  username: string,
  password: string,
): Promise<CognitoAuthResult> {
  const resp = await cognitoClient.send(
    new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }),
  );

  const auth = resp.AuthenticationResult;
  if (!auth) throw new Error('Authentication failed: no tokens returned');

  return {
    accessToken: auth.AccessToken!,
    idToken: auth.IdToken!,
    refreshToken: auth.RefreshToken!,
    expiresIn: auth.ExpiresIn ?? 3600,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate / Get user
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a user's attributes from Cognito.
 */
export async function cognitoGetUser(
  username: string,
): Promise<Record<string, string>> {
  const resp = await cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username }),
  );

  const attrs: Record<string, string> = {};
  for (const attr of resp.UserAttributes ?? []) {
    if (attr.Name) attrs[attr.Name] = attr.Value ?? '';
  }
  return attrs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update user attributes
// ─────────────────────────────────────────────────────────────────────────────

export async function cognitoUpdateUserAttributes(
  username: string,
  attributes: Record<string, string>,
): Promise<void> {
  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: Object.entries(attributes).map(([Name, Value]) => ({
        Name,
        Value,
      })),
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP / Forgot password flows (standard Cognito)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers the Cognito forgot-password flow, which sends an OTP code.
 */
export async function cognitoForgotPassword(username: string): Promise<void> {
  await cognitoClient.send(
    new ForgotPasswordCommand({ ClientId: clientId, Username: username }),
  );
}

/**
 * Confirms the OTP code and sets a new password.
 */
export async function cognitoConfirmForgotPassword(
  username: string,
  confirmationCode: string,
  newPassword: string,
): Promise<void> {
  await cognitoClient.send(
    new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    }),
  );
}

/**
 * Confirms user sign-up with the OTP code (standard sign-up flow).
 */
export async function cognitoConfirmSignUp(
  username: string,
  confirmationCode: string,
): Promise<void> {
  await cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    }),
  );
}
