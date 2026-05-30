import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'recentSearches';

function load() {
	if (!browser) return [];
	return JSON.parse(sessionStorage.getItem(KEY) || '[]');
}

function save(data) {
	if (browser) sessionStorage.setItem(KEY, JSON.stringify(data));
}

const { subscribe, update } = writable(load());

export const recentSearches = {
	subscribe,
	add(name) {
		update(searches => {
			const filtered = searches.filter(s => s.name !== name);
			const updated = [{ name, type: null }, ...filtered].slice(0, 5);
			save(updated);
			return updated;
		});
	},
	setType(name, type) {
		update(searches => {
			const updated = searches.map(s => s.name === name ? { ...s, type } : s);
			save(updated);
			return updated;
		});
	}
};
