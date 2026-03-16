import { prisma } from "@/infrastructure/database/prisma/client";
import type { NextRequest } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ActivityLogInput = {
  userId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  request?: NextRequest;
};

function getRequestContext(request?: NextRequest): {
  ip?: string;
  userAgent?: string;
} {
  if (!request) return {};

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
  const userAgent = request.headers.get("user-agent") || undefined;
  return { ip, userAgent };
}

async function appendActivityLogLine(line: unknown): Promise<void> {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    await appendFile(path.join(logsDir, "activity.log"), `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // Best-effort: file logging should not break request handling.
  }
}

/**
 * Ghi activity log:
 * - DB: bảng `user_activity`
 * - File: `logs/activity.log` (JSON Lines)
 */
export async function logUserActivity(input: ActivityLogInput): Promise<void> {
  const { ip, userAgent } = getRequestContext(input.request);

  await Promise.allSettled([
    prisma.userActivity.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
      },
    }),
    appendActivityLogLine({
      ts: new Date().toISOString(),
      userId: input.userId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      ip,
      userAgent,
      meta: input.meta ?? null,
    }),
  ]);
}

