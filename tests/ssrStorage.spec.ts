// @vitest-environment node

import { createMockStorage, piniaUniversalPersist } from "../src";
import { it, describe, beforeAll, expect, expectTypeOf, vi } from "vitest";
import { defineStore } from "pinia";
import { createTestingPinia } from "@pinia/testing";

describe("SSR Storage", () => {
	let store;

	const useCounter = defineStore("counter", {
		state: () => ({ n: 1 }),
		getters: {
			double: (state) => state.n * 2,
		},
		persist: {
			enabled: true,
		},
	});

	beforeAll(() => {
		const pinia = createTestingPinia();
		pinia.use(piniaUniversalPersist);
		store = useCounter(pinia);
	});

	it("creates a mock storage object properly", () => {
		const mock = createMockStorage();
		expectTypeOf(mock).toBeObject();

		const getItem = vi.spyOn(mock, "getItem");
		const setItem = vi.spyOn(mock, "setItem");
		const removeItem = vi.spyOn(mock, "removeItem");
		const clear = vi.spyOn(mock, "clear");

		mock.clear();
		mock.getItem("foo");
		mock.setItem("foo", "bar");
		expect(getItem).toHaveBeenCalledOnce();
		expect(clear).toHaveBeenCalledOnce();
		expect(setItem).toHaveBeenCalledOnce();
		const foo = mock.getItem("foo");
		expect(getItem).toHaveBeenCalledTimes(2);
		expect(foo).toBe("bar");

		mock.removeItem("foo");
		expect(removeItem).toHaveBeenCalledOnce();
		const foo2 = mock.getItem("foo");
		expect(getItem).toHaveBeenCalledTimes(3);
		expect(foo2).toBeUndefined();
	});

	it("is in an SSR environment", () => {
		expect(typeof window).toBe("undefined");
	});

	it("doesn't error when in an SSR context", () => {
		expect(store.n).toBe(1);
	});
});
