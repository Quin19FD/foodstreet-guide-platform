/**
 * DTOs (Data Transfer Objects) for Payment
 */

export interface CreatePaymentRequestDTO {
  orderId: string;
  provider: "vietqr" | "vnpay" | "momo";
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentResponseDTO {
  id: string;
  orderId: string;
  amount: number;
  provider: string;
  status: string;
  qrCodeUrl?: string;
  paymentUrl?: string;
  expiryTime?: string;
}

export interface PaymentCallbackDTO {
  transactionId: string;
  status: string;
  amount: number;
  signature: string;
  metadata?: Record<string, unknown>;
}
