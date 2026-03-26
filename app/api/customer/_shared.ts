import { prisma } from "@/infrastructure/database/prisma/client";

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function inferPoiType(category?: string | null): "FOOD_STALL" | "SUPPORTING_FACILITY" {
  const normalized = (category ?? "").trim().toLowerCase();
  if (
    normalized.includes("facility") ||
    normalized.includes("toilet") ||
    normalized.includes("wc") ||
    normalized.includes("parking")
  ) {
    return "SUPPORTING_FACILITY";
  }
  return "FOOD_STALL";
}

export async function ensureCustomerExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, isActive: true },
  });

  if (!user) return null;
  if (user.role !== "USER") return null;
  if (!user.isActive) return null;
  if (user.status !== "APPROVED") return null;
  return user;
}
