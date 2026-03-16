import { AdminLayout } from "@/components/layouts/admin-layout";
import { prisma } from "@/infrastructure/database/prisma/client";

export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSingle(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminActivityLogsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = (toSingle(params.q) ?? "").trim();
  const action = (toSingle(params.action) ?? "").trim();
  const userId = (toSingle(params.userId) ?? "").trim();

  const where =
    q || action || userId
      ? {
          ...(action ? { action } : {}),
          ...(userId ? { userId } : {}),
          ...(q
            ? {
                OR: [
                  { action: { contains: q, mode: "insensitive" as const } },
                  { targetType: { contains: q, mode: "insensitive" as const } },
                  { targetId: { contains: q, mode: "insensitive" as const } },
                  { user: { email: { contains: q, mode: "insensitive" as const } } },
                  { user: { name: { contains: q, mode: "insensitive" as const } } },
                ],
              }
            : {}),
        }
      : undefined;

  const logs = await prisma.userActivity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nhật kí hệ thống</h1>
          <p className="text-sm text-slate-500">
            Hiển thị tối đa 200 log gần nhất (lọc theo `q`, `action`, `userId` qua query string).
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Target ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {log.createdAt.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{log.user.name}</div>
                        <div className="text-xs text-slate-500">{log.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.targetType ?? "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {log.targetId ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          File log (JSONL): <span className="font-mono">logs/activity.log</span>
        </div>
      </div>
    </AdminLayout>
  );
}

