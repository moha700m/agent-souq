import { installFreeAgent } from "@/actions/interactions";
import { apiError, apiSuccess, assertSameOrigin } from "@/lib/api";

type Context = { params: Promise<{ identifier: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await installFreeAgent((await context.params).identifier);
    return apiSuccess(
      { isInstalled: true },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
