/**
 * Toast Store - Reactive notification system
 * @module stores/toast.svelte
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

interface ToastOptions {
	type?: ToastType;
	duration?: number;
}

class ToastStore {
	#toasts = $state<Toast[]>([]);
	#nextId = 0;

	get toasts(): Toast[] {
		return this.#toasts;
	}

	/**
	 * Show a toast notification
	 */
	show(message: string, options: ToastOptions = {}): string {
		const { type = 'info', duration = 5000 } = options;

		const id = `toast-${this.#nextId++}`;
		const toast: Toast = { id, message, type, duration };

		this.#toasts = [...this.#toasts, toast];

		// Auto-dismiss after duration
		if (duration > 0) {
			setTimeout(() => this.dismiss(id), duration);
		}

		return id;
	}

	/**
	 * Show a success toast
	 */
	success(message: string, duration = 5000): string {
		return this.show(message, { type: 'success', duration });
	}

	/**
	 * Show an error toast
	 */
	error(message: string, duration = 5000): string {
		return this.show(message, { type: 'error', duration });
	}

	/**
	 * Show a warning toast
	 */
	warning(message: string, duration = 5000): string {
		return this.show(message, { type: 'warning', duration });
	}

	/**
	 * Show an info toast
	 */
	info(message: string, duration = 5000): string {
		return this.show(message, { type: 'info', duration });
	}

	/**
	 * Dismiss a toast by ID
	 */
	dismiss(id: string): void {
		this.#toasts = this.#toasts.filter((t) => t.id !== id);
	}

	/**
	 * Clear all toasts
	 */
	clear(): void {
		this.#toasts = [];
	}
}

// Export singleton instance
export const toastStore = new ToastStore();

// Export class for testing
export { ToastStore };
