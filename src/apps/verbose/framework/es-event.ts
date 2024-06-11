export interface EventSourcingEvent {
  eventId: string;
  type: string;
  payload: any;
  revision?: number;
  occurredAt?: Date;
}

export interface Fact<E extends { type: string; payload: any } = EventSourcingEvent> {
  eventId: string;
  type: E["type"];
  payload: E["payload"];
  revision: number;
  occurredAt: Date;
}

export interface Change<E extends { type: string; payload: any } = EventSourcingEvent> {
  eventId: string;
  type: E["type"];
  payload: E["payload"];
}
