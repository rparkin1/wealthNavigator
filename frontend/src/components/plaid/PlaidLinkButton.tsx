/**
 * Plaid Link Button Component
 * Initializes and manages Plaid Link flow for connecting bank accounts
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink, type PlaidLinkOptions } from 'react-plaid-link';
import { plaidApi } from '../../services/plaidApi';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onExit?: () => void;
  buttonText?: string;
  className?: string;
}

export function PlaidLinkButton({
  onSuccess,
  onExit,
  buttonText = 'Connect Bank Account',
  className = '',
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create link token on mount
  useEffect(() => {
    async function createLinkToken() {
      try {
        setLoading(true);
        setError(null);
        const response = await plaidApi.createLinkToken({
          country_codes: ['US'],
          language: 'en',
        });
        setLinkToken(response.link_token);
      } catch (err) {
        console.error('Failed to create link token:', err);
        setError('Failed to initialize Plaid Link. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    createLinkToken();
  }, []);

  // Handle successful link
  const handleSuccess = useCallback(
    async (publicToken: string) => {
      try {
        setLoading(true);
        // Exchange public token for access token
        await plaidApi.exchangePublicToken({ public_token: publicToken });

        // Sync accounts and transactions
        await Promise.all([
          plaidApi.syncAccounts(),
          plaidApi.syncTransactions(),
        ]);

        // Call success callback
        onSuccess?.();
      } catch (err) {
        console.error('Failed to exchange token:', err);
        setError('Failed to connect account. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  // Handle link exit
  const handleExit = useCallback(() => {
    onExit?.();
  }, [onExit]);

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div className="plaid-link-button">
      <button
        onClick={() => open()}
        disabled={!ready || loading}
        className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors ${className}`}
      >
        {loading ? 'Connecting...' : buttonText}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {!ready && !error && (
        <div className="mt-2 text-sm text-gray-600">
          Initializing Plaid Link...
        </div>
      )}
    </div>
  );
}
