/**
 * Mock for $app/stores
 * @module tests/mocks/app-stores
 */

import { readable } from 'svelte/store';

export const page = readable({
	url: new URL('http://localhost'),
	params: {},
	route: { id: '/' },
	status: 200,
	error: null,
	data: {},
	state: {},
	form: null
});

export const navigating = readable(null);

export const updated = {
	subscribe: readable(false).subscribe,
	check: async () => false
};

export const getStores = () => ({
	page,
	navigating,
	updated
});
