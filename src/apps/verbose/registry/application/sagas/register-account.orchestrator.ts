import { Account } from "../../../account/domain/account";
import { AccountOpenedSerializer1n } from "../../../account/infrastructure/serializers/account-opened.serializer";
import { Checkpoint, type CheckpointStore } from "../../../framework/checkpoint";
import { ProjectedStreamConfiguration, type ProjectedStreamReader } from "../../../framework/event-store";
import { AccountRegistered, Registry } from "../../domain/registry";
import { AccountRegisteredSerializer1n } from "../../infrastructure/serializers/account-registered.serializer";
import type { RegisterAccountSagaManager } from "./register-account.saga-manager";

export class RegisterAccountOrchestrator {
  constructor(
    private readonly registerAccountSagaManager: RegisterAccountSagaManager,
    private readonly projectedStreamReader: ProjectedStreamReader,
    private readonly checkpointStore: CheckpointStore,
  ) {}

  accountOpenedSerializer = new AccountOpenedSerializer1n();
  accountRegisteredSerializer = new AccountRegisteredSerializer1n();

  deserialize(serialized: any) {
    switch (serialized.type) {
      case "AccountOpened":
        return this.accountOpenedSerializer.deserialize(serialized);
      case AccountRegistered.type:
        return this.accountRegisteredSerializer.deserialize(serialized);
    }

    throw new Error(`Unknown event type: ${serialized.type}`);
  }

  async start() {
    const stream = new ProjectedStreamConfiguration()
      .withEvent(Account.type, "AccountOpened")
      .withEvent(Registry.type, AccountRegistered.type);
    const sagaManagerId = "RegisterAccountSagaManager";

    const checkpoint = (await this.checkpointStore.load(sagaManagerId)) || Checkpoint.beginning(sagaManagerId);

    for await (const serialized of this.projectedStreamReader.followProjectedStream(stream, checkpoint.revision + 1)) {
      const event = this.deserialize(serialized);

      if (event.revision !== checkpoint.revision + 1) {
        throw new Error(`Expected revision ${checkpoint.revision + 1} but got ${event.revision}`);
      }

      if (event.type === "AccountOpened") {
        await this.registerAccountSagaManager.onAccountOpened(event as any);
      }

      if (event instanceof AccountRegistered) {
        await this.registerAccountSagaManager.onAccountRegistered(event);
      }

      await this.checkpointStore.save(checkpoint.at(event.revision));
    }
  }
}
