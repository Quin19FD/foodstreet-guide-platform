/**
 * Prisma Client singleton for Next.js runtime.
 *
 * Lý do: Next.js dev mode có thể hot-reload nhiều lần, nếu tạo PrismaClient mới liên tục
 * sẽ dễ bị "too many connections".
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}
