import { EventSourcedAggregate } from "./event-sourced-aggregate";
import { ProjectedStreamConfiguration } from "./event-store";
import { Id } from "./id";
import { Projection } from "./quick/projection";

export interface EventSourcingEvent {
  readonly eventId: Id;
  readonly type: string;
  readonly payload: any;
  revision?: number;
  occurredAt?: Date;
}

export interface Fact<E extends { type: string; payload: any } = EventSourcingEvent> {
  readonly eventId: Id;
  readonly type: E["type"];
  readonly payload: E["payload"];
  revision: number;
  occurredAt: Date;
}

export interface Change<E extends { type: string; payload: any } = EventSourcingEvent> {
  readonly eventId: Id;
  readonly type: E["type"];
  readonly payload: E["payload"];
}

export interface EventSerializer<E extends EventSourcingEvent> {
  serialize(event: E): EventSourcingEvent & { version: number }
  deserialize(serialized: EventSourcingEvent): E
  // serialize<Event extends E>(event: Event): EventSourcingEvent & { type: Event['type'] } & { version: number };
  // deserialize<Type extends E['type']>(serialized: EventSourcingEvent & { version: number, type: Type }): Extract<E, { type: Type }>
}


export interface EventSerializerRegistry<Serializers extends { [type: string]: EventSerializer<EventSourcingEvent> }> {
  serialize<Type extends keyof Serializers>(event: Parameters<Serializers[Type]['serialize']>[0]): ReturnType<Serializers[Type]['serialize']>
  deserialize<Type extends keyof Serializers>(event: Parameters<Serializers[Type]['deserialize']>[0]): EventSourcingEvent & ReturnType<Serializers[Type]['deserialize']>
};

// export interface EventSerializerRegistry2<Serializers extends EventSerializer<EventSourcingEvent>> {
//   serialize<Serializer extends Serializers>(event: Parameters<Serializer['serialize']>[0]): ReturnType<Serializer['serialize']>
//   deserialize<Serializer extends Serializers>(event: Parameters<Serializer['deserialize']>[0]): ReturnType<Serializer['deserialize']>
//   // deserialize<Type extends keyof Serializers>(serialized: ReturnType<Serializers[Type]['serialize']>): Parameters<Serializers[Type]['serialize']>[0]
// };

export type EventSerializerRegistryForProjectedStreamConfiguration<C extends ProjectedStreamConfiguration<any>> = C extends ProjectedStreamConfiguration<infer K> ? K[string][number] : never
// export type EventSerializerRegistryForAggregate2<A extends EventSourcedAggregate> = EventSerializerRegistry<EventSerializer<A['changes'][number]>>
export type EventSerializerRegistryForAggregate<A extends EventSourcedAggregate> = EventSerializerRegistry<{ [E in A['changes'][number]as `${E['type']}`]: EventSerializer<E> }>
export type EventSerializerRegistryForProjection<P extends Projection<any>> = EventSerializerRegistry<{ [E in P['streamConfiguration']['listened'][keyof P['streamConfiguration']['listened']][number]as `${E['type']}`]: EventSerializer<E> }>