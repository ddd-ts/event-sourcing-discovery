import { WithdrawCommand } from "../../../application/commands/withdraw.command";

type WithdrawCommandSerialized1n = {
  type: "WithdrawCommand";
  payload: {
    accountId: string;
    total: number;
  };
  version: 1;
};

type WithdrawCommandSerialized2n = {
  type: "WithdrawCommand";
  payload: {
    accountId: string;
    amount: number;
  };
  version: 2;
};

export class WithdrawCommandSerializer {
  serialize(command: WithdrawCommand): WithdrawCommandSerialized2n {
    return {
      ...command.serialize(),
      version: 2,
    } as const;
  }

  upcast(serialized: WithdrawCommandSerialized1n | WithdrawCommandSerialized2n): WithdrawCommandSerialized2n {
    if (serialized.version === 1) {
      return {
        ...serialized,
        payload: {
          amount: serialized.payload.total,
          accountId: serialized.payload.accountId
        },
        version: 2,
      } as const;
    }

    return serialized;
  }

  deserialize(serialized: WithdrawCommandSerialized1n | WithdrawCommandSerialized2n) {
    const upcasted = this.upcast(serialized);

    return WithdrawCommand.deserialize(upcasted);
  }
}
