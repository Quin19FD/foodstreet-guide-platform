/**
 * DTOs for Analytics & User Activity
 */

export interface UserActivityDTO {
  id: string;
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: Date;
}

export interface UserActivityRequestDTO {
  action: string;
  targetType?: string;
  targetId?: string;
}

export interface PageViewDTO {
  id: string;
  path: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface POIViewDTO {
  id: string;
  poiId: string;
  userId?: string;
  duration?: number; // in seconds
  createdAt: Date;
}

export interface AnalyticsDTO {
  totalPageViews: number;
  totalPOIViews: number;
  totalUsers: number;
  topPOIs: Array<{
    poiId: string;
    poiName: string;
    viewCount: number;
  }>;
  topPages: Array<{
    path: string;
    viewCount: number;
  }>;
}
