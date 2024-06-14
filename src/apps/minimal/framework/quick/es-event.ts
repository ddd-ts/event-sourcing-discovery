import { DictShorthand, Shape, Optional, Constructor, DefinitionOf } from "@ddd-ts/shape";
import { Id } from "./id";

export class EventId extends Id("EventId") { }

export const EsEvent = <const T extends string, const S extends DictShorthand>(type: T, shape: S) => Shape({
  type,
  payload: shape,
  eventId: EventId,
  revision: Optional(Number),
  occurredAt: Optional(Date),
}, class A {
  isFact() {
    return Boolean((this as any).revision);
  }

  static type = type;

  static new<TH extends Constructor<A>>(this: TH, payload: DefinitionOf<S>['$inline']): InstanceType<TH> {
    return new this({ id: EventId.generate(), type, payload }) as InstanceType<TH>
  }
})