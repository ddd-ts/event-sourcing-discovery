import { Constructor, DictShorthand, Shape } from "@ddd-ts/shape";
import { EventSourcingEvent, Change, Fact } from "../es-event";

export const EsAggregate = <
  const T extends string,
  S extends DictShorthand,
  EventRegistry extends {
    birth: Constructor<EventSourcingEvent>[];
    life: Constructor<EventSourcingEvent>[];
  }>(type: T, shape: S, events: EventRegistry) => {
  type BirthEvent = InstanceType<EventRegistry['birth'][number]>
  type LifeEvent = InstanceType<EventRegistry['life'][number]>
  type AnyEvent = BirthEvent | LifeEvent

  return Shape(shape, class A {
    static type = type;

    streamRevision = -1;
    changes: Array<Change<AnyEvent>> = [];

    static birth = events.birth;
    static life = events.life;

    // Maybe we prefer decorating methods??
    static getMethodNameFromEventType(type: string) {
      return `on${type}`;
    }

    static {
      for (const key of Object.keys(events.birth)) {
        if (!(typeof (this as any)[key] === "function")) {
          throw new Error(`Event sourced aggregate does not implement static birth method ${this.getMethodNameFromEventType(key)}`);
        }
      }
      for (const key of Object.keys(events.life)) {
        if (!(typeof (this.prototype as any)[key] === "function")) {
          throw new Error(`Event sourced aggregate does not implement life method ${this.getMethodNameFromEventType(key)}`);
        }
      }
    }

    static callBirthEventHandler<TH extends Constructor<A>>(this: TH, event: EventSourcingEvent): InstanceType<TH> {
      return (this as any)[A.getMethodNameFromEventType(event.type)](event)
    }

    static instantiate<TH extends Constructor<A>>(this: TH, fact: Fact<BirthEvent>) {
      const instance = (this as any).callBirthEventHandler(fact)
      if (fact.revision !== 0) {
        throw new Error(`Cannot instantiate an aggregate from a fact with revision ${fact.revision}`);
      }
      instance.streamRevision = fact.revision;
      return instance;
    }

    static new<TH extends Constructor<A>>(this: TH, change: Change<BirthEvent>) {
      const instance = (this as any).callBirthEventHandler(change);
      instance.changes.push(change);
      return instance;
    }

    private play(event: Change<AnyEvent> | Fact<AnyEvent>): void {
      (this as any)[A.getMethodNameFromEventType(event.type)](event)
    }

    apply(change: LifeEvent) {
      this.play(change);
      this.changes.push(change);
    }


    load(event: Fact<LifeEvent>) {
      if (event.revision !== this.streamRevision + 1) {
        throw new Error(
          `Cannot load change with revision ${event.revision} when current revision is ${this.streamRevision}`,
        );
      }
      this.play(event);
      this.streamRevision = event.revision;
    }

    acknowledgeChanges() {
      this.streamRevision = this.streamRevision + this.changes.length;
      this.changes = [];
    }
  });
}