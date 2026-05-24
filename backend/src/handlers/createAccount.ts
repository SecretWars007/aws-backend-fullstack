import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, badRequest, serverError, parseBody, generateTransactionResponse, hashPin } from '../utils/response';
import { query, withTransaction } from '../layers/database/db';
import { cognitoAdminRegisterUser } from '../layers/cognito/cognito';
import { CreateAccountInput } from '../types';

/**
 * POST /V1/register/create/account
 * Finalizes account creation by registering the user in Cognito, creating the wallet,
 * and associating the device.
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<CreateAccountInput>(event);

    if (!body.cellphone || !body.pin || !body.document_number || !body.id) {
      return badRequest('cellphone, pin, document_number, and id are required');
    }

    // Hash the PIN locally to save it to DB (Cognito also gets it as password)
    const pinHashed = await hashPin(body.pin);

    // 1. Create the user in Cognito using the phone number as username
    // We pass the PIN as the permanent password.
    // Cognito requires E.164 format (+591XXXXXXXX) when phone is a signInAlias
    const e164Phone = body.cellphone.startsWith('+')
      ? body.cellphone
      : `+591${body.cellphone}`;

    // PIN must meet Cognito minLength=6; pad with trailing zeros if needed
    const cognitoPassword = body.pin.length >= 6 ? body.pin : body.pin.padEnd(6, '0');

    let cognitoSub = '';
    try {
      cognitoSub = await cognitoAdminRegisterUser({
        username: e164Phone,          // E.164 phone as username
        email: body.email,
        phone_number: e164Phone,
        password: cognitoPassword,
        custom: {
          cic: body.cic,
          document_number: body.document_number,
        },
      });
    } catch (err: any) {
      console.error('[Cognito Registration Error]', err);
      if (err.name === 'UsernameExistsException') {
        // Handle appropriately; for now we can proceed or throw
        return badRequest('User already exists in the system.');
      }
      throw err;
    }

    // 2. Wrap database updates in a transaction
    await withTransaction(async (client) => {
      // Update user record
      await client.query(
        `UPDATE users
         SET cognito_sub = $1,
             pin_hash = $2,
             register_completed = true,
             home_address = COALESCE($3, home_address),
             cic = COALESCE($4, cic),
             is_client = COALESCE($5, is_client),
             updated_at = NOW()
         WHERE id = $6`,
        [cognitoSub, pinHashed, body.home_address, body.cic, body.is_client, body.id],
      );

      // Link device to user
      await client.query(
        `UPDATE devices
         SET user_id = $1, updated_at = NOW()
         WHERE certified_id = $2`,
        [body.id, body.certified_id],
      );

      // Create initial wallet account (empty)
      const walletAccountNum = `700${Math.floor(Math.random() * 90000) + 10000}`;
      await client.query(
        `INSERT INTO wallet_accounts (user_id, account_number, balance)
         VALUES ($1, $2, 0)
         ON CONFLICT (account_number) DO NOTHING`,
        [body.id, walletAccountNum],
      );
    });

    return ok(generateTransactionResponse('ACCOUNT_CREATED'), '¡Felicidades! Tu cuenta ha sido creada exitosamente.');
  } catch (err) {
    console.error('[createAccount]', err);
    return serverError('Internal server error');
  }
};
