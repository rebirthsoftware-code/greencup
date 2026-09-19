import { useEffect, useState } from 'react';

/** Yeni sürüm kurulduğunda küçük bir şerit: dokununca sayfa yenilenir. */
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const on = () => setReady(true);
    window.addEventListener('gc-update-ready', on);
    return () => window.removeEventListener('gc-update-ready', on);
  }, []);
  if (!ready) return null;
  return (
    <div className="update-banner" role="status">
      <span>Yeni sürüm hazır.</span>
      <button onClick={() => window.location.reload()}>Yenile</button>
    </div>
  );
}
