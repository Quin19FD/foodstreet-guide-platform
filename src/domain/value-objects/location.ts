/**
 * Value Object: Location
 *
 * Represents a GPS coordinate.
 * Immutable, framework-agnostic.
 */

export interface LocationProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export class Location {
  readonly latitude: number;
  readonly longitude: number;
  readonly address?: string;

  constructor(props: LocationProps) {
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error("Invalid latitude");
    }
    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error("Invalid longitude");
    }

    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.address = props.address;
    Object.freeze(this);
  }

  /**
   * Calculate distance to another location using Haversine formula
   * @returns distance in meters
   */
  distanceTo(other: Location): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (this.latitude * Math.PI) / 180;
    const φ2 = (other.latitude * Math.PI) / 180;
    const Δφ = ((other.latitude - this.latitude) * Math.PI) / 180;
    const Δλ = (other.longitude - this.longitude * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if within a given radius
   * @param other - The other location
   * @param radiusMeters - Radius in meters
   */
  isWithinRadius(other: Location, radiusMeters: number): boolean {
    return this.distanceTo(other) <= radiusMeters;
  }

  toCoordinate(): [number, number] {
    return [this.longitude, this.latitude];
  }

  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }
}
