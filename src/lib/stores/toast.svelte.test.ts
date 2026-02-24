/**
 * Toast Store Tests
 * @module stores/toast.svelte.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastStore } from './toast.svelte.js';

describe('ToastStore', () => {
	let store: ToastStore;

	beforeEach(() => {
		store = new ToastStore();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('show()', () => {
		it('adds toast to queue', () => {
			store.show('Test message');

			expect(store.toasts).toHaveLength(1);
			expect(store.toasts[0]?.message).toBe('Test message');
		});

		it('returns toast ID', () => {
			const id = store.show('Test message');

			expect(id).toMatch(/^toast-\d+$/);
		});

		it('uses default type "info"', () => {
			store.show('Test message');

			expect(store.toasts[0]?.type).toBe('info');
		});

		it('uses default duration of 5000ms', () => {
			store.show('Test message');

			expect(store.toasts[0]?.duration).toBe(5000);
		});

		it('accepts custom type', () => {
			store.show('Error!', { type: 'error' });

			expect(store.toasts[0]?.type).toBe('error');
		});

		it('accepts custom duration', () => {
			store.show('Quick message', { duration: 2000 });

			expect(store.toasts[0]?.duration).toBe(2000);
		});
	});

	describe('type shortcuts', () => {
		it('success() adds success toast', () => {
			store.success('Success!');

			expect(store.toasts[0]?.type).toBe('success');
		});

		it('error() adds error toast', () => {
			store.error('Error!');

			expect(store.toasts[0]?.type).toBe('error');
		});

		it('warning() adds warning toast', () => {
			store.warning('Warning!');

			expect(store.toasts[0]?.type).toBe('warning');
		});

		it('info() adds info toast', () => {
			store.info('Info!');

			expect(store.toasts[0]?.type).toBe('info');
		});
	});

	describe('dismiss()', () => {
		it('removes toast by ID', () => {
			const id = store.show('Test');
			expect(store.toasts).toHaveLength(1);

			store.dismiss(id);
			expect(store.toasts).toHaveLength(0);
		});

		it('only removes matching toast', () => {
			store.show('First');
			const id2 = store.show('Second');
			store.show('Third');

			store.dismiss(id2);

			expect(store.toasts).toHaveLength(2);
			expect(store.toasts.map((t) => t.message)).toEqual(['First', 'Third']);
		});
	});

	describe('auto-dismiss', () => {
		it('automatically dismisses after duration', () => {
			store.show('Auto dismiss', { duration: 3000 });
			expect(store.toasts).toHaveLength(1);

			vi.advanceTimersByTime(3000);
			expect(store.toasts).toHaveLength(0);
		});

		it('does not auto-dismiss when duration is 0', () => {
			store.show('Persistent', { duration: 0 });
			expect(store.toasts).toHaveLength(1);

			vi.advanceTimersByTime(10000);
			expect(store.toasts).toHaveLength(1);
		});
	});

	describe('clear()', () => {
		it('removes all toasts', () => {
			store.show('First');
			store.show('Second');
			store.show('Third');
			expect(store.toasts).toHaveLength(3);

			store.clear();
			expect(store.toasts).toHaveLength(0);
		});
	});

	describe('supports all toast types', () => {
		it.each(['success', 'error', 'warning', 'info'] as const)('supports %s type', (type) => {
			store.show('Test', { type });
			expect(store.toasts[0]?.type).toBe(type);
		});
	});
});
