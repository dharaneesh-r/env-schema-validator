const { validateEnv, EnvValidationError } = require('../dist/index.cjs');

// ANSI Color Codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const schema = {
  NODE_ENV: { 
    type: 'string', 
    enum: ['development', 'production', 'test'], 
    default: 'development' 
  },
  PORT: { 
    type: 'number', 
    default: '3000',
    description: 'The port the server will listen on'
  },
  DATABASE_URL: { 
    type: 'url',
    description: 'Connection string for PostgreSQL'
  },
  ENABLE_LOGS: { 
    type: 'boolean', 
    default: 'false' 
  },
  ADMIN_EMAIL: { 
    type: 'email',
    required: false
  },
  API_KEY: {
    type: 'string'
  }
};

console.log(`\n${YELLOW}--- Case 1: Valid Input ---${RESET}`);
try {
  const source = {
    DATABASE_URL: 'https://db.example.com:5432',
    API_KEY: 'sk_12345',
    ENABLE_LOGS: 'yes',
    PORT: '8080'
  };

  const env = validateEnv(schema, source);
  console.log(`${GREEN}✔ Success! Validated Env:${RESET}`, JSON.stringify(env, null, 2));
} catch (err) {
  console.error(`${RED}Unexpected failure:${RESET}`, err.message);
}

console.log(`\n${YELLOW}--- Case 2: Validation Failure (Multiple Errors) ---${RESET}`);
try {
  const source = {
    DATABASE_URL: 'invalid-url',
    PORT: 'not-a-number',
    NODE_ENV: 'staging',
  };

  validateEnv(schema, source);
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.log(`${RED}Caught Expected Errors:${RESET}\n`);
    console.log(err.message);
  } else {
    console.error('Unexpected error type:', err);
  }
}

console.log(`\n${YELLOW}--- Case 3: Default Values ---${RESET}`);
try {
  const source = {
    DATABASE_URL: 'https://localhost:5432',
    API_KEY: 'local_dev'
  };

  const env = validateEnv(schema, source);
  console.log(`${GREEN}✔ Uses defaults for PORT and NODE_ENV:${RESET}`);
  console.log(`PORT: ${env.PORT} (${typeof env.PORT})`);
  console.log(`NODE_ENV: ${env.NODE_ENV}`);
  console.log(`ENABLE_LOGS: ${env.ENABLE_LOGS} (${typeof env.ENABLE_LOGS})`);
} catch (err) {
  console.error(err.message);
}

console.log(`\n${YELLOW}--- Case 4: Corrected Version of Case 2 ---${RESET}`);
try {
  const source = {
    DATABASE_URL: 'https://db.production.com:5432',
    PORT: '5432',
    NODE_ENV: 'production',
    API_KEY: 'prod_secret_key_99'
  };

  const env = validateEnv(schema, source);
  console.log(`${GREEN}✔ Success! The previously failing data is now valid:${RESET}`);
  console.log(JSON.stringify(env, null, 2));
} catch (err) {
  console.error(`${RED}Unexpected failure:${RESET}`, err.message);
}
