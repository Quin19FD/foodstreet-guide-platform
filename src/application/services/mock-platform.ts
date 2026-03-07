import type {
  AudioGuideSummary,
  AuthSession,
  LocationRequest,
  POISummary,
  TourSummary,
  TranslationItem,
} from "@/application/contracts/microservices";

export interface DistrictSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const districts: DistrictSummary[] = [
  {
    id: "d1",
    name: "Phố Ẩm Thực Trung Tâm",
    slug: "pho-am-thuc-trung-tam",
    description: "Khu phố ẩm thực trung tâm với nhiều gian hàng truyền thống.",
  },
  {
    id: "d2",
    name: "Chợ Đêm Bờ Sông",
    slug: "cho-dem-bo-song",
    description: "Không gian chợ đêm với đồ ăn đường phố và tiện ích hỗ trợ du khách.",
  },
];

const pois: POISummary[] = [
  {
    id: "p1",
    districtId: "d1",
    name: "Bún Bò Cô Lan",
    type: "FOOD_STALL",
    description: "Bún bò Huế với nước dùng ninh lâu.",
    latitude: 10.7755,
    longitude: 106.7009,
    displayRadius: 120,
    imageUrl: "/placeholder-poi-1.jpg",
  },
  {
    id: "p2",
    districtId: "d1",
    name: "Quầy Nước Mía Chú Bảy",
    type: "FOOD_STALL",
    description: "Nước mía tươi và các món giải khát địa phương.",
    latitude: 10.7759,
    longitude: 106.7014,
    displayRadius: 120,
    imageUrl: "/placeholder-poi-2.jpg",
  },
  {
    id: "p3",
    districtId: "d2",
    name: "WC Công Cộng",
    type: "SUPPORTING_FACILITY",
    description: "Điểm tiện ích phục vụ du khách.",
    latitude: 10.7764,
    longitude: 106.7021,
    displayRadius: 80,
  },
];

const tours: TourSummary[] = [
  {
    id: "t1",
    name: "Tour Món Việt Cơ Bản",
    description: "Khám phá 4 điểm món Việt nổi bật cho người mới.",
    durationMinutes: 90,
    poiIds: ["p1", "p2"],
  },
];

const audioGuides: AudioGuideSummary[] = [
  {
    id: "a1",
    poiId: "p1",
    language: "vi",
    scriptText: "Đây là gian hàng bún bò với công thức gia truyền.",
    audioUrl: "/audio/p1-vi.mp3",
  },
  {
    id: "a2",
    poiId: "p1",
    language: "en",
    scriptText: "This is a traditional Vietnamese noodle stall.",
    audioUrl: "/audio/p1-en.mp3",
  },
];

const translations: TranslationItem[] = [
  {
    id: "tr1",
    entityType: "POI",
    entityId: "p1",
    language: "en",
    field: "name",
    value: "Co Lan Bun Bo Stall",
  },
];

export const mockPlatformService = {
  auth: {
    login(username: string): AuthSession {
      return {
        userId: "admin-1",
        username,
        role: "admin",
        accessToken: "mock-access-token",
      };
    },
  },
  districts: {
    list(): DistrictSummary[] {
      return districts;
    },
  },
  poi: {
    listByDistrict(districtId: string): POISummary[] {
      return pois.filter((item) => item.districtId === districtId);
    },
    listAll(): POISummary[] {
      return pois;
    },
  },
  tour: {
    list(): TourSummary[] {
      return tours;
    },
  },
  audioGuide: {
    listByPOI(poiId: string): AudioGuideSummary[] {
      return audioGuides.filter((item) => item.poiId === poiId);
    },
  },
  translation: {
    list(): TranslationItem[] {
      return translations;
    },
  },
  location: {
    nearestPOI(request: LocationRequest): POISummary | null {
      const source = request.districtId
        ? pois.filter((item) => item.districtId === request.districtId)
        : pois;
      if (source.length === 0) return null;

      const sorted = source
        .map((item) => ({
          item,
          score:
            (item.latitude - request.latitude) * (item.latitude - request.latitude) +
            (item.longitude - request.longitude) * (item.longitude - request.longitude),
        }))
        .sort((a, b) => a.score - b.score);

      return sorted[0]?.item ?? null;
    },
  },
};
