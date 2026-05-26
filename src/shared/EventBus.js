class EventBusImpl {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return this;
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
    return this;
  }
}

export const EventBus = new EventBusImpl();
