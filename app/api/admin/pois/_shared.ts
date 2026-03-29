export { requireAdmin } from "../session/_shared";

export function buildPoiDetailInclude() {
  return {
    owner: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    images: {
      orderBy: { id: "asc" as const },
    },
    menuItems: {
      orderBy: { createdAt: "asc" as const },
    },
    translations: {
      orderBy: [{ language: "asc" as const }],
      include: {
        audios: {
          orderBy: { createdAt: "asc" as const },
        },
      },
    },
  };
}
