import { Account, Withdrawn } from "../../../account/domain/account";
import { WithdrawnSerializer1n } from "../../../account/infrastructure/serializers/withdrawn.serializer";
import { Checkpoint, type CheckpointStore } from "../../../framework/checkpoint";
import { ProjectedStreamConfiguration, type ProjectedStreamReader } from "../../../framework/event-store";
import { Registry, WithdrawalRegistered } from "../../domain/registry";
import { WithdrawalRegisteredSerializer1n } from "../../infrastructure/serializers/withdrawal-registered.serializer";
import type { RegisterWithdrawalSagaManager } from "./register-withdrawal.saga-manager";

export class RegisterWithdrawalSagaOrchestrator {
  constructor(
    private readonly registerWithdrawalSagaManager: RegisterWithdrawalSagaManager,
    private readonly projectedStreamReader: ProjectedStreamReader,
    private readonly checkpointStore: CheckpointStore,
  ) {}

  witdrawnSerializer = new WithdrawnSerializer1n();
  withdrawalRegisteredSerializer = new WithdrawalRegisteredSerializer1n();

  deserialize(serialized: any) {
    switch (serialized.type) {
      case Withdrawn.type:
        return this.witdrawnSerializer.deserialize(serialized);
      case WithdrawalRegistered.type:
        return this.withdrawalRegisteredSerializer.deserialize(serialized);
    }

    throw new Error(`Unknown event type: ${serialized.type}`);
  }

  async start() {
    const stream = new ProjectedStreamConfiguration()
      .withEvent(Account.type, Withdrawn.type)
      .withEvent(Registry.type, WithdrawalRegistered.type);
    const sagaManagerId = "RegisterWithdrawalSagaManager";

    const checkpoint = (await this.checkpointStore.load(sagaManagerId)) || Checkpoint.beginning(sagaManagerId);

    for await (const serialized of this.projectedStreamReader.followProjectedStream(stream, checkpoint.revision + 1)) {
      const event = this.deserialize(serialized);

      if (event.revision !== checkpoint.revision + 1) {
        throw new Error(`Expected revision ${checkpoint.revision + 1} but got ${event.revision}`);
      }

      if (event instanceof Withdrawn) {
        await this.registerWithdrawalSagaManager.onWithdrawn(event);
      }

      if (event instanceof WithdrawalRegistered) {
        await this.registerWithdrawalSagaManager.onWithdrawalRegistered(event);
      }

      await this.checkpointStore.save(checkpoint.at(event.revision));
    }
  }
}
