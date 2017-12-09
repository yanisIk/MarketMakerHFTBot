export default class Order {
    public closedTimestamp: number;
    public quantityFilled: number;

    constructor(public readonly id: string,
                public readonly openedTimestamp: number,
                public readonly marketName: string,
                public readonly rate: number,
                public readonly quantity: number,
                public readonly side: OrderSide,
                public readonly type: OrderType,
                public readonly timeEffect: OrderTimeEffect,
                public status: OrderStatus,
                public readonly condition?: OrderCondition,
                public readonly target?: number,
                ) {

    }

    public fill(quantityFilled: number, closeTimestamp: number) : void {
        this.quantityFilled = quantityFilled;
        if (this.quantityFilled === this.quantity) {
            this.status = OrderStatus.FILLED;
        } else {
            this.status = OrderStatus.PARTIALLY_FILLED;
        }
    }

    public cancel(closedTimestamp: number) : void {
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
