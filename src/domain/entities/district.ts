/**
 * Domain Entity: District
 *
 * Represents a district/area containing POIs.
 * Framework-agnostic, pure TypeScript.
 */

import type { Location } from "../value-objects/location";

export interface DistrictProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: Location;
  qrCode: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class District {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly location: Location;
  readonly qrCode: string;
  readonly imageUrl?: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DistrictProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.location = props.location;
    this.qrCode = props.qrCode;
    this.imageUrl = props.imageUrl;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
