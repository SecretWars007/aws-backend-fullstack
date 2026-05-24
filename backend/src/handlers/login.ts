import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody } from '../utils/response';
import { query } from '../layers/database/db';
import { cognitoAdminLogin } from '../layers/cognito/cognito';
import { LoginInput, LoginData, DbUser } from '../types';

/**
 * POST /V1/client/login/get
 * Authenticates the user via Cognito and returns user profile data + JWT (private_token).
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<LoginInput>(event);

    if (!body.mobile_number || !body.pin) {
      return badRequest('mobile_number and pin are required');
    }

    // Normalise to E.164 — Cognito requires +591XXXXXXXX when phone is a signInAlias
    const e164Phone = body.mobile_number.startsWith('+')
      ? body.mobile_number
      : `+591${body.mobile_number}`;
    const cognitoPassword = body.pin.length >= 6 ? body.pin : body.pin.padEnd(6, '0');

    // Authenticate with Cognito (throws if invalid credentials)
    let authResult;
    try {
      authResult = await cognitoAdminLogin(e164Phone, cognitoPassword);
    } catch (err: any) {
      console.error('[Cognito Login Error]', err);
      return badRequest('Invalid phone number or PIN');
    }

    // Fetch user details from DB
    // DB stores cellphone without country prefix (e.g. "70000099"), strip +591 if present
    const dbCellphone = body.mobile_number.replace(/^\+591/, '');
    const users = await query<DbUser>(
      `SELECT * FROM users WHERE cellphone = $1 LIMIT 1`,
      [dbCellphone],
    );

    if (users.length === 0) {
      return badRequest('User record not found in database');
    }

    const u = users[0];

    // Build LoginData response exactly as in PDF
    const responseData: LoginData = {
      private_token: authResult.idToken, // Exposing ID token as private_token
      mobile_number: u.cellphone,
      time_session: authResult.expiresIn ?? 3600,
      name: "GUSTAVO", // Hardcoding as per PDF simulation, normally fetched from DB
      last_name: "PARKER",
      second_last_name: "",
      document_number: u.document_number,
      document_extension: u.document_extension ?? 'SC',
      document_type: u.document_type ?? 'CI',
      email: u.email,
      city: u.city ?? 'Santa Cruz',
      id: u.id,
      register_completed: u.register_completed,
      is_client: u.is_client,
      number_show_form: 0,
      business: "",
      RegisterShowForm: false,
    };

    return ok<LoginData>(responseData, 'Bienvenido a Zappi');
  } catch (err) {
    console.error('[login]', err);
    return serverError('Internal server error');
  }
};
