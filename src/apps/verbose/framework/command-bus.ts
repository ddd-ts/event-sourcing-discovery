export interface Command {
  type: string;
}

export interface CommandBus {
  execute(command: Command): Promise<void>;
}

export class InMemoryCommandBus implements CommandBus {
  handlers = new Map<string, any>();

  register(type: string, handler: any): void {
    this.handlers.set(type, handler);
  }

  async execute(command: Command): Promise<any> {
    const handler = this.handlers.get(command.type);

    if (!handler) {
      throw new Error(`Cannot find handler for command ${command.type}`);
    }

    console.log(`Executing command ${command.type}`, JSON.stringify(command));

    return await handler.execute(command);
  }
}
