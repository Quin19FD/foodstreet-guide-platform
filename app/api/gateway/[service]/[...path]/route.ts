import { dispatchGatewayRequest } from "@/infrastructure/api-gateway/router";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    service: string;
    path: string[];
  }>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const body = request.method === "GET" ? null : await request.json().catch(() => null);

  const result = dispatchGatewayRequest({
    service: params.service,
    method: request.method,
    pathSegments: params.path ?? [],
    searchParams: request.nextUrl.searchParams,
    body,
  });

  return NextResponse.json(result.data, { status: result.status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}
