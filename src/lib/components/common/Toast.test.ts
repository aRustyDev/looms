/**
 * Toast Component Tests
 * @module components/common/Toast.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Toast from './Toast.svelte';

describe('Toast', () => {
	describe('Rendering', () => {
		it('renders toast message', () => {
			render(Toast, { props: { id: 'test-1', message: 'Test notification' } });

			expect(screen.getByText('Test notification')).toBeInTheDocument();
		});

		it('applies type-based styling for success', () => {
			const { container } = render(Toast, {
				props: { id: 'test-1', message: 'Success!', type: 'success' }
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toHaveClass('bg-green-500');
		});

		it('applies type-based styling for error', () => {
			const { container } = render(Toast, {
				props: { id: 'test-1', message: 'Error!', type: 'error' }
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toHaveClass('bg-red-500');
		});

		it('applies type-based styling for warning', () => {
			const { container } = render(Toast, {
				props: { id: 'test-1', message: 'Warning!', type: 'warning' }
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toHaveClass('bg-yellow-500');
		});

		it('applies type-based styling for info', () => {
			const { container } = render(Toast, {
				props: { id: 'test-1', message: 'Info!', type: 'info' }
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toHaveClass('bg-blue-500');
		});

		it('defaults to info type', () => {
			const { container } = render(Toast, {
				props: { id: 'test-1', message: 'Default' }
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toHaveClass('bg-blue-500');
		});
	});

	describe('Dismiss', () => {
		it('shows dismiss button', () => {
			render(Toast, { props: { id: 'test-1', message: 'Test' } });

			expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
		});

		it('calls ondismiss with ID when button clicked', async () => {
			const ondismiss = vi.fn();
			render(Toast, {
				props: { id: 'test-123', message: 'Test', ondismiss }
			});

			await fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

			expect(ondismiss).toHaveBeenCalledWith('test-123');
		});
	});

	describe('Accessibility', () => {
		it('has role="alert"', () => {
			render(Toast, { props: { id: 'test-1', message: 'Test' } });

			expect(screen.getByRole('alert')).toBeInTheDocument();
		});

		it('has aria-live="polite"', () => {
			render(Toast, { props: { id: 'test-1', message: 'Test' } });

			expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
		});

		it('dismiss button has accessible name', () => {
			render(Toast, { props: { id: 'test-1', message: 'Test' } });

			expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument();
		});
	});
});
