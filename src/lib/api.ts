import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { AppError, normalizeError } from "@/lib/errors";
export function apiSuccess<T>(data: T, init?: ResponseInit) { return NextResponse.json({ data }, init); }
export function apiError(e: unknown) { const x = normalizeError(e); return NextResponse.json({ error: { code: x.code, message: x.message, ...(x.fields ? { fields: x.fields } : {}) } }, { status: x.status }); }
export async function parseJson<T>(r: Request, schema: ZodType<T>) { let b: unknown; try { b = await r.json(); } catch { throw new AppError("BAD_REQUEST", "Request body must be valid JSON.", 400); } const p = schema.safeParse(b); if (!p.success) throw p.error; return p.data; }
export function assertSameOrigin(request: Request) { const origin=request.headers.get("origin"); if(!origin)return; try { if(new URL(origin).origin!==new URL(request.url).origin)throw new Error("cross-origin"); } catch { throw new AppError("FORBIDDEN","Cross-origin mutation requests are not allowed.",403); } }
