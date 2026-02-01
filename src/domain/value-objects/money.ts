/**
 * Value Object: Money
 *
 * Represents a monetary amount in VND.
 * Immutable, framework-agnostic.
 */

export class Money {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency = "VND") {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    this.amount = Math.round(amount);
    this.currency = currency;
    Object.freeze(this);
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error("Cannot add different currencies");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error("Factor cannot be negative");
    }
    return new Money(Math.round(this.amount * factor), this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  format(): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: this.currency,
    }).format(this.amount);
  }

  toJSON(): number {
    return this.amount;
  }

  static fromJSON(amount: number, currency = "VND"): Money {
    return new Money(amount, currency);
  }
}
