import type { Change } from "../../es-event";
import {
  AggregateStreamStore,
  ProjectedStreamReader,
  AggregateStreamConfiguration,
  ProjectedStreamConfiguration,
  StreamFollower,
} from "../../event-store";
import { AggregateStream, ProjectedStream } from "./stream";

export class InMemoryEventStore implements AggregateStreamStore, ProjectedStreamReader {
  aggregateStreams = new Map<string, AggregateStream>();
  projectedStreams = new Map<string, ProjectedStream>();
  newStreamSubscribers = new Set<(stream: AggregateStream) => void>();

  async appendToAggregateStream(
    streamConfiguration: AggregateStreamConfiguration,
    changes: Change[],
    expectedRevision: number,
  ): Promise<void> {
    const streamId = `${streamConfiguration.aggregateType}-${streamConfiguration.aggregateId}`;

    let stream = this.aggregateStreams.get(streamId);

    if (!stream) {
      stream = new AggregateStream(streamConfiguration);
      this.aggregateStreams.set(streamId, stream);
      for (const subscriber of this.newStreamSubscribers) {
        subscriber(stream);
      }
    }

    const revision = stream.facts.length - 1;

    if (revision !== expectedRevision) {
      throw new Error(
        `Cannot append event to stream ${streamId} with revision ${expectedRevision} when current revision is ${revision}`,
      );
    }

    for (const [i, change] of Object.entries(changes)) {
      stream.append({
        eventId: change.eventId,
        payload: change.payload,
        type: change.type,
        occurredAt: new Date(),
        revision: revision + Number(i) + 1,
      });
    }

    this.aggregateStreams.set(streamId, stream);
  }

  async *readAggregateStream(streamConfiguration: AggregateStreamConfiguration, from: number) {
    const streamId = `${streamConfiguration.aggregateType}-${streamConfiguration.aggregateId}`;
    const stream = this.aggregateStreams.get(streamId);

    if (!stream) {
      return;
    }

    yield* stream.read(from);
  }

  getProjectedStream(config: ProjectedStreamConfiguration) {
    const streamId = config.getHash();
    const existing = this.projectedStreams.get(streamId);
    if (existing) {
      return existing;
    }

    const aggregateStreams = Array.from(this.aggregateStreams.values()).filter((stream) =>
      config.listensForAggregateType(stream.configuration.aggregateType),
    );

    const orderedFacts = aggregateStreams
      .flatMap((stream) => stream.facts)
      .sort((l, r) => l.occurredAt.getTime() - r.occurredAt.getTime());

    const projectedStream = new ProjectedStream();

    for (const fact of orderedFacts) {
      if (config.listensForEvent(fact.type, fact.type)) {
        projectedStream.append(fact);
      }
    }

    for (const stream of aggregateStreams) {
      const unsubscribe = stream.subscribe((fact) => {
        if (config.listensForEvent(stream.configuration.aggregateType, fact.type)) {
          projectedStream.append(fact);
        }
      });
      projectedStream.onClose(unsubscribe);
    }

    this.newStreamSubscribers.add((stream) => {
      if (config.listensForAggregateType(stream.configuration.aggregateType)) {
        const unsubscribe = stream.subscribe((fact) => {
          if (config.listensForEvent(stream.configuration.aggregateType, fact.type)) {
            projectedStream.append(fact);
          }
        });
        projectedStream.onClose(unsubscribe);
      }
    });

    this.projectedStreams.set(streamId, projectedStream);

    return projectedStream;
  }

  async *readProjectedStream(stream: ProjectedStreamConfiguration, from: number) {
    const projectedStream = this.getProjectedStream(stream);
    yield* projectedStream.read(from);
  }

  followProjectedStream(stream: ProjectedStreamConfiguration, from: number): StreamFollower {
    const projectedStream = this.getProjectedStream(stream);
    return projectedStream.follow(from);
  }
}
