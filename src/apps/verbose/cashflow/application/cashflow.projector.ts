import { Account, Deposited, Withdrawn } from "../../account/domain/account";
import { ProjectedStreamConfiguration, type ProjectedStreamReader } from "../../framework/event-store";
import type { CashflowProjection } from "./cashflow.projection";
import { Checkpoint, type CheckpointStore } from "../../framework/checkpoint";
import { DepositedSerializer1n } from "../../account/infrastructure/serializers/deposited.serializer";
import { WithdrawnSerializer1n } from "../../account/infrastructure/serializers/withdrawn.serializer";

export class CashflowProjector {
  constructor(
    private readonly cashflowProjection: CashflowProjection,
    private readonly checkpointStore: CheckpointStore,
    private readonly streamReader: ProjectedStreamReader,
  ) {}

  depositedSerializer = new DepositedSerializer1n();
  withdrawnSerializer = new WithdrawnSerializer1n();

  deserialize(serialized: any) {
    switch (serialized.type) {
      case Deposited.type:
        return this.depositedSerializer.deserialize(serialized);
      case Withdrawn.type:
        return this.withdrawnSerializer.deserialize(serialized);
    }

    throw new Error(`Unknown event type: ${serialized.type}`);
  }

  async start() {
    const checkpointId = "CashflowProjection";

    const checkpoint = (await this.checkpointStore.load(checkpointId)) || Checkpoint.beginning(checkpointId);

    const stream = new ProjectedStreamConfiguration()
      .withEvent(Account.type, Deposited.type)
      .withEvent(Account.type, Withdrawn.type);

    for await (const serialized of this.streamReader.followProjectedStream(stream, checkpoint.revision + 1)) {
      const event = this.deserialize(serialized);

      if (event.revision !== checkpoint.revision + 1) {
        throw new Error(`Expected revision ${checkpoint.revision + 1} but got ${event.revision}`);
      }

      if (event instanceof Deposited) {
        await this.cashflowProjection.onDeposited(event);
      }

      if (event instanceof Withdrawn) {
        await this.cashflowProjection.onWithdrawn(event);
      }

      await this.checkpointStore.save(checkpoint.at(event.revision));
    }
  }
}
