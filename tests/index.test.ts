import { describe, it, expect } from "vitest";
import { validateEnv, EnvValidationError } from "../src/index";

function env(overrides: Record<string, string | undefined> = {}) {
  return overrides;
}

describe("env-schema-validator", () => {
  describe("string", () => {
    it("passes valid string", () => {
      const schema = { API_KEY: { type: "string" as const } };
      const source = env({ API_KEY: "secret123" });
      const result = validateEnv(schema, source);
      expect(result.API_KEY).toBe("secret123");
    });

    it("fails missing required string", () => {
      const schema = { API_KEY: { type: "string" as const } };
      const source = env({});
      expect(() => validateEnv(schema, source)).toThrow(EnvValidationError);
    });

    it("uses default when optional string is missing", () => {
      const schema = { HOST: { type: "string" as const, required: false, default: "localhost" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.HOST).toBe("localhost");
    });
  });

  describe("number", () => {
    it("coerces numeric string to number", () => {
      const schema = { PORT: { type: "number" as const } };
      const source = env({ PORT: "3000" });
      const result = validateEnv(schema, source);
      expect(result.PORT).toBe(3000);
      expect(typeof result.PORT).toBe("number");
    });

    it("fails on non-numeric string", () => {
      const schema = { PORT: { type: "number" as const } };
      const source = env({ PORT: "abc" });
      expect(() => validateEnv(schema, source)).toThrow(/must be a number/);
    });

    it("uses default for number", () => {
      const schema = { TIMEOUT: { type: "number" as const, default: "5000" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.TIMEOUT).toBe(5000);
    });
  });

  describe("boolean", () => {
    it("coerces true variants", () => {
      const schema = {
        B1: { type: "boolean" as const },
        B2: { type: "boolean" as const },
        B3: { type: "boolean" as const },
        B4: { type: "boolean" as const },
      };
      const source = env({ B1: "true", B2: "1", B3: "yes", B4: "on" });
      const result = validateEnv(schema, source);
      expect(result.B1).toBe(true);
      expect(result.B2).toBe(true);
      expect(result.B3).toBe(true);
      expect(result.B4).toBe(true);
    });

    it("coerces false variants", () => {
      const schema = {
        B1: { type: "boolean" as const },
        B2: { type: "boolean" as const },
        B3: { type: "boolean" as const },
        B4: { type: "boolean" as const },
      };
      const source = env({ B1: "false", B2: "0", B3: "no", B4: "off" });
      const result = validateEnv(schema, source);
      expect(result.B1).toBe(false);
      expect(result.B2).toBe(false);
      expect(result.B3).toBe(false);
      expect(result.B4).toBe(false);
    });

    it("fails on invalid boolean string", () => {
      const schema = { DEBUG: { type: "boolean" as const } };
      const source = env({ DEBUG: "maybe" });
      expect(() => validateEnv(schema, source)).toThrow(/must be a boolean/);
    });
    it("uses default for boolean", () => {
      const schema = { DEBUG: { type: "boolean" as const, default: "true" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.DEBUG).toBe(true);
    });
  });

  describe("url", () => {
    it("accepts valid URL", () => {
      const schema = { SITE_URL: { type: "url" as const } };
      const source = env({ SITE_URL: "https://example.com" });
      const result = validateEnv(schema, source);
      expect(result.SITE_URL).toBe("https://example.com");
    });

    it("rejects invalid URL", () => {
      const schema = { SITE_URL: { type: "url" as const } };
      const source = env({ SITE_URL: "not-a-url" });
      expect(() => validateEnv(schema, source)).toThrow(/must be a valid URL/);
    });
    it("uses default for url", () => {
      const schema = { SITE_URL: { type: "url" as const, default: "https://default.com" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.SITE_URL).toBe("https://default.com");
    });
  });

  describe("email", () => {
    it("accepts valid email", () => {
      const schema = { ADMIN_EMAIL: { type: "email" as const } };
      const source = env({ ADMIN_EMAIL: "user@example.com" });
      const result = validateEnv(schema, source);
      expect(result.ADMIN_EMAIL).toBe("user@example.com");
    });

    it("rejects invalid email", () => {
      const schema = { ADMIN_EMAIL: { type: "email" as const } };
      const source = env({ ADMIN_EMAIL: "notanemail" });
      expect(() => validateEnv(schema, source)).toThrow(/must be a valid email/);
    });
    it("uses default for email", () => {
      const schema = { ADMIN_EMAIL: { type: "email" as const, default: "admin@example.com" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.ADMIN_EMAIL).toBe("admin@example.com");
    });
  });

  describe("enum", () => {
    it("accepts allowed value", () => {
      const schema = { NODE_ENV: { type: "string" as const, enum: ["dev", "prod"] } };
      const source = env({ NODE_ENV: "prod" });
      const result = validateEnv(schema, source);
      expect(result.NODE_ENV).toBe("prod");
    });

    it("rejects value not in list", () => {
      const schema = { NODE_ENV: { type: "string" as const, enum: ["dev", "prod"] } };
      const source = env({ NODE_ENV: "staging" });
      expect(() => validateEnv(schema, source)).toThrow(/must be one of \[dev, prod\]/);
    });
    it("uses default for enum", () => {
      const schema = { NODE_ENV: { type: "string" as const, enum: ["dev", "prod"], default: "dev" } };
      const source = env({});
      const result = validateEnv(schema, source);
      expect(result.NODE_ENV).toBe("dev");
    });
  });

  describe("error handling", () => {
    it("reports multiple errors at once", () => {
      const schema = {
        A: { type: "string" as const },
        B: { type: "number" as const },
        C: { type: "boolean" as const },
      };
      const source = env({});
      try {
        validateEnv(schema, source);
        expect.fail("Should have thrown");
      } catch (err) {
        const e = err as EnvValidationError;
        expect(e.errors).toHaveLength(3);
        expect(e.message).toContain("✗ A:");
        expect(e.message).toContain("✗ B:");
        expect(e.message).toContain("✗ C:");
      }
    });

    it("includes description in error message", () => {
      const schema = {
        DB_URL: { type: "url" as const, description: "Main database connection string" },
      };
      const source = env({});
      try {
        validateEnv(schema, source);
      } catch (err) {
        const e = err as EnvValidationError;
        expect(e.message).toContain("(Main database connection string)");
      }
    });
  });

  describe("real-world scenario", () => {
    it("validates a full backend schema correctly", () => {
      const schema = {
        NODE_ENV: { type: "string" as const, enum: ["development", "production", "test"], default: "development" },
        PORT: { type: "number" as const, default: "3000" },
        DATABASE_URL: { type: "url" as const },
        JWT_SECRET: { type: "string" as const },
        DEBUG: { type: "boolean" as const, default: "false" },
        ADMIN_EMAIL: { type: "email" as const },
      };

      const source = env({
        DATABASE_URL: "postgres://localhost:5432/db",
        JWT_SECRET: "super-secret",
        ADMIN_EMAIL: "admin@company.com",
      });

      const result = validateEnv(schema, source);

      expect(result).toEqual({
        NODE_ENV: "development",
        PORT: 3000,
        DATABASE_URL: "postgres://localhost:5432/db",
        JWT_SECRET: "super-secret",
        DEBUG: false,
        ADMIN_EMAIL: "admin@company.com",
      });

      // Type checking (simulated via tests)
      const port: number = result.PORT;
      const debug: boolean = result.DEBUG;
      const nodeEnv: string = result.NODE_ENV;
      expect(typeof port).toBe("number");
      expect(typeof debug).toBe("boolean");
      expect(typeof nodeEnv).toBe("string");
    });
  });
});
