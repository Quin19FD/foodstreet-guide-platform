/**
 * Admin Dashboard Page
 *
 * Main dashboard for admin users.
 */

import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Bell, CircleDollarSign, Headphones, MapPin, Search, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const allPOIs = mockPlatformService.poi.listAll();
  const allTours = mockPlatformService.tour.list();
  const allDistricts = mockPlatformService.districts.list();
  const allTranslations = mockPlatformService.translation.list();
  const allAudioGuides = allPOIs.flatMap((poi) => mockPlatformService.audioGuide.listByPOI(poi.id));

  const totalPOIs = allPOIs.length;
  const activeTours = allTours.filter((tour) => tour.poiIds.length > 0).length;
  const totalAudioGuides = allAudioGuides.length;
  const activeVisitors = 0;

  const densityByDistrict = allDistricts.map((district) => {
    const poiCount = allPOIs.filter((poi) => poi.districtId === district.id).length;
    return {
      districtName: district.name,
      poiCount,
    };
  });

  const maxDensity = Math.max(...densityByDistrict.map((item) => item.poiCount), 1);

  const recentPOIActivities = allPOIs.slice(0, 3).map((poi, index) => ({
    id: poi.id,
    name: poi.name,
    category: poi.type === "FOOD_STALL" ? "Food Stall" : "Supporting Facility",
    status: "Published",
    lastUpdated: index === 0 ? "2 hours ago" : index === 1 ? "5 hours ago" : "Yesterday",
  }));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search POIs, tours or media..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none ring-orange-500 transition focus:ring-2"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-600">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="TOTAL POIS"
                value={String(totalPOIs)}
                hint={`${allDistricts.length} districts`}
                icon={<MapPin className="h-4 w-4 text-orange-500" />}
              />
              <StatCard
                title="ACTIVE TOURS"
                value={String(activeTours)}
                hint={`${allTours.length} tours total`}
                icon={<CircleDollarSign className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                title="AUDIO GUIDES"
                value={String(totalAudioGuides)}
                hint={`${allTranslations.length} translations`}
                icon={<Headphones className="h-4 w-4 text-violet-500" />}
              />
              <StatCard
                title="ACTIVE VISITORS"
                value={String(activeVisitors)}
                hint="Live GPS sessions"
                icon={<Users className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            <section className="rounded-2xl border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick Access</h2>
              <div className="flex flex-wrap gap-2">
                <ActionLink href="/admin/pois" primary>
                  Create New POI
                </ActionLink>
                <ActionLink href="/admin/tours">Create New Tour</ActionLink>
                <ActionLink href="/admin/media">Media Upload</ActionLink>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-700">Recent POI Activities</h2>
                <Link
                  href="/admin/pois"
                  className="text-xs font-medium text-orange-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Point of Interest</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPOIActivities.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                        <td className="px-4 py-3 text-slate-600">{row.category}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{row.lastUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">POI Density Map</h3>
                <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                  LIVE
                </span>
              </div>
              <div className="relative h-44 overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_center,_#e2e8f0_1px,_transparent_1px)] [background-size:18px_18px]">
                <div className="absolute left-[35%] top-[28%] h-5 w-5 rounded-full bg-orange-400/80 ring-4 ring-orange-200" />
                <div className="absolute left-[58%] top-[46%] h-6 w-6 rounded-full bg-orange-500/80 ring-4 ring-orange-200" />
                <div className="absolute left-[45%] top-[65%] h-4 w-4 rounded-full bg-orange-300/80 ring-4 ring-orange-100" />
              </div>
              <div className="mt-4 space-y-3">
                {densityByDistrict.map((item) => (
                  <div key={item.districtName}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{item.districtName}</span>
                      <span>{item.poiCount} POIs</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-orange-400"
                        style={{ width: `${(item.poiCount / maxDensity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-orange-500 p-4 text-white">
              <h3 className="text-sm font-semibold">System Status</h3>
              <p className="mt-2 text-xs text-orange-100">
                Gateway và các service mock đang hoạt động ổn định. Dữ liệu đang đồng bộ theo cấu
                trúc dự án hiện tại.
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-orange-100">Uptime</span>
                <span className="font-semibold">99.98%</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
          {icon}
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Live
        </span>
      </div>
      <p className="text-[11px] font-semibold tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function ActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        primary
          ? "bg-orange-500 text-white hover:bg-orange-600"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}
