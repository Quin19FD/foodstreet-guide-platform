/**
 * DTOs for Reviews & Ratings
 */

export interface ReviewRequestDTO {
  poiId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponseDTO {
  id: string;
  userId: string;
  poiId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  userData?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface RatingStatsDTO {
  poiId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
