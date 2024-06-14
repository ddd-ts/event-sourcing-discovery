export class Checkpoint {
  constructor(
    public readonly id: string,
    public revision: number,
  ) {}

  at(revision: number) {
    this.revision = revision;
    return this;
  }

  static beginning(id: string) {
    return new Checkpoint(id, -1);
  }
}

export interface CheckpointStore {
  load(projectionId: string): Promise<Checkpoint | undefined>;
  save(checkpoint: Checkpoint): Promise<void>;
}
