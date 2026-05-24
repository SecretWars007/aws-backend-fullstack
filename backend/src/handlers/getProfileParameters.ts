import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok, serverError } from '../utils/response';
import { ProfileParametersData } from '../types';

/**
 * POST /V1/profile/parameters/get
 */
export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    return ok<ProfileParametersData>({
      greeting: '¡Hola Gus!',
      show_dialog: false,
    });
  } catch (err) {
    console.error('[getProfileParameters]', err);
    return serverError('Internal server error');
  }
};
