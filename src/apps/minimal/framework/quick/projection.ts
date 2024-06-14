import { Constructor } from "@ddd-ts/shape";
import { EventSourcingEvent } from "../es-event";
import { EventSourcedAggregate, TypedEventSourcedAggregate } from "../event-sourced-aggregate";
import { ProjectedStreamConfiguration } from "../event-store";

// This does not work but it should restrict events to events emitted by aggregate
type AggregateWithEmittedEvent<A extends TypedEventSourcedAggregate<any, any>> = [A, A['birth'][number] | A['life'][number]]

type Parse<T extends [Constructor<EventSourcedAggregate> & { type: string }, Constructor<EventSourcingEvent> & { type: string }][]> = {
  [I in keyof T as `${T[I & number][0]['type']}`]: InstanceType<T[I & number][1]>[]
}

export const Projection = <
  const T extends string,
  const ProjectsOn extends [Constructor<EventSourcedAggregate> & { type: string }, Constructor<EventSourcingEvent> & { type: string }][]>(
    type: T,
    { projectsOn }: { projectsOn: ProjectsOn }
  ) => {
  type HandledEvents = ProjectsOn[number][1]

  const config = projectsOn.reduce<{ [key: string]: (Constructor<EventSourcingEvent> & { type: string })[] }>((acc, [AGGREGATE, EVENT]) => {
    const aggregate = acc[AGGREGATE.type] ?? []
    aggregate.push(EVENT)
    acc[AGGREGATE.type] = aggregate;
    return acc;
  }, {}) as Parse<ProjectsOn>

  const streamConfiguration = new ProjectedStreamConfiguration(config)

  return class A implements Projection<Parse<ProjectsOn>> {
    type = type;
    streamConfiguration = streamConfiguration

    private getHandlerNameFromEvent(event: EventSourcingEvent) {
      return `on${event.type}`
    }

    async handle(event: InstanceType<HandledEvents>) {
      await (this as any)[this.getHandlerNameFromEvent(event)](event);
    }
  }
}


export interface Projection<On extends { [key: string]: { type: string }[] }> {
  type: string;
  streamConfiguration: ProjectedStreamConfiguration<On>
  handle(event: EventSourcingEvent): Promise<void>
}