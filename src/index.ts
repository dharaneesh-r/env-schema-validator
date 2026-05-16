// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "string" | "number" | "boolean" | "url" | "email";

export interface FieldSchema {
  type: FieldType;
  required?: boolean;       // default true
  default?: string;         // raw string, coerced after
  enum?: string[];          // allowed values (post-coercion, as string)
  description?: string;     // shown in error messages
}

export type EnvSchema = Record<string, FieldSchema>;

export type ValidatedEnv<S extends EnvSchema> = {
  [K in keyof S]: S[K]["type"] extends "number"
    ? number
    : S[K]["type"] extends "boolean"
    ? boolean
    : string;
};

export interface ValidationError {
  key: string;
  message: string;
}

export class EnvValidationError extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    const lines = errors.map((e) => `  ✗ ${e.key}: ${e.message}`).join("\n");
    super(`Environment validation failed:\n\n${lines}\n`);
    this.name = "EnvValidationError";
    this.errors = errors;
  }
}

// ─── Coercers ─────────────────────────────────────────────────────────────────

function coerceBoolean(raw: string): boolean | undefined {
  if (["true", "1", "yes", "on"].includes(raw.toLowerCase())) return true;
  if (["false", "0", "no", "off"].includes(raw.toLowerCase())) return false;
  return undefined;
}

function coerceNumber(raw: string): number | undefined {
  const n = Number(raw);
  return isNaN(n) ? undefined : n;
}

function isValidUrl(raw: string): boolean {
  try { new URL(raw); return true; } catch { return false; }
}

function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateEnv<S extends EnvSchema>(
  schema: S,
  source: Record<string, string | undefined> = process.env
): ValidatedEnv<S> {
  const errors: ValidationError[] = [];
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(schema)) {
    const required = field.required !== false;
    const raw = source[key] ?? field.default;

    if (raw === undefined || raw === "") {
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
        if (n === undefined) {
          errors.push({ key, message: `must be a number, got "${raw}"` });
          continue;
        }
        result[key] = n;
        break;
      }
      case "boolean": {
        const b = coerceBoolean(raw);
        if (b === undefined) {
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

    if (field.enum && result[key] !== undefined) {
      const coerced = String(result[key]);
      if (!field.enum.includes(coerced)) {
        errors.push({ key, message: `must be one of [${field.enum.join(", ")}], got "${coerced}"` });
      }
    }
  }

  if (errors.length > 0) throw new EnvValidationError(errors);
  return result as ValidatedEnv<S>;
}
