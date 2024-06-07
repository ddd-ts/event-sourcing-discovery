import { Shape, type Constructor, type DefinitionOf, type DictShorthand } from "@ddd-ts/shape";

class SagaExtractor { }

class Registry {
    sagas = new Set<SagaDefinition>();

    addSaga(saga: SagaDefinition) {
        this.sagas.add(saga);
    }

    private hasSagas(thing: unknown): thing is { __sagas__: SagaDefinition[] } {
        return '__sagas__' in (thing as any);
    }

    register(Class: Constructor<any>) {
        for (const key of Object.getOwnPropertyNames(Class)) {
            const method = Class[key as keyof typeof Class] as any
            if (this.hasSagas(method)) {
                for (const saga of method.__sagas__) {
                    this.addSaga(saga);
                }
            }
        }

        for (const key of Object.getOwnPropertyNames(Class.prototype)) {
            const method = Class.prototype[key as keyof typeof Class.prototype] as any
            if (this.hasSagas(method)) {
                for (const saga of method.__sagas__) {
                    this.addSaga(saga);
                }
            }
        }
    }
}


class SagaDefinition {
    constructor(public name: string, public stream: string, public handler: any) { }
}


const Saga = <const S extends DictShorthand>(shape: S) => class Saga {
    state: DefinitionOf<S>['$inline'];
    done: boolean;
    commands: any[] = [];

    constructor({ state, done, commands }: { state: DefinitionOf<S>['$inline'], done: boolean; commands: any[] }) {
        this.state = state;
        this.done = done;
        this.commands = commands;
    }

    end() {
        this.done = true;
    }

    static start(state: DefinitionOf<S>['$inline']) {
        return new this({ state, done: false, commands: [] });
    }
};

function SagaForward(eventType: any, handler: any) {
    const saga = new SagaDefinition(eventType.name, eventType.stream, handler);
    return (original: any, context: ClassMethodDecoratorContext) => {
        original.__sagas__ = original.__sagas__ || [];
        original.__sagas__.push(saga);
    }
}

Saga.forward = SagaForward;

function SagaOn(eventType: any) {
    return (original: any, context: ClassMethodDecoratorContext) => {
        original.__saga_lifecycle__ = original.__saga_lifecycle__ || [];
        original.__saga_lifecycle__.push([eventType, original]);
    }
}

Saga.on = SagaOn;

class AccountRegistry {
    @Saga.forward(AccountOpened, event => AccountAdded.new(event.aggregateId, {}))
    onStuff() { }
}


class AddAccountToRegistrySaga extends Saga({}) {
    @Saga.on(AccountOpened)
    static onAccountOpened(event: AccountOpened) {
        return this.start({
            state: {},
            association: {
                accountId: event.aggregateId,
            }
        })
    }

    @Saga.on(AccountAdded)
    onAccountAdded(event: AccountAdded) {
        this.end();
    }
}


interface Saga<T extends {}> {
    state: T;
    association: { [key: string]: string };
    done: boolean;
    commands: any[];
}

interface SagaStore<T extends {}> {
    save(saga: Saga<T>): void;
    load(id: string): Saga<T>;
    loadByAssociation(key: string, value: string): Saga<T>;
}

