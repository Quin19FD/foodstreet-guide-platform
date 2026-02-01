/**
 * DTOs (Data Transfer Objects) for Order
 */

export interface OrderItemRequestDTO {
  poiId: string;
  itemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CreateOrderRequestDTO {
  poiId: string;
  items: OrderItemRequestDTO[];
}

export interface OrderResponseDTO {
  id: string;
  userId: string;
  poiId: string;
  poiName: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  pickupCode: string;
  createdAt: string;
  estimatedReadyTime?: string;
}

export interface UpdateOrderStatusRequestDTO {
  status: string;
}
