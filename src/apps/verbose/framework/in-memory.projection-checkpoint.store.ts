import { type Checkpoint, type CheckpointStore } from "./checkpoint";

export class InMemoryCheckpointStore implements CheckpointStore {
  checkpoints: Map<string, Checkpoint> = new Map();

  async load(projectionId: string): Promise<Checkpoint | undefined> {
    return this.checkpoints.get(projectionId);
  }

  async save(checkpoint: Checkpoint): Promise<void> {
    this.checkpoints.set(checkpoint.id, checkpoint);
  }
}
