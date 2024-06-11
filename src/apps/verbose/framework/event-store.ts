import type { Change, EventSourcingEvent } from "./es-event";

export class AggregateStreamConfiguration {
  constructor(
    public readonly aggregateType: string,
    public readonly aggregateId: string,
  ) {}
}

export class ProjectedStreamConfiguration {
  listened = new Map<string, string[]>();

  withEvent(aggregateType: string, eventType: string): ProjectedStreamConfiguration {
    const listenedForAggregateType = this.listened.get(aggregateType) || [];
    listenedForAggregateType.push(eventType);
    this.listened.set(aggregateType, listenedForAggregateType);
    return this;
  }

  listensForAggregateType(aggregateType: string): boolean {
    return this.listened.has(aggregateType);
  }

  listensForEvent(aggregateType: string, eventType: string): boolean {
    const listenedForAggregateType = this.listened.get(aggregateType);
    if (!listenedForAggregateType) {
      return false;
    }
    return listenedForAggregateType.includes(eventType);
  }

  getHash(): string {
    return JSON.stringify(Array.from(this.listened.entries()));
  }
}

export type StreamReader = AsyncIterable<EventSourcingEvent>;
export type StreamFollower = AsyncIterable<EventSourcingEvent> & {
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
  readProjectedStream(stream: ProjectedStreamConfiguration, from: number): StreamReader;
  followProjectedStream(stream: ProjectedStreamConfiguration, from: number): StreamFollower;
}
