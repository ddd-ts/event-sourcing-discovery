import { Constructor, DefinitionOf, DictShorthand, Shape } from "@ddd-ts/shape";

export const Command = <const T extends string, const S extends DictShorthand>(type: T, shape: S) => Shape({
  type,
  payload: shape,
}, class {
  static type = type;

  static new<TH extends Constructor>(this: TH, payload: DefinitionOf<S>['$inline']) {
    return new this({
      type,
      payload,
    })
  }
})
