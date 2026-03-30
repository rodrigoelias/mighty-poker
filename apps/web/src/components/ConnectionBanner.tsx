import React, { useState, useEffect } from 'react';
import BpkInfoBanner, {
  ALERT_TYPES,
} from '@skyscanner/backpack-web/bpk-component-info-banner';

const DEBOUNCE_MS = 500;

interface Props {
  connected: boolean;
}

export function ConnectionBanner({ connected }: Props) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (connected) {
      setShowBanner(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [connected]);

  if (!showBanner) return null;

  return (
    <div role="status" className="fixed top-0 left-0 right-0 z-50">
      <BpkInfoBanner
        type={ALERT_TYPES.WARNING}
        message="Reconnecting..."
      />
    </div>
  );
}
