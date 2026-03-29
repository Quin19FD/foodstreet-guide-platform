export { requireAdmin } from "../session/_shared";

export function buildTourInclude() {
  return {
    tourPois: {
      orderBy: [{ stopOrder: "asc" as const }],
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            category: true,
            latitude: true,
            longitude: true,
            status: true,
            isActive: true,
          },
        },
      },
    },
  };
}

export function toTourResponse(tour: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tourPois: Array<{
    id: string;
    poiId: string;
    stopOrder: number;
    poi: {
      id: string;
      name: string;
      category: string | null;
      latitude: number | null;
      longitude: number | null;
      status: string;
      isActive: boolean;
    };
  }>;
}) {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    imageUrl: tour.imageUrl,
    durationMinutes: tour.durationMinutes,
    isActive: tour.isActive,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
    poiIds: tour.tourPois.map((item) => item.poiId),
    stops: tour.tourPois.map((item) => ({
      id: item.id,
      poiId: item.poiId,
      stopOrder: item.stopOrder,
      poi: item.poi,
    })),
  };
}
