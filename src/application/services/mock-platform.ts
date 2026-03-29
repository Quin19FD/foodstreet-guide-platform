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
  imageUrl?: string;
}

// Using placehold.co for reliable placeholder images
const _getImageUrl = (id: string, type: "food" | "facility" | "tour") => {
  const colors = ["FF6B6B", "4ECDC4", "45B7D1", "FFA07A", "98D8C8", "F7DC6F", "FFA07A", "6C5CE7"];
  const color = colors[id.charCodeAt(1) % colors.length];
  const text = type === "food" ? "Food" : type === "facility" ? "WC" : "Tour";
  return `https://placehold.co/600x400/${color}/FFFFFF?text=${encodeURIComponent(text)}+${id}`;
};

const districts: DistrictSummary[] = [
  {
    id: "d1",
    name: "Phố Ẩm Thực Trung Tâm",
    slug: "pho-am-thuc-trung-tam",
    description: "Khu phố ẩm thực trung tâm với nhiều gian hàng truyền thống.",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  },
  {
    id: "d2",
    name: "Chợ Đêm Bờ Sông",
    slug: "cho-dem-bo-song",
    description: "Không gian chợ đêm với đồ ăn đường phố và tiện ích hỗ trợ du khách.",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  },
];

const pois: POISummary[] = [
  {
    id: "p1",
    districtId: "d1",
    name: "Bún Bò Cô Lan",
    type: "FOOD_STALL",
    description: "Bún bò Huế với nước dùng ninh lâu 12 giờ, thịt bò tươi và rau thơm đặc sản.",
    latitude: 10.7755,
    longitude: 106.7009,
    displayRadius: 120,
    imageUrl: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80",
  },
  {
    id: "p2",
    districtId: "d1",
    name: "Quầy Nước Mía Chú Bảy",
    type: "FOOD_STALL",
    description: "Nước mía tươi mát lạnh, ép tại chỗ từ mía Trà Vinh thượng hạng.",
    latitude: 10.7759,
    longitude: 106.7014,
    displayRadius: 120,
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
  },
  {
    id: "p3",
    districtId: "d2",
    name: "Gánh Xiên Mí",
    type: "FOOD_STALL",
    description: "Xiên mí nướng thơm lừng, chấm nước mắm đậm đà, món ăn đường phố đặc sắc.",
    latitude: 10.7764,
    longitude: 106.7021,
    displayRadius: 80,
    imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
  },
  {
    id: "p4",
    districtId: "d1",
    name: "Bánh Mì Huỳnh Hoa",
    type: "FOOD_STALL",
    description:
      "Bánh mì thịt nguội, pate, bơ với vỏ bánh giòn tan, được mệnh danh là bánh mì ngon nhất Sài Gòn.",
    latitude: 10.776,
    longitude: 106.7018,
    displayRadius: 100,
    imageUrl: "https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&q=80",
  },
  {
    id: "p5",
    districtId: "d1",
    name: "Phở Bò Đakao",
    type: "FOOD_STALL",
    description: "Phở bò tái nạm nóng hổi, nước dùng trong veo, thưởng thức cùng quẩy và chanh ớt.",
    latitude: 10.777,
    longitude: 106.7005,
    displayRadius: 100,
    imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80",
  },
  {
    id: "p6",
    districtId: "d2",
    name: "Cơm Tấm Bạch Mai",
    type: "FOOD_STALL",
    description: "Cơm tấm sườn bì chả, mỡ hành, đầy topping ăn kèm đồ chua và canh khổ qua.",
    latitude: 10.7768,
    longitude: 106.7025,
    displayRadius: 100,
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80",
  },
  {
    id: "p7",
    districtId: "d1",
    name: "Gỏi Cuốn Tôm Thịt",
    type: "FOOD_STALL",
    description: "Gỏi cuốn tôm thịt tươi cuốn bánh tráng, chấm nước mắm me mùi mặn đậm đà.",
    latitude: 10.7762,
    longitude: 106.7012,
    displayRadius: 90,
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80",
  },
  {
    id: "p8",
    districtId: "d2",
    name: "Chả Giò Trứng Vịt",
    type: "FOOD_STALL",
    description: "Chả giò trứng vịt da giòn, ăn kèm xôi mango và bún bò.",
    latitude: 10.7772,
    longitude: 106.7018,
    displayRadius: 90,
    imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80",
  },
  {
    id: "p9",
    districtId: "d1",
    name: "Bún Riêu Cua Bể",
    type: "FOOD_STALL",
    description: "Bún riêu cua bể tươi, cua đồng, nước dùng chua thanh mát.",
    latitude: 10.7758,
    longitude: 106.7022,
    displayRadius: 100,
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
  },
  {
    id: "p10",
    districtId: "d2",
    name: "Bánh Tráng Trộn",
    type: "FOOD_STALL",
    description: "Bánh tráng trộn thậpẩm, nhiều loại, tùy chọn thịt nướng hoặc chay.",
    latitude: 10.7775,
    longitude: 106.7028,
    displayRadius: 110,
    imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80",
  },
  {
    id: "p11",
    districtId: "d1",
    name: "Nem Chua Rán",
    type: "FOOD_STALL",
    description: "Nem chua rán giòn tan, ăn kèm cơm trắng hoặc bún.",
    latitude: 10.7765,
    longitude: 106.7008,
    displayRadius: 80,
    imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80",
  },
  {
    id: "p12",
    districtId: "d2",
    name: "WC Công Cộng",
    type: "SUPPORTING_FACILITY",
    description: "WC công cộng sạch sẽ, miễn phí, phục vụ du khách.",
    latitude: 10.7764,
    longitude: 106.7021,
    displayRadius: 80,
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
  },
  {
    id: "p13",
    districtId: "d2",
    name: "Bãi Gửi Xe Miễn Phí",
    type: "SUPPORTING_FACILITY",
    description: "Bãi gửi xe miễn phí, có bảo vệ 24/7.",
    latitude: 10.7778,
    longitude: 106.7015,
    displayRadius: 100,
    imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
  },
];

const tours: TourSummary[] = [
  {
    id: "t1",
    name: "Tour Món Việt Cơ Bản",
    description: "Khám phá 4 điểm món Việt nổi bật cho người mới bắt đầu tham quan.",
    durationMinutes: 90,
    poiIds: ["p1", "p4", "p7", "p9"],
  },
  {
    id: "t2",
    name: "Food Tour Chợ Đêm",
    description: "Trải nghiệm không khí chợ đêm sôi động với 5 điểm đến đặc sắc.",
    durationMinutes: 120,
    poiIds: ["p3", "p6", "p8", "p10"],
  },
  {
    id: "t3",
    name: "Tour Ẩm Thực Huyền Thoại",
    description: "Khám phá các món ăn truyền thống hiếm có tại Sài Gòn.",
    durationMinutes: 150,
    poiIds: ["p2", "p5", "p9", "p11"],
  },
];

const audioGuides: AudioGuideSummary[] = [
  {
    id: "a1",
    poiId: "p1",
    language: "vi",
    scriptText:
      "Chào mừng bạn đến với Bún Bò Cô Lan! Đây là một trong những quán bún bò lâu đời nhất tại khu phố ẩm thực trung tâm. Nước dùng được ninh liên tục trong 12 tiếng với xương ống bò, tạo nên vị ngọt đậm đà và thơm đặc trưng.",
    audioUrl: "/audio/p1-vi.mp3",
  },
  {
    id: "a2",
    poiId: "p1",
    language: "en",
    scriptText:
      "Welcome to Co Lan Bun Bo! This is one of the oldest bun bo stalls in the central food street district. The broth is simmered continuously for 12 hours with beef bones, creating a rich sweet flavor and unique aroma.",
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
    value: "Co Lan Bun Bo",
  },
  {
    id: "tr2",
    entityType: "POI",
    entityId: "p4",
    language: "en",
    field: "name",
    value: "Huynh Hoa Banh Mi",
  },
  {
    id: "tr3",
    entityType: "POI",
    entityId: "p5",
    language: "en",
    field: "name",
    value: "Dakao Pho Bo",
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
