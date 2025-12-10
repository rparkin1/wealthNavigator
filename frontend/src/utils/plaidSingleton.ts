/**
 * Plaid Link Singleton Manager
 * Ensures only one Plaid Link script is loaded globally
 * Handles React StrictMode double-mounting
 */

let plaidScriptLoaded = false;
let plaidScriptLoading = false;
let plaidInstanceCreated = false;
const plaidScriptCallbacks: Array<() => void> = [];

/**
 * Check if Plaid Link is already initialized
 */
export function isPlaidInitialized(): boolean {
  return plaidInstanceCreated || !!document.querySelector('script[src*="plaid.com/link"]');
}

/**
 * Mark Plaid as initialized (called by PlaidLinkButton)
 */
export function markPlaidInitialized(): void {
  plaidInstanceCreated = true;
  plaidScriptLoaded = true;
}

/**
 * Ensures Plaid Link script is loaded only once
 * Returns a promise that resolves when the script is ready
 */
export function ensurePlaidScript(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    if (plaidScriptLoaded) {
      resolve();
      return;
    }

    // Currently loading, add to callbacks
    if (plaidScriptLoading) {
      plaidScriptCallbacks.push(resolve);
      return;
    }

    // Start loading
    plaidScriptLoading = true;
    plaidScriptCallbacks.push(resolve);

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="plaid.com/link"]');
    if (existingScript) {
      plaidScriptLoaded = true;
      plaidScriptLoading = false;
      plaidScriptCallbacks.forEach(cb => cb());
      plaidScriptCallbacks.length = 0;
      return;
    }

    // Script will be loaded by react-plaid-link
    // Just mark as loaded after a short delay
    setTimeout(() => {
      plaidScriptLoaded = true;
      plaidScriptLoading = false;
      plaidScriptCallbacks.forEach(cb => cb());
      plaidScriptCallbacks.length = 0;
    }, 100);
  });
}

/**
 * Reset singleton state (useful for testing)
 */
export function resetPlaidScript() {
  plaidScriptLoaded = false;
  plaidScriptLoading = false;
  plaidInstanceCreated = false;
  plaidScriptCallbacks.length = 0;
}
