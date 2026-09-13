export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? "brand-compact" : ""}`} aria-label="KemitVPN">
      <svg className="brand-mark" viewBox="0 0 54 54" aria-hidden="true">
        <path d="M11 8v38M12 31 39 7M22 23l21 23" />
        <circle cx="45" cy="25" r="4.5" />
      </svg>
      {!compact && <span><strong>Kemit</strong><small>VPN</small></span>}
    </span>
  );
}
