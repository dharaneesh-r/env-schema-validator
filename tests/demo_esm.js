import { validateEnv, EnvValidationError } from '../dist/index.js';

const schema = {
  APP_NAME: { type: 'string', default: 'My App' },
  IS_PRODUCTION: { type: 'boolean' }
};

console.log('--- ESM Test ---');
try {
  const env = validateEnv(schema, { IS_PRODUCTION: 'true' });
  console.log('ESM Import Success:', env);
} catch (err) {
  console.error('ESM Import Failed:', err);
}
