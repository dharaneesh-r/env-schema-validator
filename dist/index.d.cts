type FieldType = "string" | "number" | "boolean" | "url" | "email";
interface FieldSchema {
    type: FieldType;
    required?: boolean;
    default?: string;
    enum?: string[];
    description?: string;
}
type EnvSchema = Record<string, FieldSchema>;
type ValidatedEnv<S extends EnvSchema> = {
    [K in keyof S]: S[K]["type"] extends "number" ? number : S[K]["type"] extends "boolean" ? boolean : string;
};
interface ValidationError {
    key: string;
    message: string;
}
declare class EnvValidationError extends Error {
    errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
declare function validateEnv<S extends EnvSchema>(schema: S, source?: Record<string, string | undefined>): ValidatedEnv<S>;

export { type EnvSchema, EnvValidationError, type FieldSchema, type FieldType, type ValidatedEnv, type ValidationError, validateEnv };
