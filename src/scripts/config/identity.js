/** Configuration publique ; les secrets OAuth restent dans nodjs-google-auth. */
export const IDENTITY_APP_ID = 'archcanvas';
export const IDENTITY_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://auth.nicolabz.dev';
