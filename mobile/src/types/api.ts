export type HealthResponse = {
  success: boolean;
  message: string;
};

type ApiObject = Record<string, unknown>;

type ErrorResponse = ApiObject & {
  message?: string;
};

export function isApiObject(value: unknown): value is ApiObject {
  return typeof value === "object" && value !== null;
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return isApiObject(value) && ("message" in value ? typeof value.message === "string" : true);
}
