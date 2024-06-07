export interface Saga<T extends {}> {
    state: T;
    association: { [key: string]: string };
    done: boolean;
    commands: any[];
}

export interface SagaStore<T extends {}> {
    save(saga: Saga<T>): void;
    load(id: string): Saga<T>;
    loadByAssociation(key: string, value: string): Saga<T>;
}