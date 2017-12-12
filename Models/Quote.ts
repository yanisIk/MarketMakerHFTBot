import { OrderCondition, OrderSide, OrderTimeEffect, OrderType } from "./Order";

export default class Quote {

    constructor(public readonly marketName: string,
                public rate: number,
                public quantity: number,
                public readonly side: OrderSide,
                public readonly type: OrderType,
                public readonly timeEffect: OrderTimeEffect,
                public isSpam: boolean = false,
                public readonly condition?: OrderCondition,
                public readonly target?: number) {

    }

}
