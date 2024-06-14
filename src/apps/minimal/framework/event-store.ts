import type { Change, EventSourcingEvent } from "./es-event";
import { Id } from "./id";

export class AggregateStreamConfiguration {
  constructor(
    public readonly aggregateType: string,
    public readonly aggregateId: Id,
  ) { }
}

export class ProjectedStreamConfiguration<Listened extends { [key: string]: { type: string }[] }> {
  constructor(public readonly listened: Listened) { }

  listensForAggregateType(aggregateType: string) {
    return !!(aggregateType in this.listened);
  }

  listensForEvent(aggregateType: string, eventType: string): boolean {
    const listenedForAggregateType = this.listened[aggregateType]
    if (!listenedForAggregateType) {
      return false;
    }
    return listenedForAggregateType.map(e => e.type).includes(eventType);
  }

  getHash(): string {
    return JSON.stringify(Array.from(Object.entries(this.listened)));
  }
}

export type StreamReader = AsyncIterable<EventSourcingEvent>;
export type StreamFollower<E extends EventSourcingEvent> = AsyncIterable<E> & {
  close: () => void;
};

export interface AggregateStreamStore {
  /**
   * Appends an event to the stream.
   * @param stream on which to append the event
   * @param changes to append
   * @param expectedRevision of the appended event, used to check if the stream has been modified since the last read
   */
  appendToAggregateStream(
    stream: AggregateStreamConfiguration,
    changes: Change[],
    expectedRevision: number,
  ): Promise<void>;
  readAggregateStream(stream: AggregateStreamConfiguration, from: number): StreamReader;
}

export interface ProjectedStreamReader {
  readProjectedStream(stream: ProjectedStreamConfiguration<any>, from: number): StreamReader;
  followProjectedStream<C extends ProjectedStreamConfiguration<any>>(stream: C, from: number): StreamFollower<C['listened'][string][number]>;
}
