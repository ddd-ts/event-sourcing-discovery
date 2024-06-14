import { Constructor } from "@ddd-ts/shape";
import type { Change, EventSourcingEvent, Fact } from "./es-event";

export interface EventSourcedAggregate {
  changes: Change<EventSourcingEvent>[];
  streamRevision: number;
  apply(event: Change<EventSourcingEvent>): void;
  load(event: Fact<EventSourcingEvent>): void;
  acknowledgeChanges(): void;
}

export interface TypedEventSourcedAggregate<B extends Constructor<EventSourcingEvent>, L extends Constructor<EventSourcingEvent>> extends EventSourcedAggregate {
  birth: B[];
  life: L[];
}
