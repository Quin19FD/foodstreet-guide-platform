/**
 * VNPay Payment Gateway Integration
 *
 * Infrastructure layer implementation for VNPay.
 */

export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  baseUrl: string;
  returnUrl: string;
}

export interface VNPayPaymentRequest {
  amount: number;
  orderId: string;
  orderInfo: string;
  locale?: string;
}

export class VNPayService {
  private readonly config: VNPayConfig;

  constructor(config: VNPayConfig) {
    this.config = config;
  }

  /**
   * Create payment URL for VNPay
   */
  async createPaymentUrl(request: VNPayPaymentRequest): Promise<string> {
    const params = new URLSearchParams({
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.config.tmnCode,
      vnp_Amount: (request.amount * 100).toString(),
      vnp_CurrCode: "VND",
      vnp_TxnRef: request.orderId,
      vnp_OrderInfo: request.orderInfo,
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_Locale: request.locale || "vn",
      vnp_CreateDate: this.getVNPayTime(),
    });

    // Add signature
    const signature = this.sign(params.toString());
    params.append("vnp_SecureHash", signature);

    return `${this.config.baseUrl}?${params.toString()}`;
  }

  /**
   * Verify callback from VNPay
   */
  async verifyCallback(params: URLSearchParams): Promise<boolean> {
    const signature = params.get("vnp_SecureHash");
    if (!signature) return false;

    const paramsCopy = new URLSearchParams(params);
    paramsCopy.delete("vnp_SecureHash");
    paramsCopy.delete("vnp_SecureHashType");

    const expectedSignature = this.sign(paramsCopy.toString());
    return signature === expectedSignature;
  }

  /**
   * Generate signature for VNPay
   */
  private sign(_data: string): string {
    // HMAC SHA512 implementation
    // This is a placeholder - actual implementation uses crypto module
    return "signature_placeholder";
  }

  /**
   * Get VNPay formatted time
   */
  private getVNPayTime(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
}
