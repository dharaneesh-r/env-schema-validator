// src/index.ts
var EnvValidationError = class extends Error {
  constructor(errors) {
    const lines = errors.map((e) => `  \u2717 ${e.key}: ${e.message}`).join("\n");
    super(`Environment validation failed:

${lines}
`);
    this.name = "EnvValidationError";
    this.errors = errors;
  }
};
function coerceBoolean(raw) {
  if (["true", "1", "yes", "on"].includes(raw.toLowerCase())) return true;
  if (["false", "0", "no", "off"].includes(raw.toLowerCase())) return false;
  return void 0;
}
function coerceNumber(raw) {
  const n = Number(raw);
  return isNaN(n) ? void 0 : n;
}
function isValidUrl(raw) {
  try {
    new URL(raw);
    return true;
  } catch {
    return false;
  }
}
function isValidEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}
function validateEnv(schema, source = process.env) {
  const errors = [];
  const result = {};
  for (const [key, field] of Object.entries(schema)) {
    const required = field.required !== false;
    const raw = source[key] ?? field.default;
    if (raw === void 0 || raw === "") {
      if (required) {
        const hint = field.description ? ` (${field.description})` : "";
        errors.push({ key, message: `is required but not set${hint}` });
      }
      continue;
    }
    switch (field.type) {
      case "string":
        result[key] = raw;
        break;
      case "number": {
        const n = coerceNumber(raw);
        if (n === void 0) {
          errors.push({ key, message: `must be a number, got "${raw}"` });
          continue;
        }
        result[key] = n;
        break;
      }
      case "boolean": {
        const b = coerceBoolean(raw);
        if (b === void 0) {
          errors.push({ key, message: `must be a boolean (true/false/1/0/yes/no/on/off), got "${raw}"` });
          continue;
        }
        result[key] = b;
        break;
      }
      case "url":
        if (!isValidUrl(raw)) {
          errors.push({ key, message: `must be a valid URL, got "${raw}"` });
          continue;
        }
        result[key] = raw;
        break;
      case "email":
        if (!isValidEmail(raw)) {
          errors.push({ key, message: `must be a valid email, got "${raw}"` });
          continue;
        }
        result[key] = raw;
        break;
    }
    if (field.enum && result[key] !== void 0) {
      const coerced = String(result[key]);
      if (!field.enum.includes(coerced)) {
        errors.push({ key, message: `must be one of [${field.enum.join(", ")}], got "${coerced}"` });
      }
    }
  }
  if (errors.length > 0) throw new EnvValidationError(errors);
  return result;
}
export {
  EnvValidationError,
  validateEnv
};
