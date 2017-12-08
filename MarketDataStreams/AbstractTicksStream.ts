import { EventEmitter } from "events";

/**
 * Emits tick on subscribed markets
 */
export default abstract class AbstractTicksStream<ExchangeAdapter> extends EventEmitter {

    constructor(private exchangeAdapter: ExchangeAdapter) {
        super();
    }

    /**
     * Subscribe to ticks and emit them
     * Implementation is dependent on the exchange adapter
     */
    private abstract subscribe(marketName: string): void;

    /**
     * Stops watching ticks
     * Implementation is dependent on the exchange adapter
     */
    private abstract unsubscribe(): void;
}
