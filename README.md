# env-schema-validator

[![npm version](https://img.shields.io/npm/v/env-schema-validator)](https://www.npmjs.com/package/env-schema-validator)
[![license](https://img.shields.io/npm/l/env-schema-validator)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![types](https://img.shields.io/badge/TypeScript-first-blue)](./src/index.ts)

> Zero-dependency, TypeScript-first `.env` validator. Validates all environment variables **at startup**, returns a fully typed object, and tells you **everything that's wrong — all at once**.

---

## The Problem

```ts
// ❌ Without this package — crashes at runtime, no types, no helpful errors
const port = Number(process.env.PORT);        // NaN if PORT is missing
const db   = process.env.DATABASE_URL;        // string | undefined, no safety
const flag = process.env.DEBUG === "true";    // works, but fragile
```

You only discover missing or malformed env vars when your app crashes in production — not at startup.

---

## The Solution

```ts
import { validateEnv } from "env-schema-validator";

const env = validateEnv({
  PORT:         { type: "number",  default: "3000" },
  DATABASE_URL: { type: "url",     description: "PostgreSQL connection string" },
  NODE_ENV:     { type: "string",  enum: ["development", "production", "test"] },
  DEBUG:        { type: "boolean", required: false, default: "false" },
  ADMIN_EMAIL:  { type: "email",   required: false },
});

// ✅ Fully typed — no casting needed
env.PORT         // number
env.DATABASE_URL // string (guaranteed valid URL)
env.DEBUG        // boolean
```

If anything is wrong, you get one clear error at startup — before your server even starts:

```
EnvValidationError: Environment validation failed:

  ✗ DATABASE_URL: is required but not set (PostgreSQL connection string)
  ✗ PORT: must be a number, got "abc"
  ✗ NODE_ENV: must be one of [development, production, test], got "prod"
```

---

## Installation

```bash
npm install env-schema-validator
```

No other dependencies needed. Works with Node.js 18+, ESM and CJS projects.

---

## Usage

### Basic

```ts
import { validateEnv } from "env-schema-validator";

const env = validateEnv({
  APP_NAME: { type: "string" },
  PORT:     { type: "number", default: "3000" },
  DEBUG:    { type: "boolean", required: false, default: "false" },
});

console.log(env.PORT);  // 3000 (number, not string)
console.log(env.DEBUG); // false (boolean, not string)
```

### With dotenv

```ts
import "dotenv/config"; // loads .env into process.env first
import { validateEnv } from "env-schema-validator";

const env = validateEnv({
  DATABASE_URL: { type: "url" },
  JWT_SECRET:   { type: "string" },
});
```

### Recommended — shared config module

Create one file that validates everything at startup. Import it everywhere.

```ts
// src/config.ts
import { validateEnv } from "env-schema-validator";

export const config = validateEnv({
  NODE_ENV:     { type: "string",  enum: ["development", "production", "test"] },
  PORT:         { type: "number",  default: "3000" },
  DATABASE_URL: { type: "url",     description: "PostgreSQL connection string" },
  REDIS_URL:    { type: "url",     required: false },
  JWT_SECRET:   { type: "string",  description: "At least 32 characters" },
  JWT_EXPIRES:  { type: "string",  default: "7d" },
  DEBUG:        { type: "boolean", required: false, default: "false" },
  ADMIN_EMAIL:  { type: "email",   required: false },
  SMTP_HOST:    { type: "string",  required: false },
  SMTP_PORT:    { type: "number",  required: false, default: "587" },
});

// Now import config anywhere:
// import { config } from "./config";
// config.PORT        → number
// config.DATABASE_URL → string
// config.DEBUG       → boolean
```

### Validate a custom object (not process.env)

```ts
const env = validateEnv(
  { PORT: { type: "number" } },
  { PORT: "8080" }  // pass any Record<string, string | undefined>
);
```

---

## Schema Reference

Every key in your schema maps to a `FieldSchema` object:

| Field         | Type                                              | Default  | Description                                  |
|---------------|---------------------------------------------------|----------|----------------------------------------------|
| `type`        | `"string" \| "number" \| "boolean" \| "url" \| "email"` | —  | How to validate and coerce the raw value     |
| `required`    | `boolean`                                         | `true`   | If `false`, missing field is skipped         |
| `default`     | `string`                                          | —        | Raw string used when field is absent         |
| `enum`        | `string[]`                                        | —        | Restricts to a list of allowed values        |
| `description` | `string`                                          | —        | Shown in the error message when field fails  |

---

## Types Explained

| Type      | What it accepts                                         | JS output   |
|-----------|---------------------------------------------------------|-------------|
| `string`  | Any non-empty string                                    | `string`    |
| `number`  | Any numeric string (`"3000"`, `"3.14"`, `"-1"`)        | `number`    |
| `boolean` | `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off`    | `boolean`   |
| `url`     | Any string parseable by `new URL()` (must include protocol) | `string` |
| `email`   | Basic `user@domain.tld` format                          | `string`    |

Boolean coercion is **case-insensitive** — `TRUE`, `True`, `YES` all work.

---

## API

### `validateEnv(schema, source?)`

```ts
function validateEnv<S extends EnvSchema>(
  schema: S,
  source?: Record<string, string | undefined>  // defaults to process.env
): ValidatedEnv<S>
```

- **On success** — returns a typed `ValidatedEnv<S>` object with all values coerced to their proper JS types.
- **On failure** — throws `EnvValidationError` with **all** problems listed, not just the first one.

---

### `EnvValidationError`

```ts
import { validateEnv, EnvValidationError } from "env-schema-validator";

try {
  const env = validateEnv(schema);
} catch (err) {
  if (err instanceof EnvValidationError) {
    // Human-readable multi-line string — log this
    console.error(err.message);

    // Machine-readable array — use this programmatically
    err.errors.forEach(({ key, message }) => {
      console.error(`${key}: ${message}`);
    });

    process.exit(1);
  }
}
```

`err.errors` is an array of `{ key: string; message: string }` objects, one per failed field.

---

## Why Not Just Use `envalid` or `zod`?

| Feature                          | `dotenv` | `envalid` | `zod` | **env-schema-validator** |
|----------------------------------|:--------:|:---------:|:-----:|:------------------------:|
| Zero runtime dependencies        | ✅        | ❌         | ❌    | ✅                        |
| TypeScript types from schema     | ❌        | ✅         | ✅    | ✅                        |
| URL + email types built-in       | ❌        | ✅         | ❌    | ✅                        |
| Reports ALL errors at once       | ❌        | ✅         | ✅    | ✅                        |
| ESM + CJS dual output            | ❌        | ❌         | ✅    | ✅                        |
| Single file, no config needed    | ❌        | ❌         | ❌    | ✅                        |

---

## TypeScript Support

Full types come included — no `@types/` package needed.

```ts
import { validateEnv, EnvSchema, ValidatedEnv, EnvValidationError } from "env-schema-validator";

const schema = {
  PORT: { type: "number" as const },
  NAME: { type: "string" as const },
} satisfies EnvSchema;

type AppEnv = ValidatedEnv<typeof schema>;
// { PORT: number; NAME: string }
```

---

## Example `.env` File

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=my-very-long-secret-key-here
DEBUG=false
ADMIN_EMAIL=admin@example.com
```

---

## Contributing

```bash
git clone https://github.com/dharaneesh-r/env-schema-validator
cd env-schema-validator
npm install
npm test          # run tests
npm run test:watch  # watch mode
npm run build     # build dist/
```

---

## License

MIT © Dharaneesh R