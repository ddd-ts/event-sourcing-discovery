import type { Change, EventSourcingEvent, Fact } from "./es-event";

export interface EventSourcedAggregate {
  changes: Change<EventSourcingEvent>[];
  streamRevision: number;
  apply(event: Change<EventSourcingEvent>): void;
  load(event: Fact<EventSourcingEvent>): void;
  acknowledgeChanges(): void;
}
