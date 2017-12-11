import Quote from "./Quote";

export default class Order extends Quote {

    public static createFromQuote(quote: Quote, orderId: string): Order {
        return new Order(orderId, Date.now(), quote.marketName,
                         quote.rate, quote.quantity, quote.side,
                         quote.type, quote.timeEffect, quote.isSpam,
                         OrderStatus.OPEN, quote.condition, quote.target);
    }

    public closedTimestamp: number | Date;
    public quantityFilled: number;
    public quantityRemaining: number;

    constructor(public readonly id: string,
                public readonly openedTimestamp: number | Date,
                public readonly marketName: string,
                public readonly rate: number,
                public readonly quantity: number,
                public readonly side: OrderSide,
                public readonly type: OrderType,
                public readonly timeEffect: OrderTimeEffect,
                public readonly isSpam: boolean,
                public status: OrderStatus,
                public readonly condition?: OrderCondition,
                public readonly target?: number,
                ) {
            super(marketName, rate, quantity, side, type, timeEffect, isSpam, condition, target);
            this.quantityRemaining = this.quantity;
    }

    public fill(quantityFilled: number, closeTimestamp: number): void {
        this.quantityFilled = quantityFilled;
        if (this.quantityFilled === this.quantity) {
            this.status = OrderStatus.FILLED;
            this.quantityRemaining = 0;
        } else {
            this.status = OrderStatus.PARTIALLY_FILLED;
            this.quantityRemaining = this.quantity - quantityFilled;
        }
    }

    public cancel(closedTimestamp: number): void {
        this.status = OrderStatus.CANCELED;
        this.closedTimestamp = closedTimestamp;
    }

}

export enum OrderSide {
    BUY,
    SELL,
}

export enum OrderType {
    LIMIT,
    MARKET,
    CONDITIONAL,
}

export enum OrderStatus {
    OPEN,
    PARTIALLY_FILLED,
    FILLED,
    CANCELED,
}

export enum OrderTimeEffect {
    GOOD_UNTIL_CANCELED,
    IMMEDIATE_OR_CANCEL,
    FILL_OR_KILL,
}

export enum OrderCondition {
    GREATER_THAN_OR_EQUAL,
    LESS_THAN_OR_EQUAL,
}
