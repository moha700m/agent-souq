import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "READ_ONLY_DEMO"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ActionState<T = undefined> {
  ok: boolean;
  message?: string;
  error?: { code: ErrorCode; message: string; fields?: Record<string, string[]> };
  data?: T;
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError(
      "BAD_REQUEST",
      "Please check the highlighted fields.",
      400,
      error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  if (process.env.NODE_ENV !== "test") console.error("Unexpected application error", error);
  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}

export function failedAction<T = undefined>(error: unknown): ActionState<T> {
  const normalized = normalizeError(error);
  return {
    ok: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.fields ? { fields: normalized.fields } : {}),
    },
  };
}

export function assertDb(
  error: { code?: string; message?: string } | null,
  fallback: string,
): asserts error is null {
  if (!error) return;
  if (error.code === "23505") throw new AppError("CONFLICT", fallback, 409);
  if (error.code === "23503" || error.code === "23514" || error.code?.startsWith("22")) {
    throw new AppError("BAD_REQUEST", fallback, 400);
  }
  if (error.code === "42501") throw new AppError("FORBIDDEN", fallback, 403);
  if (error.code === "PGRST116" || error.code === "P0002") {
    throw new AppError("NOT_FOUND", "The requested item was not found.", 404);
  }
  throw new AppError("INTERNAL_ERROR", "The request could not be completed.", 500);
}
