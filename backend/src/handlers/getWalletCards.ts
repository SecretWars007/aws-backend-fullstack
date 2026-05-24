import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, serverError, parseBody } from '../utils/response';
import { query } from '../layers/database/db';
import { WalletCardsData, WalletCard, WalletAction } from '../types';

/**
 * POST /V1/client/walletcards/information/get
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseBody<{ auth_token: string }>(event);

    // In a real app, we would decode the JWT / ID Token from headers or body
    // to find the user_id. For now, we mock it.

    const walletCards: WalletCard[] = [
      {
        id: 456789,
        account: {
          number: '70012345',
          currency: 'BOL',
          type: 'BIL',
        },
        balance: 1250.50,
        pan: '',
        expiration_date: '',
        code: '',
        image: '',
        enable: true,
      },
    ];

    const actions: WalletAction[] = [
      {
        date: '2026-05-10 09:00',
        amount: -50.00,
        currency: 'BOL',
        type: 12,
        description: 'BL PAGO TIGO',
        detail: 'Recarga de crédito',
        destination_account: '77011223',
        destination_account_name: null,
      },
      {
        date: '2026-05-10 09:00',
        amount: -50.00,
        currency: 'BOL',
        type: 12,
        description: 'BL PAGO TIGO',
        detail: 'Recarga de crédito',
        destination_account: '77011223',
        destination_account_name: null,
      },
    ];

    return ok<WalletCardsData>({ wallet_cards: walletCards, actions }, 'Operación exitosa');
  } catch (err) {
    console.error('[getWalletCards]', err);
    return serverError('Internal server error');
  }
};
