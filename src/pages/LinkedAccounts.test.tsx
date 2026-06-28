/**
 * Tests for LinkedAccounts page component
 * 
 * Covers:
 * - Rendering provider cards
 * - Loading states
 * - Connect/disconnect/reconnect actions
 * - Error handling
 * - Keyboard accessibility
 * - ARIA attributes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkedAccounts } from './LinkedAccounts';
import * as linkedAccountsService from '../services/linkedAccounts';
import type { LinkedAccount } from '../types/linkedAccount';

// Mock the service
vi.mock('../services/linkedAccounts', () => ({
  fetchLinkedAccounts: vi.fn(),
  initiateLinkAccount: vi.fn(),
  disconnectAccount: vi.fn(),
  reconnectAccount: vi.fn(),
  verifyAccount: vi.fn(),
  PROVIDER_INFO: {
    google: { name: 'Google', icon: '🔵', color: '#4285f4' },
    github: { name: 'GitHub', icon: '⚫', color: '#24292e' },
    twitter: { name: 'Twitter', icon: '🐦', color: '#1da1f2' },
    facebook: { name: 'Facebook', icon: '🔷', color: '#1877f2' },
  },
}));

describe('LinkedAccounts', () => {
  const mockAccounts: LinkedAccount[] = [
    {
      id: 'google-123',
      provider: 'google',
      status: 'connected',
      displayName: 'Test User',
      externalId: 'test@gmail.com',
      connectedAt: '2026-01-01T00:00:00Z',
      lastVerified: '2026-06-28T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);
  });

  describe('Rendering', () => {
    it('should render page header and description', async () => {
      render(<LinkedAccounts />);

      expect(screen.getByRole('heading', { name: /linked accounts/i, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/connect your external accounts/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<LinkedAccounts />);

      expect(screen.getByLabelText(/loading accounts/i)).toBeInTheDocument();
    });

    it('should render all provider cards after loading', async () => {
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('article', { name: /google account not connected/i })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: /github account not connected/i })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: /twitter account not connected/i })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: /facebook account not connected/i })).toBeInTheDocument();
      });
    });

    it('should show connected status for linked accounts', async () => {
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue(mockAccounts);

      render(<LinkedAccounts />);

      await waitFor(() => {
        const googleCard = screen.getByRole('article', { name: /google account connected/i });
        expect(within(googleCard).getByText('Connected')).toBeInTheDocument();
        expect(within(googleCard).getByText('test@gmail.com')).toBeInTheDocument();
      });
    });

    it('should show error status for accounts with errors', async () => {
      const errorAccount: LinkedAccount = {
        id: 'github-456',
        provider: 'github',
        status: 'error',
        displayName: 'Test User',
        externalId: 'test@github.com',
        connectedAt: '2026-01-01T00:00:00Z',
        error: {
          code: 'provider_error',
          message: 'Token has been revoked',
        },
      };

      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([errorAccount]);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('alert', { name: '' })).toHaveTextContent('Token has been revoked');
      });
    });

    it('should render security notice', async () => {
      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('note')).toBeInTheDocument();
        expect(screen.getByText(/security & privacy/i)).toBeInTheDocument();
        expect(screen.getByText(/industry-standard oauth 2\.0/i)).toBeInTheDocument();
      });
    });
  });

  describe('Connect Action', () => {
    it('should call initiateLinkAccount when connect button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);
      vi.mocked(linkedAccountsService.initiateLinkAccount).mockResolvedValue({
        authUrl: '/oauth/google?state=test',
        state: 'test-state',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole('button', { name: /connect google account/i });
      await user.click(connectButton);

      expect(linkedAccountsService.initiateLinkAccount).toHaveBeenCalledWith({ provider: 'google' });
    });

    it('should show success message after successful connection', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockAccounts);
      vi.mocked(linkedAccountsService.initiateLinkAccount).mockResolvedValue({
        authUrl: '/oauth/google?state=test',
        state: 'test-state',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /connect google account/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/google account linked successfully/i);
      });
    });

    it('should show error message on connection failure', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);
      vi.mocked(linkedAccountsService.initiateLinkAccount).mockRejectedValue({
        code: 'already_linked',
        message: 'Google account is already linked',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /connect google account/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/google account is already linked/i);
      });
    });
  });

  describe('Disconnect Action', () => {
    it('should call disconnectAccount when disconnect button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts)
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce([]);
      vi.mocked(linkedAccountsService.disconnectAccount).mockResolvedValue();

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /disconnect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /disconnect google account/i }));

      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => {
        expect(linkedAccountsService.disconnectAccount).toHaveBeenCalledWith('google-123');
      });

      confirmSpy.mockRestore();
    });

    it('should not disconnect if user cancels confirmation', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue(mockAccounts);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /disconnect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /disconnect google account/i }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(linkedAccountsService.disconnectAccount).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should show success message after disconnection', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts)
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce([]);
      vi.mocked(linkedAccountsService.disconnectAccount).mockResolvedValue();

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /disconnect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /disconnect google account/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/google account disconnected/i);
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Reconnect Action', () => {
    it('should show reconnect button for accounts with errors', async () => {
      const errorAccount: LinkedAccount = {
        id: 'github-456',
        provider: 'github',
        status: 'error',
        displayName: 'Test User',
        externalId: 'test@github.com',
        connectedAt: '2026-01-01T00:00:00Z',
        error: {
          code: 'token_expired',
          message: 'Token expired',
        },
      };

      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([errorAccount]);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reconnect github account/i })).toBeInTheDocument();
      });
    });

    it('should call reconnectAccount when reconnect button is clicked', async () => {
      const user = userEvent.setup();
      const errorAccount: LinkedAccount = {
        id: 'github-456',
        provider: 'github',
        status: 'error',
        displayName: 'Test User',
        externalId: 'test@github.com',
        connectedAt: '2026-01-01T00:00:00Z',
        error: {
          code: 'token_expired',
          message: 'Token expired',
        },
      };

      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([errorAccount]);
      vi.mocked(linkedAccountsService.reconnectAccount).mockResolvedValue({
        authUrl: '/oauth/github?state=test',
        state: 'test-state',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reconnect github account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /reconnect github account/i }));

      expect(linkedAccountsService.reconnectAccount).toHaveBeenCalledWith('github-456');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on provider cards', async () => {
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue(mockAccounts);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('article', { name: /google account connected/i })).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels on action buttons', async () => {
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /connect github account/i })).toBeInTheDocument();
      });
    });

    it('should announce success messages with aria-live', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockAccounts);
      vi.mocked(linkedAccountsService.initiateLinkAccount).mockResolvedValue({
        authUrl: '/oauth/google?state=test',
        state: 'test-state',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /connect google account/i }));

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockResolvedValue([]);

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      const firstButton = screen.getByRole('button', { name: /connect google account/i });
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab to next button
      await user.tab();
      expect(screen.getByRole('button', { name: /connect github account/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should show error banner on fetch failure', async () => {
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockRejectedValue(new Error('Network error'));

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load linked accounts/i);
      });
    });

    it('should allow dismissing error banner', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts).mockRejectedValue(new Error('Network error'));

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should allow dismissing success message', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedAccountsService.fetchLinkedAccounts)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockAccounts);
      vi.mocked(linkedAccountsService.initiateLinkAccount).mockResolvedValue({
        authUrl: '/oauth/google?state=test',
        state: 'test-state',
      });

      render(<LinkedAccounts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect google account/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /connect google account/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss success message/i });
      await user.click(dismissButton);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
