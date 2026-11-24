/** ReadProof mark: a microphone whose grille is a waveform, with a check, on an ink tile. */
export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="ReadProof">
      <rect width="32" height="32" rx="9" fill="#1F1A33" />
      <rect x="11" y="5.5" width="10" height="15" rx="5" fill="#F6F3FA" />
      <path d="M13.2 13h1.2l1-2.6 1.4 5.2 1-2.6h1.2" fill="none" stroke="#E4503F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 14.5a7.5 7.5 0 0 0 15 0M16 22v3.5M12 26h8" fill="none" stroke="#F6F3FA" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="25" cy="24.8" r="3.7" fill="#2F7A55" stroke="#1F1A33" strokeWidth="1" />
      <path d="M23.5 24.9l1 1 1.9-2" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
