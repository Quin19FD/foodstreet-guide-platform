/**
 * Domain Entity: POI (Point of Interest)
 *
 * Represents a food stall/vendor in a district.
 * Framework-agnostic, pure TypeScript.
 */

import type { Location } from "../value-objects/location";

export type POICategory = "FOOD" | "DRINK" | "SNACK" | "DESSERT" | string;
export type POIStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface POIProps {
  id: string;
  ownerId: string;
  name: string;
  slug?: string;
  category?: POICategory;
  location?: Location;
  priceMin?: number;
  priceMax?: number;
  rating: number;
  status: POIStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  submitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class POI {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly slug?: string;
  readonly category?: POICategory;
  readonly location?: Location;
  readonly priceMin?: number;
  readonly priceMax?: number;
  readonly rating: number;
  readonly status: POIStatus;
  readonly rejectionReason?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly submitCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: POIProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.slug = props.slug;
    this.category = props.category;
    this.location = props.location;
    this.priceMin = props.priceMin;
    this.priceMax = props.priceMax;
    this.rating = props.rating;
    this.status = props.status;
    this.rejectionReason = props.rejectionReason;
    this.approvedBy = props.approvedBy;
    this.approvedAt = props.approvedAt;
    this.submitCount = props.submitCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getPriceRange(): { min: number; max: number } | undefined {
    if (this.priceMin !== undefined && this.priceMax !== undefined) {
      return { min: this.priceMin, max: this.priceMax };
    }
    return undefined;
  }

  getCoordinates(): Location | undefined {
    return this.location;
  }

  getCategory(): string {
    return this.category || "FOOD";
  }

  isApproved(): boolean {
    return this.status === "APPROVED";
  }

  isPending(): boolean {
    return this.status === "PENDING";
  }

  isRejected(): boolean {
    return this.status === "REJECTED";
  }
}
