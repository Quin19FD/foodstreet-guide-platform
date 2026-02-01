/**
 * Value Object: QRCode
 *
 * Represents a QR code for scanning.
 * Immutable, framework-agnostic.
 */

export interface QRCodeProps {
  data: string;
  type: "district" | "poi" | "order" | "payment";
}

export class QRCode {
  readonly data: string;
  readonly type: QRCodeProps["type"];

  constructor(props: QRCodeProps) {
    if (!props.data || props.data.trim().length === 0) {
      throw new Error("QR code data cannot be empty");
    }
    this.data = props.data.trim();
    this.type = props.type;
    Object.freeze(this);
  }

  /**
   * Generate URL for QR code image
   */
  toImageURL(size = 300): string {
    const encoded = encodeURIComponent(this.data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
  }

  /**
   * Validate QR code format
   */
  isValid(): boolean {
    return this.data.length > 0;
  }

  toString(): string {
    return `${this.type}:${this.data}`;
  }

  /**
   * Parse QR code from string
   */
  static fromString(value: string): QRCode | null {
    const match = value.match(/^(district|poi|order|payment):(.+)$/);
    if (!match) return null;

    return new QRCode({
      data: match[2],
      type: match[1] as QRCodeProps["type"],
    });
  }
}
