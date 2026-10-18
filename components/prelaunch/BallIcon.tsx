/** Shared vector artwork; no document-wide SVG symbol IDs or DOM injection. */
export default function BallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#d8f03c" stroke="#15130f" strokeWidth="4" />
      <path d="M13 22C35 40 35 60 13 78M87 22C65 40 65 60 87 78" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
