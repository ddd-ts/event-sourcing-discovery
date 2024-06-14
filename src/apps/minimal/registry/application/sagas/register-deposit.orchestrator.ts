import { Account, Deposited } from "../../../account/domain/account";
import { DepositedSerializer1n } from "../../../account/infrastructure/serializers/events/deposited.serializer";
import { Checkpoint, type CheckpointStore } from "../../../framework/checkpoint";
import { ProjectedStreamConfiguration, type ProjectedStreamReader } from "../../../framework/event-store";
import { DepositRegistered, Registry } from "../../domain/registry";
import { DepositRegisteredSerializer } from "../../infrastructure/serializers/deposit-registered.serializer";
import type { RegisterDepositSagaManager } from "./register-deposit.saga-manager";

export class RegisterDepositSagaOrchestrator {
  constructor(
    private readonly registerDepositSagaManager: RegisterDepositSagaManager,
    private readonly projectedStreamReader: ProjectedStreamReader,
    private readonly checkpointStore: CheckpointStore,
  ) {}

  depositedSerializer = new DepositedSerializer1n();
  depositRegisteredSerializer = new DepositRegisteredSerializer();

  deserialize(serialized: any) {
    switch (serialized.type) {
      case Deposited.type:
        return this.depositedSerializer.deserialize(serialized);
      case DepositRegistered.type:
        return this.depositRegisteredSerializer.deserialize(serialized);
    }

    throw new Error(`Unknown event type: ${serialized.type}`);
  }

  async start() {
    const stream = new ProjectedStreamConfiguration()
      .withEvent(Account.type, Deposited.type)
      .withEvent(Registry.type, DepositRegistered.type);
    const sagaManagerId = "RegisterDepositSagaManager";

    const checkpoint = (await this.checkpointStore.load(sagaManagerId)) || Checkpoint.beginning(sagaManagerId);

    for await (const serialized of this.projectedStreamReader.followProjectedStream(stream, checkpoint.revision + 1)) {
      const event = this.deserialize(serialized);

      if (event.revision !== checkpoint.revision + 1) {
        throw new Error(`Expected revision ${checkpoint.revision + 1} but got ${event.revision}`);
      }

      if (event instanceof Deposited) {
        await this.registerDepositSagaManager.onDeposited(event);
      }

      if (event instanceof DepositRegistered) {
        await this.registerDepositSagaManager.onDepositRegistered(event);
      }

      await this.checkpointStore.save(checkpoint.at(event.revision));
    }
  }
}
