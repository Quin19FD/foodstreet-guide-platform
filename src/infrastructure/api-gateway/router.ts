import { mockPlatformService } from "@/application/services/mock-platform";

export interface GatewayDispatchInput {
  service: string;
  method: string;
  pathSegments: string[];
  searchParams: URLSearchParams;
  body: unknown;
}

export interface GatewayDispatchOutput {
  status: number;
  data: unknown;
}

export function dispatchGatewayRequest(input: GatewayDispatchInput): GatewayDispatchOutput {
  const method = input.method.toUpperCase();
  const [segment1, segment2] = input.pathSegments;

  if (input.service === "auth" && method === "POST" && segment1 === "login") {
    const payload = input.body as { username?: string } | null;
    const username = payload?.username ?? "admin";
    return { status: 200, data: mockPlatformService.auth.login(username) };
  }

  if (input.service === "poi" && method === "GET" && segment1 === "districts" && segment2) {
    return { status: 200, data: mockPlatformService.poi.listByDistrict(segment2) };
  }

  if (input.service === "poi" && method === "GET" && segment1 === "pois") {
    return { status: 200, data: mockPlatformService.poi.listAll() };
  }

  if (input.service === "tour" && method === "GET" && segment1 === "tours") {
    return { status: 200, data: mockPlatformService.tour.list() };
  }

  if (input.service === "audio-guide" && method === "GET" && segment1 === "poi" && segment2) {
    return { status: 200, data: mockPlatformService.audioGuide.listByPOI(segment2) };
  }

  if (input.service === "translation" && method === "GET" && segment1 === "translations") {
    return { status: 200, data: mockPlatformService.translation.list() };
  }

  if (input.service === "location" && method === "POST" && segment1 === "nearest-poi") {
    const payload = input.body as { latitude: number; longitude: number; districtId?: string };
    const nearest = mockPlatformService.location.nearestPOI(payload);
    return { status: 200, data: nearest };
  }

  if (input.service === "district" && method === "GET" && segment1 === "districts") {
    return { status: 200, data: mockPlatformService.districts.list() };
  }

  return {
    status: 404,
    data: {
      error: "Gateway route not found",
      service: input.service,
      method,
      path: `/${input.pathSegments.join("/")}`,
    },
  };
}
