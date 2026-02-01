/**
 * Domain Entity: Payment
 *
 * Represents a payment transaction.
 * Framework-agnostic, pure TypeScript.
 */

import type { Money } from "../value-objects/money";

export type PaymentProvider = "vietqr" | "vnpay" | "momo";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded";

export interface PaymentProps {
  id: string;
  orderId: string;
  amount: Money;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId?: string;
  qrCodeUrl?: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  readonly id: string;
  readonly orderId: string;
  readonly amount: Money;
  readonly provider: PaymentProvider;
  status: PaymentStatus;
  readonly transactionId?: string;
  readonly qrCodeUrl?: string;
  readonly returnUrl: string;
  readonly cancelUrl: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.amount = props.amount;
    this.provider = props.provider;
    this.status = props.status;
    this.transactionId = props.transactionId;
    this.qrCodeUrl = props.qrCodeUrl;
    this.returnUrl = props.returnUrl;
    this.cancelUrl = props.cancelUrl;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isCompleted(): boolean {
    return this.status === "success";
  }

  isPending(): boolean {
    return ["pending", "processing"].includes(this.status);
  }
}
