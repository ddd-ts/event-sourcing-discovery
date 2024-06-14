import { Primitive, Constructor } from "@ddd-ts/shape";

export const Id = <const T extends string>(type: T) => class Id extends Primitive(String) {
  type = type
  static generate<TH extends Constructor>(this: TH) {
    return new this(Math.random().toString().substring(3)) as InstanceType<TH>
  }

  toString() {
    return this.value;
  }
}
