/**
 * Domain Entity: Order
 *
 * Represents a customer order.
 * Framework-agnostic, pure TypeScript.
 */

import type { Money } from "../value-objects/money";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderItemProps {
  poiId: string;
  poiName: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  notes?: string;
}

export interface OrderProps {
  id: string;
  userId: string;
  poiId: string;
  items: OrderItemProps[];
  totalAmount: Money;
  status: OrderStatus;
  paymentMethod: "vietqr" | "vnpay" | "momo" | "cash";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  pickupCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  readonly id: string;
  readonly userId: string;
  readonly poiId: string;
  readonly items: OrderItemProps[];
  readonly totalAmount: Money;
  status: OrderStatus;
  readonly paymentMethod: "vietqr" | "vnpay" | "momo" | "cash";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  readonly pickupCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.poiId = props.poiId;
    this.items = props.items;
    this.totalAmount = props.totalAmount;
    this.status = props.status;
    this.paymentMethod = props.paymentMethod;
    this.paymentStatus = props.paymentStatus;
    this.pickupCode = props.pickupCode;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isPaid(): boolean {
    return this.paymentStatus === "paid";
  }

  canBeCancelled(): boolean {
    return ["pending", "confirmed"].includes(this.status);
  }
}
