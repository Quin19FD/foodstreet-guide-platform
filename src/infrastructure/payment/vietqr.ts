/**
 * VietQR Payment Gateway Integration
 *
 * Infrastructure layer implementation for VietQR.
 */

export interface VietQRConfig {
  apiKey: string;
  baseUrl: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface VietQRResponse {
  qrCode: string;
  transactionId: string;
  expiryTime: Date;
}

export class VietQRService {
  private readonly config: VietQRConfig;

  constructor(config: VietQRConfig) {
    this.config = config;
  }

  /**
   * Generate QR code for payment
   */
  async generateQR(amount: number, orderId: string): Promise<VietQRResponse> {
    // VietQR generation logic
    const _qrData = this.buildQRData(amount, orderId);

    const response = await fetch(`${this.config.baseUrl}/qr/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        amount,
        orderId,
        bankCode: this.config.bankCode,
        accountNumber: this.config.accountNumber,
        accountName: this.config.accountName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate VietQR");
    }

    return response.json();
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    const response = await fetch(`${this.config.baseUrl}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === "success";
  }

  /**
   * Build QR data string
   */
  private buildQRData(amount: number, orderId: string): string {
    return `${this.config.bankCode}|${this.config.accountNumber}|${amount}|${orderId}`;
  }
}
