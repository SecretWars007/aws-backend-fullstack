import { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * POST /V1/client/reference/welcome
 * According to the PDF, this returns a 404 with a Cannot POST message.
 * We emulate this behavior.
 */
export const handler: APIGatewayProxyHandler = async (_event) => {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Error</title></head><body><pre>Cannot POST /V1/client/reference/welcome</pre></body></html>`,
  };
};
