import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, serverError } from '../utils/response';
import { Extension } from '../types';

const EXTENSIONS: Extension[] = [
  { name: 'La Paz',      extension: 'LP', type: 'Q' },
  { name: 'Sucre',       extension: 'CH', type: 'Q' },
  { name: 'Cochabamba',  extension: 'CB', type: 'Q' },
  { name: 'Potosí',      extension: 'PT', type: 'Q' },
  { name: 'Oruro',       extension: 'OR', type: 'Q' },
  { name: 'Santa Cruz',  extension: 'SC', type: 'Q' },
  { name: 'Tarija',      extension: 'TJ', type: 'Q' },
  { name: 'Beni',        extension: 'BE', type: 'Q' },
  { name: 'Pando',       extension: 'PA', type: 'Q' },
  { name: 'Extranjero',  extension: 'EX', type: 'P' },
];

/**
 * POST /V1/client/device/register/extension/get
 * Returns the Bolivian department extension catalog.
 */
export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    return ok({ extensions: EXTENSIONS });
  } catch (err) {
    console.error('[getExtensionCatalog]', err);
    return serverError('Internal server error');
  }
};
