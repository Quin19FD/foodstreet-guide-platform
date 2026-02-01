/**
 * Domain Entity: POI (Point of Interest)
 *
 * Represents a food stall/vendor in a district.
 * Framework-agnostic, pure TypeScript.
 */

import type { Location } from "../value-objects/location";
import type { Money } from "../value-objects/money";

export type POICategory = "food" | "drink" | "snack" | "dessert";

export interface POIProps {
  id: string;
  districtId: string;
  name: string;
  slug: string;
  description: string;
  category: POICategory;
  location: Location;
  imageUrl?: string;
  audioUrl?: string;
  audioScript?: string;
  priceRange: {
    min: Money;
    max: Money;
  };
  rating: number;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class POI {
  readonly id: string;
  readonly districtId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly category: POICategory;
  readonly location: Location;
  readonly imageUrl?: string;
  readonly audioUrl?: string;
  readonly audioScript?: string;
  readonly priceRange: {
    min: Money;
    max: Money;
  };
  readonly rating: number;
  readonly isOpen: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: POIProps) {
    this.id = props.id;
    this.districtId = props.districtId;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.category = props.category;
    this.location = props.location;
    this.imageUrl = props.imageUrl;
    this.audioUrl = props.audioUrl;
    this.audioScript = props.audioScript;
    this.priceRange = props.priceRange;
    this.rating = props.rating;
    this.isOpen = props.isOpen;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  hasAudio(): boolean {
    return !!this.audioUrl && !!this.audioScript;
  }
}
