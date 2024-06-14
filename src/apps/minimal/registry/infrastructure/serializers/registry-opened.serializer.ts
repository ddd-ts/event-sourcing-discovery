import { RegistryOpened } from "../../domain/registry";

export class RegistryOpenedSerializer {
  serialize(event: RegistryOpened) {
    return {
      ...event.serialize(),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>): RegistryOpened {
    return RegistryOpened.deserialize(serialized);
  }
}
