import { memo } from "react";

// ================= Building ================= //
export const Building = memo(
  ({
    className = "w-7 h-7 z-10 transition-colors duration-200",
  }: {
    className?: string;
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    </svg>
  ),
);

// =============== Bolt =============== //
export const Bolt = memo(
  ({
    className = "w-7 h-7 z-10 transition-colors duration-200",
  }: {
    className?: string;
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
      />
    </svg>
  ),
);

// ===================== Payment ===================== //
export const Payment = memo(
  ({
    className = "w-7 h-7 z-10 transition-colors duration-200",
  }: {
    className?: string;
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
      />
    </svg>
  ),
);

// ===================== BarChart ===================== //
export const BarChart = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
    />
  </svg>
));

// ===================== FileText ===================== //
export const FileText = memo(({ className }: { className?: string }) => (
  <svg
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"
    />
  </svg>
));

// ===================== Chat ===================== //
export const Chat = memo(
  ({
    className = "w-7 h-7 z-10 transition-colors duration-200",
  }: {
    className?: string;
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      />
    </svg>
  ),
);

// ===================== Pin ===================== //
export const Pin = memo(({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
));

// ===================== Save ===================== //
export const Save = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7.558 3.75H7.25a3.5 3.5 0 0 0-3.5 3.5v9.827a3.173 3.173 0 0 0 3.173 3.173v0m.635-16.5v2.442a2 2 0 0 0 2 2h2.346a2 2 0 0 0 2-2V3.75m-6.346 0h6.346m0 0h.026a3 3 0 0 1 2.122.879l3.173 3.173a3.5 3.5 0 0 1 1.025 2.475v6.8a3.173 3.173 0 0 1-3.173 3.173v0m-10.154 0V15a3 3 0 0 1 3-3h4.154a3 3 0 0 1 3 3v5.25m-10.154 0h10.154"
      />
    </svg>
  ),
);

// ===================== ShieldX ===================== //
export const ShieldX = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 1024 1024"
      className={className}
    >
      <path
        fill="currentColor"
        d="M907.952 144.48a63.997 63.997 0 0 0-43.663-17.217c-1.472 0-2.943.065-4.4.16c-.912.065-11.184.689-27.28.689c-26.656 0-78.688-1.808-127.969-13.936c-63.664-15.631-137.12-88.16-158.496-102.464A63.959 63.959 0 0 0 510.576.93a64.186 64.186 0 0 0-35.536 10.752c-2.592 1.744-79.504 84.032-154.752 102.496C271.04 126.305 218 128.113 191.376 128.113c-16.096 0-26.369-.624-27.376-.689a62.314 62.314 0 0 0-4.225-.16A64.186 64.186 0 0 0 116 144.544c-12.945 12.096-20.32 29.008-20.32 46.72v160.032c0 591.632 387.12 667.808 403.567 670.783a65.614 65.614 0 0 0 11.313 1.008c3.776 0 7.6-.336 11.312-1.008c16.432-2.976 406.4-79.151 406.4-670.783V191.264a63.811 63.811 0 0 0-20.32-46.784zm-43.647 206.816c0 544.912-353.714 607.777-353.714 607.777s-350.88-62.88-350.88-607.776V191.265s12.096.848 31.68.848c33.568 0 90.032-2.464 144.16-15.776C424.175 154.593 510.575 64.93 510.575 64.93s90.256 89.664 178.784 111.408c54.192 13.312 109.68 15.776 143.249 15.776c19.568 0 31.68-.848 31.68-.848s.016 20.352.016 160.031h.001zm-216.706-5.055c-12.496-12.496-32.769-12.496-45.249 0l-90.512 90.512l-90.511-90.512c-12.497-12.496-32.769-12.496-45.265 0s-12.496 32.769 0 45.249l90.512 90.512l-90.512 90.511c-12.496 12.48-12.496 32.753 0 45.25s32.769 12.496 45.265 0l90.511-90.512l90.512 90.511c12.48 12.497 32.753 12.497 45.249 0s12.496-32.768 0-45.249l-90.512-90.511L647.6 391.49c12.496-12.48 12.496-32.753 0-45.249z"
      />
    </svg>
  ),
);

// ===================== History ===================== //
export const History = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M22.5 12c0-5.799-4.701-10.5-10.5-10.5c-1.798 0-3.493.453-4.975 1.251A10.55 10.55 0 0 0 3.5 5.834V2.5h-2v7h7v-2H4.787a8.545 8.545 0 0 1 3.187-2.988A8.458 8.458 0 0 1 12 3.5a8.5 8.5 0 1 1-8.454 9.396l-.104-.995l-1.989.209l.104.994C2.11 18.384 6.573 22.5 12 22.5c5.799 0 10.5-4.701 10.5-10.5ZM11 6v6.414l3.5 3.5l1.414-1.414L13 11.586V6h-2Z"
      />
    </svg>
  ),
);

// ===================== MoreVertical ===================== //
export const MoreVertical = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        fill="currentColor"
        d="M10 6.5A1.75 1.75 0 1 1 10 3a1.75 1.75 0 0 1 0 3.5ZM10 17a1.75 1.75 0 1 1 0-3.5a1.75 1.75 0 0 1 0 3.5Zm-1.75-7a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 0 0-3.5 0Z"
      />
    </svg>
  ),
);

// ===================== Chrome ===================== //
export const Chrome = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M21.17 8H12M3.95 6.06L8.54 14m2.34 7.94L15.46 14" />
    </svg>
  ),
);

// ===================== Github ===================== //
export const Github = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        fill="currentColor"
        d="M20 10.25c0 2.234-.636 4.243-1.908 6.027c-1.271 1.784-2.914 3.018-4.928 3.703c-.234.045-.406.014-.514-.093a.539.539 0 0 1-.163-.4V16.67c0-.863-.226-1.495-.677-1.895a8.72 8.72 0 0 0 1.335-.24c.394-.107.802-.28 1.223-.52a3.66 3.66 0 0 0 1.055-.888c.282-.352.512-.819.69-1.402c.178-.583.267-1.252.267-2.008c0-1.077-.343-1.994-1.028-2.75c.32-.81.286-1.717-.105-2.723c-.243-.08-.594-.03-1.054.147a6.94 6.94 0 0 0-1.198.587l-.495.32a9.03 9.03 0 0 0-2.5-.346a9.03 9.03 0 0 0-2.5.347a11.52 11.52 0 0 0-.553-.36c-.23-.143-.593-.314-1.088-.514c-.494-.2-.868-.26-1.12-.18c-.381 1.005-.412 1.912-.09 2.722c-.686.756-1.03 1.673-1.03 2.75c0 .756.09 1.423.268 2.002c.178.578.406 1.045.683 1.401a3.53 3.53 0 0 0 1.048.894c.421.24.83.414 1.224.52c.395.108.84.188 1.335.241c-.347.32-.56.779-.638 1.375a2.539 2.539 0 0 1-.586.2a3.597 3.597 0 0 1-.742.067c-.287 0-.57-.096-.853-.287c-.282-.192-.523-.47-.723-.834a2.133 2.133 0 0 0-.631-.694c-.256-.178-.471-.285-.645-.32l-.26-.04c-.182 0-.308.02-.378.06c-.07.04-.09.09-.065.153a.738.738 0 0 0 .117.187a.961.961 0 0 0 .17.16l.09.066c.192.09.38.259.567.508c.187.249.324.476.41.68l.13.307c.113.338.304.612.574.821c.269.21.56.343.872.4c.312.058.614.09.905.094c.29.004.532-.011.723-.047l.299-.053c0 .338.002.734.007 1.188l.006.72c0 .16-.056.294-.17.4c-.112.108-.286.139-.52.094c-2.014-.685-3.657-1.92-4.928-3.703C.636 14.493 0 12.484 0 10.25c0-1.86.447-3.574 1.341-5.145a10.083 10.083 0 0 1 3.64-3.73A9.6 9.6 0 0 1 10 0a9.6 9.6 0 0 1 5.02 1.375a10.083 10.083 0 0 1 3.639 3.73C19.553 6.675 20 8.391 20 10.25Z"
      />
    </svg>
  ),
);

// ===================== ShieldAlert ===================== //
export const ShieldAlert = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 22s8-4 8-10V5l-8-3l-8 3v7c0 6 8 10 8 10zm0-14v4m0 4h.01"
      />
    </svg>
  ),
);

// ===================== Zap ===================== //
export const Zap = memo(({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13.058 2.577l-7.941 10.74a.612.612 0 0 0-.068.597a.543.543 0 0 0 .188.235a.468.468 0 0 0 .273.084h5.986l-.907 7.023a.243.243 0 0 0 .027.135a.21.21 0 0 0 .094.09c.04.02.083.024.125.013a.2.2 0 0 0 .107-.07l7.941-10.741a.612.612 0 0 0 .068-.597a.544.544 0 0 0-.188-.234a.468.468 0 0 0-.273-.085h-5.986l.907-7.023a.243.243 0 0 0-.027-.135a.21.21 0 0 0-.094-.09a.183.183 0 0 0-.125-.013a.199.199 0 0 0-.107.07"
    />
  </svg>
));

// ===================== ShieldCheck ===================== //
export const ShieldCheck = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      className={className}
    >
      <path
        fill="currentColor"
        d="m8.533.133l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682c-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667l5.25-1.68a1.748 1.748 0 0 1 1.066 0Zm-.61 1.429l.001.001l-5.25 1.68a.251.251 0 0 0-.174.237V7c0 1.36.275 2.666 1.057 3.859c.784 1.194 2.121 2.342 4.366 3.298a.196.196 0 0 0 .154 0c2.245-.957 3.582-2.103 4.366-3.297C13.225 9.666 13.5 8.358 13.5 7V3.48a.25.25 0 0 0-.174-.238l-5.25-1.68a.25.25 0 0 0-.153 0ZM11.28 6.28l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.749.749 0 0 1 .326-1.275a.749.749 0 0 1 .734.215l.97.97l2.97-2.97a.751.751 0 0 1 1.042.018a.751.751 0 0 1 .018 1.042Z"
      />
    </svg>
  ),
);

// ===================== Books ===================== //
export const Books = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 48 48"
      className={className}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        d="M5 6h34s4 2 4 7s-4 7-4 7H5s4-2 4-7s-4-7-4-7Zm38 22H9s-4 2-4 7s4 7 4 7h34s-4-2-4-7s4-7 4-7Z"
      />
    </svg>
  ),
);

// ===================== Paperclip ===================== //
export const Paperclip = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="m18.1 12.4l-6.2 6.2c-1.7 1.7-4.4 1.7-6 0c-1.7-1.7-1.7-4.4 0-6l8-8c1-.9 2.5-.9 3.5 0c1 1 1 2.6 0 3.5L10.5 15c-.3.3-.8.3-1.1 0c-.3-.3-.3-.8 0-1.1l5.1-5.1c.4-.4.4-1 0-1.4c-.4-.4-1-.4-1.4 0L8 12.6c-1.1 1.1-1.1 2.8 0 3.9c1.1 1 2.8 1 3.9 0l6.9-6.9c1.8-1.8 1.8-4.6 0-6.4c-1.8-1.8-4.6-1.8-6.4 0l-8 8c-1.2 1.2-1.8 2.8-1.8 4.4c0 3.5 2.8 6.2 6.3 6.2c1.7 0 3.2-.7 4.4-1.8l6.2-6.2c.4-.4.4-1 0-1.4s-1-.4-1.4 0z"
      />
    </svg>
  ),
);

// ===================== Send ===================== //
export const Send = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 14 14"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M11.688.103a1.724 1.724 0 0 1 2.208 2.208L10.39 12.816a1.72 1.72 0 0 1-1.242 1.137a1.7 1.7 0 0 1-1.619-.462L5.716 11.69l-1.89.976a.625.625 0 0 1-.911-.571l.08-3.132L.5 6.467a1.7 1.7 0 0 1-.466-1.542A1.72 1.72 0 0 1 1.17 3.61l.005-.002zm.69 1.157a.47.47 0 0 0-.286.026L1.572 4.793a.47.47 0 0 0-.31.363l-.003.014a.45.45 0 0 0 .123.412l1.95 1.948l6.33-4.177a.5.5 0 0 1 .616.783L4.225 9.8l-.033 1.27l1.355-.7a.625.625 0 0 1 .728.111l2.138 2.127l.006.006a.45.45 0 0 0 .433.124l.008-.002a.47.47 0 0 0 .342-.312v-.002l3.511-10.516l.007-.02a.47.47 0 0 0-.342-.626"
        clipRule="evenodd"
      />
    </svg>
  ),
);

// ===================== LifeBuoy ===================== //
export const LifeBuoy = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 256 256"
      className={className}
    >
      <path
        fill="currentColor"
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm39.1 131.79a47.84 47.84 0 0 0 0-55.58l28.5-28.49a87.83 87.83 0 0 1 0 112.56ZM96 128a32 32 0 1 1 32 32a32 32 0 0 1-32-32Zm88.28-67.6l-28.49 28.5a47.84 47.84 0 0 0-55.58 0L71.72 60.4a87.83 87.83 0 0 1 112.56 0ZM60.4 71.72l28.5 28.49a47.84 47.84 0 0 0 0 55.58l-28.5 28.49a87.83 87.83 0 0 1 0-112.56ZM71.72 195.6l28.49-28.5a47.84 47.84 0 0 0 55.58 0l28.49 28.5a87.83 87.83 0 0 1-112.56 0Z"
      />
    </svg>
  ),
);

// ===================== Filter ===================== //
export const Filter = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M9 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2zM6.17 5a3.001 3.001 0 0 1 5.66 0H19a1 1 0 1 1 0 2h-7.17a3.001 3.001 0 0 1-5.66 0H5a1 1 0 0 1 0-2h1.17zM15 11a1 1 0 1 0 0 2a1 1 0 0 0 0-2zm-2.83 0a3.001 3.001 0 0 1 5.66 0H19a1 1 0 1 1 0 2h-1.17a3.001 3.001 0 0 1-5.66 0H5a1 1 0 1 1 0-2h7.17zM9 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2zm-2.83 0a3.001 3.001 0 0 1 5.66 0H19a1 1 0 1 1 0 2h-7.17a3.001 3.001 0 0 1-5.66 0H5a1 1 0 1 1 0-2h1.17z"
      />
    </svg>
  ),
);

// ===================== Search ===================== //
export const Search = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        fill="currentColor"
        d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33l-1.42 1.42l-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"
      />
    </svg>
  ),
);

// ===================== Crown ===================== //
export const Crown = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 256 256"
      className={className}
    >
      <path
        fill="currentColor"
        d="M243.84 76.19a12.08 12.08 0 0 0-13.34-1.7l-50.21 25l-41.92-69.63a12.11 12.11 0 0 0-20.74 0L75.71 99.52l-50.19-25a12.11 12.11 0 0 0-16.9 14.6l37 113.36a8 8 0 0 0 11.68 4.4c.25-.15 25.82-14.88 70.7-14.88s70.45 14.73 70.68 14.87a8 8 0 0 0 11.71-4.39l37-113.33a12.06 12.06 0 0 0-3.55-12.96ZM198 188.83c-12-5.09-35.92-12.83-70-12.83s-58 7.74-70 12.83L26.71 93l45.07 22.47a12.17 12.17 0 0 0 15.78-4.59L128 43.66l40.44 67.2a12.18 12.18 0 0 0 15.77 4.59L229.29 93Zm-22.13-32a8 8 0 0 1-7.87 6.61a8.36 8.36 0 0 1-1.4-.12a228.2 228.2 0 0 0-77.22 0a8 8 0 0 1-2.78-15.76a244.42 244.42 0 0 1 82.78 0a8 8 0 0 1 6.5 9.24Z"
      />
    </svg>
  ),
);

// ===================== Support ===================== //
export const Support = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 512 512"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M422.401 217.174c-6.613-67.84-46.72-174.507-170.666-174.507c-123.947 0-164.054 106.667-170.667 174.507c-23.2 8.805-38.503 31.079-38.4 55.893v29.867c0 32.99 26.744 59.733 59.733 59.733c32.99 0 59.734-26.744 59.734-59.733v-29.867c-.108-24.279-14.848-46.095-37.334-55.253c4.267-39.254 25.174-132.48 126.934-132.48s122.453 93.226 126.72 132.48c-22.44 9.178-37.106 31.009-37.12 55.253v29.867a59.95 59.95 0 0 0 33.92 53.76c-8.96 16.853-31.787 39.68-87.894 46.506c-11.215-17.03-32.914-23.744-51.788-16.023c-18.873 7.72-29.646 27.717-25.71 47.725s21.48 34.432 41.872 34.432a42.67 42.67 0 0 0 37.973-23.68c91.52-10.454 120.747-57.6 129.92-85.334c24.817-8.039 41.508-31.301 41.173-57.386v-29.867c.103-24.814-15.2-47.088-38.4-55.893m-302.933 85.76c0 9.425-7.641 17.066-17.067 17.066s-17.066-7.64-17.066-17.066v-29.867a17.067 17.067 0 1 1 34.133 0zm264.533-29.867c0-9.426 7.641-17.067 17.067-17.067s17.067 7.641 17.067 17.067v29.867c0 9.425-7.641 17.066-17.067 17.066s-17.067-7.64-17.067-17.066z"
      />
    </svg>
  ),
);

// ===================== Star ===================== //
export const Star = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M22 9.67a1 1 0 0 0-.86-.67l-5.69-.83L12.9 3a1 1 0 0 0-1.8 0L8.55 8.16L2.86 9a1 1 0 0 0-.81.68a1 1 0 0 0 .25 1l4.13 4l-1 5.68a1 1 0 0 0 .4 1a1 1 0 0 0 1.05.07L12 18.76l5.1 2.68a.93.93 0 0 0 .46.12a1 1 0 0 0 .59-.19a1 1 0 0 0 .4-1l-1-5.68l4.13-4A1 1 0 0 0 22 9.67Zm-6.15 4a1 1 0 0 0-.29.89l.72 4.19l-3.76-2a1 1 0 0 0-.94 0l-3.76 2l.72-4.19a1 1 0 0 0-.29-.89l-3-3l4.21-.61a1 1 0 0 0 .76-.55L12 5.7l1.88 3.82a1 1 0 0 0 .76.55l4.21.61Z"
      />
    </svg>
  ),
);

// ===================== Tag ===================== //
export const Tag = memo(({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    className={className}
  >
    <g fill="none">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20.162 10.926L13.716 4.48a2.5 2.5 0 0 0-1.767-.732h-5.2a3 3 0 0 0-3 3v5.2a2.5 2.5 0 0 0 .731 1.768l6.445 6.446a4 4 0 0 0 5.657 0l1.79-1.79l1.79-1.79a4 4 0 0 0 0-5.657"
      />
      <circle
        cx="7.738"
        cy="7.738"
        r="1.277"
        fill="currentColor"
        transform="rotate(-45 7.738 7.738)"
      />
    </g>
  </svg>
));

export const Play = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
  ),
);

// ===================== ChartUp ===================== //
export const ChartUp = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M21 21H4a1 1 0 0 1-1-1V3h2v16h16v2ZM8.373 16L7 14.656L11.856 9.9a.985.985 0 0 1 1.373 0l2.227 2.181L19.627 8L21 9.344L16.144 14.1a.985.985 0 0 1-1.373 0l-2.228-2.182L8.374 16h-.001Z"
      />
    </svg>
  ),
);

// ===================== Wallet ===================== //
export const Wallet = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      >
        <path d="M7.269 11.515c5.969-3.1 13.564-5.96 20.65-7.703c2.073-.51 4.215.257 5.293 2.099c.77 1.316 1.71 3.12 2.704 5.478m-6.852 19.734c.095 2.13 1.737 3.717 3.866 3.802c1.085.044 2.434.075 4.07.075s2.985-.031 4.07-.075c2.13-.085 3.771-1.672 3.866-3.802c.038-.867.064-1.904.064-3.123s-.026-2.256-.064-3.123c-.095-2.13-1.737-3.717-3.866-3.802A102 102 0 0 0 37 21c-1.636 0-2.985.031-4.07.075c-2.13.085-3.771 1.672-3.866 3.802A71 71 0 0 0 29 28c0 1.22.026 2.256.064 3.123" />
        <path d="M40.874 21.067a119 119 0 0 0-.293-5.012c-.208-2.551-2.189-4.47-4.742-4.647C32.899 11.204 28.363 11 22 11s-10.9.204-13.84.408c-2.552.176-4.533 2.096-4.741 4.647C3.204 18.689 3 22.613 3 28s.204 9.31.419 11.945c.208 2.551 2.189 4.47 4.742 4.647C11.1 44.796 15.637 45 22 45s10.9-.204 13.839-.408c2.553-.176 4.534-2.096 4.742-4.647c.109-1.333.215-2.996.293-5.012M36 27v2" />
      </g>
    </svg>
  ),
);

// ===================== Video ===================== //
export const Video = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M3 4.5h5.5A1.5 1.5 0 0 1 10 6v4a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 10V6A1.5 1.5 0 0 1 3 4.5m8.452 6.037A3 3 0 0 1 8.5 13H3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h5.5a3 3 0 0 1 2.952 2.463l1.554-1.11A1.893 1.893 0 0 1 16 5.893v4.214a1.893 1.893 0 0 1-2.994 1.54zm.048-1.809l2.378 1.699a.393.393 0 0 0 .622-.32V5.893a.393.393 0 0 0-.622-.32L11.5 7.272z"
        clipRule="evenodd"
      />
    </svg>
  ),
);

// ===================== Lock ===================== //
export const Lock = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <g fill="none">
        <path
          stroke="currentColor"
          strokeWidth="2"
          d="M4 13c0-1.886 0-2.828.586-3.414C5.172 9 6.114 9 8 9h8c1.886 0 2.828 0 3.414.586C20 10.172 20 11.114 20 13v2c0 2.828 0 4.243-.879 5.121C18.243 21 16.828 21 14 21h-4c-2.828 0-4.243 0-5.121-.879C4 19.243 4 17.828 4 15z"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          d="M16 8V7a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v1"
        />
        <circle cx="12" cy="15" r="2" fill="currentColor" />
      </g>
    </svg>
  ),
);

// ===================== Pause ===================== //
export const Pause = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
));

// ===================== Rewind ===================== //
export const Rewind = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
  </svg>
));

// ===================== Forward ===================== //
export const Forward = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
));

// ===================== VolumeHigh ===================== //
export const VolumeHigh = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
));

// ===================== VolumeLow ===================== //
export const VolumeLow = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 9v6h4l5 5V4L7 9H3zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
));

// ===================== Mute ===================== //
export const Mute = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3z" />
  </svg>
));

// ===================== Fullscreen ===================== //
export const Fullscreen = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
));

// ===================== Ebook ===================== //
export const Ebook = memo(({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12v5c0 1.886 0 2.828-.586 3.414C18.828 21 17.886 21 16 21H6.5a2.5 2.5 0 0 1 0-5H16c1.886 0 2.828 0 3.414-.586C20 14.828 20 13.886 20 12V7c0-1.886 0-2.828-.586-3.414C18.828 3 17.886 3 16 3H8c-1.886 0-2.828 0-3.414.586C4 4.172 4 5.114 4 7v11.5" />
      <path strokeLinecap="round" d="M9 8h6" />
    </g>
  </svg>
));

// ===================== Projects ===================== //
export const Projects = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 512 512"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m256 34.347l192 110.851v221.703L256 477.752L64 366.901V145.198zM106.666 192.001v150.266l128 73.9V265.902zm298.667.001l-128 73.9v150.265l128-73.9zM256 83.614l-125.867 72.67L256 228.952l125.867-72.67z"
      />
    </svg>
  ),
);

// ===================== IdCard ===================== //
export const IdCard = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 32 32"
      className={className}
    >
      <path
        fill="currentColor"
        d="M5 6C3.355 6 2 7.355 2 9v14c0 1.645 1.355 3 3 3h22c1.645 0 3-1.355 3-3V9c0-1.645-1.355-3-3-3zm0 2h22c.566 0 1 .434 1 1v14c0 .566-.434 1-1 1H5c-.566 0-1-.434-1-1V9c0-.566.434-1 1-1zm6 2c-2.2 0-4 1.8-4 4c0 1.113.477 2.117 1.219 2.844A5.036 5.036 0 0 0 6 21h2c0-1.668 1.332-3 3-3s3 1.332 3 3h2a5.036 5.036 0 0 0-2.219-4.156C14.523 16.117 15 15.114 15 14c0-2.2-1.8-4-4-4zm7 1v2h8v-2zm-7 1c1.117 0 2 .883 2 2s-.883 2-2 2s-2-.883-2-2s.883-2 2-2zm7 3v2h8v-2zm0 4v2h5v-2z"
      />
    </svg>
  ),
);

// ===================== FingerPrint ===================== //
export const FingerPrint = memo(
  ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M2 11C2 5.477 6.477 1 12 1s10 4.477 10 10v3c0 2.64-.57 5.15-1.592 7.412l-.413.911l-1.822-.824l.412-.911A15.938 15.938 0 0 0 20 14v-3a8 8 0 1 0-16 0v3H2v-3Zm4.5 0a5.5 5.5 0 1 1 11 0v3c0 2.8-.853 5.403-2.314 7.56l-.561.829l-1.656-1.122l.56-.828A11.442 11.442 0 0 0 15.5 14v-3a3.5 3.5 0 1 0-7 0v3A4.5 4.5 0 0 1 4 18.5H2v-2h2A2.5 2.5 0 0 0 6.5 14v-3Zm6.5-1v4c0 3.39-1.875 6.34-4.639 7.874l-.874.486l-.97-1.75l.874-.484A6.998 6.998 0 0 0 11 14v-4h2Z"
      />
    </svg>
  ),
);

// ================ Display Name ================ //
Building.displayName = "Building";
Bolt.displayName = "Bolt";
Payment.displayName = "Payment";
BarChart.displayName = "BarChart";
FileText.displayName = "FileText";
Chat.displayName = "Chat";
Pin.displayName = "Pin";
Save.displayName = "Save";
ShieldX.displayName = "ShieldX";
History.displayName = "History";
MoreVertical.displayName = "MoreVertical";
Chrome.displayName = "Chrome";
Github.displayName = "Github";
ShieldAlert.displayName = "ShieldAlert";
Zap.displayName = "Zap";
ShieldCheck.displayName = "ShieldCheck";
Books.displayName = "Books";
Paperclip.displayName = "Paperclip";
Send.displayName = "Send";
LifeBuoy.displayName = "LifeBuoy";
Support.displayName = "Support";
Star.displayName = "Star";
Tag.displayName = "Tag";
Play.displayName = "Play";
ChartUp.displayName = "ChartUp";
Wallet.displayName = "Wallet";
Video.displayName = "Video";
Lock.displayName = "Lock";
Pause.displayName = "Pause";
Rewind.displayName = "Rewind";
Forward.displayName = "Forward";
VolumeHigh.displayName = "VolumeHigh";
VolumeLow.displayName = "VolumeLow";
Mute.displayName = "Mute";
Fullscreen.displayName = "Fullscreen";
Ebook.displayName = "Ebook";
Projects.displayName = "Projects";
IdCard.displayName = "IdCard";
FingerPrint.displayName = "FingerPrint";
