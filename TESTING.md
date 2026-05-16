# Testing Guide for `env-schema-validator`

This guide explains how to verify and test the full feature set of the `env-schema-validator` package.

## 1. Automated Unit Tests
The package comes with a comprehensive test suite using **Vitest**. These tests cover every data type, coercion rule, default value, and error condition.

### How to run:
```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npm run test:watch
```

**What it tests:**
- Type coercion (e.g., `"1"` → `true`, `"3000"` → `3000`).
- Validation logic for URLs and Emails.
- Enum constraints.
- Batch error reporting (throwing all errors at once).
- Fallback to default values.

---

## 2. Integration Testing (Manual)
To verify that the built package works correctly in both CommonJS (CJS) and ES Modules (ESM) environments, we use standalone scripts that import the library from the `dist/` folder.

### CommonJS Verification
Check compatibility with legacy projects or standard Node.js scripts.

**Run the demo script:**
```bash
node tests/demo.cjs
```

### ESM Verification
Check compatibility with modern TypeScript/JavaScript projects.

**Run the ESM demo:**
```bash
node tests/demo_esm.js
```

---

## 3. Type Safety Verification
One of the core features is "Zero Type Casting". You can verify this in your IDE (VS Code):

1. Open `tests/index.test.ts`.
2. Look at the `real-world scenario` test.
3. Hover over the `result` variable. You will see it is fully typed based on the schema:
   ```typescript
   {
     NODE_ENV: string;
     PORT: number;
     DATABASE_URL: string;
     JWT_SECRET: string;
     DEBUG: boolean;
     ADMIN_EMAIL: string;
   }
   ```
4. If you try to assign `result.PORT` to a `string` variable, TypeScript will show an error.

---

## 4. Build Verification
Before publishing, always verify that the build output is correct.

### Check the `dist/` folder:
```bash
ls dist/
# Should contain: index.js, index.cjs, index.d.ts, index.d.cts
```

### Dry-run Pack:
Verify exactly which files will be uploaded to NPM:
```bash
npm pack --dry-run
```
*Expected: Only `dist/`, `README.md`, and `package.json` should be included.*

---

## 5. Summary of Features Tested
| Feature | Tested Via | Result |
| :--- | :--- | :--- |
| **String Type** | Unit Tests & Demo | Pass |
| **Number Coercion** | Unit Tests & Demo | Pass (e.g. "3000" -> 3000) |
| **Boolean Coercion** | Unit Tests & Demo | Pass (e.g. "yes" -> true) |
| **URL Validation** | Unit Tests & Demo | Pass |
| **Email Validation** | Unit Tests & Demo | Pass |
| **Enum Constraints** | Unit Tests & Demo | Pass |
| **Default Values** | Unit Tests & Demo | Pass |
| **Error Formatting** | Unit Tests & Demo | Pass (Human-readable listing) |
| **TS Definitions** | Build & IDE | Pass (DTS files generated) |
| **Dual Build** | Integration Tests | Pass (ESM + CJS) |
