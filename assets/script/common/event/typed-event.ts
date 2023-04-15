export interface Listener<T> {
    (event: T): any;
}

export interface Disposable {
    dispose(): any;
}

export class TypedEvent<T> {
    private listeners: Listener<T>[] = [];
    private listenersOnce: Listener<T>[] = [];

    public on = (listener: Listener<T>): Disposable => {
        this.listeners.push(listener);
        return {
            dispose: () => this.off(listener)
        };
    };

    public once = (listener: Listener<T>): void => {
        this.listenersOnce.push(listener);
    };

    public off = (listener: Listener<T>) => {
        const callbackIndex = this.listeners.indexOf(listener);
        if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
    };

    public emit = (event: T) => {
        this.listeners.forEach(listener => listener(event));

        this.listenersOnce.forEach(listener => listener(event));

        this.listenersOnce = [];
    };

    public reset() {
        this.listeners = []
    }

    public pipe = (te: TypedEvent<T>): Disposable => {
        return this.on(e => te.emit(e));
    };
}