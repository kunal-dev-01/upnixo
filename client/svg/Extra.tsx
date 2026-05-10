import { memo } from "react";

// ===================== MapPin ===================== //
export const MapPin = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 256 256"
    className={className}
  >
    <path
      fill="currentColor"
      d="M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40Zm0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24Zm0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.19 254.19 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.19 254.19 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88Zm0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118Z"
    />
  </svg>
));

// ===================== Tablet ===================== //
export const Tablet = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </g>
  </svg>
));

// ===================== Laptop ===================== //
export const Laptop = memo(({ className }: { className?: string }) => (
  <svg
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 14.25V4.5A1.5 1.5 0 0 0 19.5 3h-15A1.5 1.5 0 0 0 3 4.5v9.75zm2.12 4.641A1.5 1.5 0 0 1 21.75 21H2.25a1.5 1.5 0 0 1-1.371-2.109L3 14.25h18zM10.5 18h3"
    />
  </svg>
));

// ===================== AlertCircle ===================== //
export const AlertCircle = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    className={className}
  >
    <g fill="none">
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M12 12.438v-5"
      />
      <circle
        cx="1.25"
        cy="1.25"
        r="1.25"
        fill="currentColor"
        transform="matrix(1 0 0 -1 10.75 17.063)"
      />
    </g>
  </svg>
));

// ===================== XCircle ===================== //
export const XCircle = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9l-6 6m0-6l6 6" />
    </g>
  </svg>
));

MapPin.displayName = "MapPin";
Tablet.displayName = "Tablet";
Laptop.displayName = "Laptop";
AlertCircle.displayName = "AlertCircle";
XCircle.displayName = "XCircle";
