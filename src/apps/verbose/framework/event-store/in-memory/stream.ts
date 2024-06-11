import type { Fact } from "../../es-event";
import type { AggregateStreamConfiguration } from "../../event-store";
import { Queue } from "./queue";

export class Stream {
  facts: Fact[] = [];
  subscribers = new Set<(fact: Fact) => void>();

  append(fact: Fact) {
    const localFact = { ...fact, revision: this.facts.length };
    this.facts.push(localFact);
    for (const subscriber of this.subscribers) {
      subscriber(localFact);
    }
  }

  subscribe(subscriber: (fact: Fact) => void) {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  *read(from = 0) {
    yield* this.facts.slice(from);
  }
}

export class ProjectedStream extends Stream {
  followers = new Set<Queue<Fact>>();
  onCloseCallbacks: any[] = [];

  onClose(callback: any) {
    this.onCloseCallbacks.push(callback);
  }

  follow(from = 0) {
    const follower = new Queue<Fact>();
    this.followers.add(follower);

    for (const fact of this.read(from)) {
      follower.push(fact);
    }

    const unsubscribe = this.subscribe((fact) => {
      if (fact.revision >= from) {
        follower.push(fact);
      }
    });

    follower.onClose(unsubscribe);

    return follower;
  }
}

export class AggregateStream extends Stream {
  constructor(public readonly configuration: AggregateStreamConfiguration) {
    super();
  }
}
