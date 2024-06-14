import { type ProjectedStreamReader } from "../../framework/event-store";
import { Checkpoint, type CheckpointStore } from "../../framework/checkpoint";
import { EventSerializerRegistryForProjection } from "../../framework/es-event";
import { Projection } from "../../framework/quick/projection";

export class Projector<P extends Projection<any>> {
  constructor(
    public readonly projection: P,
    private readonly checkpointStore: CheckpointStore,
    private readonly streamReader: ProjectedStreamReader,
    private readonly serializers: EventSerializerRegistryForProjection<P>,
  ) { }

  async start() {
    const checkpointId = this.projection.type

    const checkpoint = (await this.checkpointStore.load(checkpointId)) || Checkpoint.beginning(checkpointId);

    const streamConfiguration = this.projection.streamConfiguration;

    for await (const serialized of this.streamReader.followProjectedStream(streamConfiguration, checkpoint.revision + 1)) {
      const event = this.serializers.deserialize(serialized);

      if (event.revision !== checkpoint.revision + 1) {
        throw new Error(`Expected revision ${checkpoint.revision + 1} but got ${event.revision}`);
      }

      await this.projection.handle(event);
      await this.checkpointStore.save(checkpoint.at(event.revision));
    }
  }
}
