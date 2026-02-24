/**
 * IssueDetailModal Component Tests (TDD)
 * @module components/issues/IssueDetailModal.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import IssueDetailModal from './IssueDetailModal.svelte';

const mockIssue = {
	id: 'TEST-123',
	title: 'Fix authentication bug',
	description: '## Problem\n\nUsers cannot login after password reset.',
	status: 'in_progress',
	priority: 'P1',
	type: 'bug',
	assignee: 'John Doe',
	created: '2026-02-20T10:00:00Z',
	updated: '2026-02-23T15:30:00Z',
	comments: [],
	blockedBy: [],
	blocking: []
};

describe('IssueDetailModal', () => {
	describe('visibility', () => {
		it('renders modal when open is true', () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('does not render when open is false', () => {
			render(IssueDetailModal, { props: { open: false, issue: mockIssue } });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe('closing behavior', () => {
		it('closes on Escape key', async () => {
			const onClose = vi.fn();
			render(IssueDetailModal, { props: { open: true, issue: mockIssue, onclose: onClose } });

			await fireEvent.keyDown(document, { key: 'Escape' });

			expect(onClose).toHaveBeenCalled();
		});

		it('closes on backdrop click', async () => {
			const onClose = vi.fn();
			render(IssueDetailModal, { props: { open: true, issue: mockIssue, onclose: onClose } });

			const backdrop = screen.getByTestId('modal-backdrop');
			await fireEvent.click(backdrop);

			expect(onClose).toHaveBeenCalled();
		});

		it('does not close when clicking inside modal content', async () => {
			const onClose = vi.fn();
			render(IssueDetailModal, { props: { open: true, issue: mockIssue, onclose: onClose } });

			const modalContent = screen.getByRole('dialog');
			await fireEvent.click(modalContent);

			expect(onClose).not.toHaveBeenCalled();
		});

		it('calls onclose when close button clicked', async () => {
			const onClose = vi.fn();
			render(IssueDetailModal, { props: { open: true, issue: mockIssue, onclose: onClose } });

			await fireEvent.click(screen.getByRole('button', { name: /close/i }));

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('has role="dialog"', () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('has aria-modal="true"', () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		});

		it('has aria-labelledby pointing to title', () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			const dialog = screen.getByRole('dialog');
			const labelledBy = dialog.getAttribute('aria-labelledby');
			expect(labelledBy).toBeTruthy();

			const title = document.getElementById(labelledBy!);
			expect(title).toHaveTextContent('TEST-123');
		});

		it('traps focus within modal', async () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			// Focus should be set inside the modal
			await waitFor(() => {
				expect(document.activeElement).not.toBe(document.body);
				const modal = screen.getByRole('dialog');
				expect(modal.contains(document.activeElement)).toBe(true);
			});
		});

		it('restores focus on close', async () => {
			const button = document.createElement('button');
			button.textContent = 'Open Modal';
			document.body.appendChild(button);
			button.focus();

			const { rerender } = render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			// Close the modal
			await rerender({ open: false, issue: mockIssue });

			await waitFor(() => {
				expect(document.activeElement).toBe(button);
			});

			document.body.removeChild(button);
		});
	});

	describe('content', () => {
		it('displays issue details', () => {
			render(IssueDetailModal, { props: { open: true, issue: mockIssue } });

			expect(screen.getByText('TEST-123')).toBeInTheDocument();
			expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
		});

		it('passes onshowdependencies to IssueDetail', async () => {
			const onShowDeps = vi.fn();
			render(IssueDetailModal, {
				props: { open: true, issue: mockIssue, onshowdependencies: onShowDeps }
			});

			await fireEvent.click(screen.getByRole('button', { name: /dependencies/i }));

			expect(onShowDeps).toHaveBeenCalled();
		});
	});
});
