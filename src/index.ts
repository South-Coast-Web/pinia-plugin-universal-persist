import { PiniaPluginContext } from "pinia";

export interface PersistStrategy {
	key?: string;
	storage?: Storage;
	paths?: string[];
}

export interface PersistOptions {
	enabled: true;
	strategies?: PersistStrategy[];
}

type Store = PiniaPluginContext["store"];
type PartialState = Partial<Store["$state"]>;

declare module "pinia" {
	export interface DefineStoreOptionsBase<S, Store> {
		persist?: PersistOptions;
	}
}

export const createMockStorage = (): Storage => {
	let mock = {} as Record<string, string | null>;

	return {
		clear: () => {
			mock = {};
		},
		getItem: (key) => mock[key],
		setItem: (key, value) => {
			mock[key] = value;
		},
		key: (idx) => mock[idx],
		removeItem: (key) => {
			delete mock[key];
		},
		length: 0,
	};
};

export const updateStorage = (strategy: PersistStrategy, store: Store) => {
	const defaultStorage = typeof window !== "undefined" ? sessionStorage : createMockStorage();
	const storage = strategy.storage || defaultStorage;
	const storeKey = strategy.key || store.$id;

	if (strategy.paths) {
		const partialState = strategy.paths.reduce((finalObj, key) => {
			finalObj[key] = store.$state[key];
			return finalObj;
		}, {} as PartialState);

		storage.setItem(storeKey, JSON.stringify(partialState));
	} else {
		storage.setItem(storeKey, JSON.stringify(store.$state));
	}
};

export const piniaUniversalPersist = ({ options, store }: PiniaPluginContext): void => {
	if (options.persist?.enabled) {
		const defaultStorage = typeof window !== "undefined" ? sessionStorage : createMockStorage();

		const defaultStrat: PersistStrategy[] = [
			{
				key: store.$id,
				storage: defaultStorage,
			},
		];

		const strategies = options.persist?.strategies?.length ? options.persist?.strategies : defaultStrat;

		strategies.forEach((strategy) => {
			const storage = strategy.storage || defaultStorage;
			const storeKey = strategy.key || store.$id;
			const storageResult = storage.getItem(storeKey);

			if (storageResult) {
				store.$patch(JSON.parse(storageResult));
				updateStorage(strategy, store);
			}
		});

		store.$subscribe(() => {
			strategies.forEach((strategy) => {
				updateStorage(strategy, store);
			});
		});
	}
};
