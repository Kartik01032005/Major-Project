export type HealthResponse = {
  success: boolean;
  message: string;
};

export type ApiValidationError = {
  msg?: string;
  path?: string;
};

type ApiObject = Record<string, unknown>;

type ErrorResponse = ApiObject & {
  message?: string;
  errors?: ApiValidationError[];
};

export function isApiObject(value: unknown): value is ApiObject {
  return typeof value === "object" && value !== null;
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return isApiObject(value) && ("message" in value ? typeof value.message === "string" : true);
}

export function getResponseError(value: unknown, fallback: string): string {
  if (!isErrorResponse(value)) return fallback;
  if (value.message) return value.message;
  const firstError = Array.isArray(value.errors) ? value.errors.find((error) => typeof error.msg === "string") : undefined;
  return firstError?.msg ?? fallback;
}
