import type { SVGProps } from "react";

export type IconName =
  | "overview"
  | "ladder"
  | "learners"
  | "report"
  | "wave"
  | "book"
  | "settings"
  | "search"
  | "chevron-right"
  | "chevron-down"
  | "arrow-left"
  | "arrow-right"
  | "check"
  | "close"
  | "plus"
  | "minus"
  | "mic"
  | "camera"
  | "stop"
  | "play"
  | "download"
  | "trash"
  | "copy"
  | "clock"
  | "calendar"
  | "spark"
  | "alert"
  | "menu"
  | "edit"
  | "users"
  | "refresh";

const paths: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </>
  ),
  ladder: (
    <>
      <path d="M4 20V16h4v-5h4V6h4V3h4" />
      <path d="M4 20h16" />
    </>
  ),
  learners: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.5-5.6 5.5-5.6s5.5 2.4 5.5 5.6" />
      <path d="M16 5.4a3 3 0 0 1 0 5.8" />
      <path d="M17.2 14.9c2 .5 3.3 2.3 3.3 4.6" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v4h4" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </>
  ),
  wave: (
    <>
      <path d="M3 12v2" />
      <path d="M7 8v8" />
      <path d="M11 4v16" />
      <path d="M15 7v10" />
      <path d="M19 10v4" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.8c2.7-.9 5.3-.9 8 .6 2.7-1.5 5.3-1.5 8-.6v14.2c-2.7-.9-5.3-.9-8 .6-2.7-1.5-5.3-1.5-8-.6V4.8Z" />
      <path d="M12 5.4v14.2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m16 16 4.2 4.2" />
    </>
  ),
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  "chevron-down": <path d="m5 9 7 7 7-7" />,
  "arrow-left": (
    <>
      <path d="M20 12H4" />
      <path d="m10 6-6 6 6 6" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </>
  ),
  minus: <path d="M4 12h16" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8.5 21h7" />
    </>
  ),
  camera: (
    <>
      <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="1.8" />,
  play: <path d="M8 4.5 20 12 8 19.5v-15Z" />,
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  spark: (
    <path d="M12 2.5c.7 5.4 1.6 6.3 7 7-5.4.7-6.3 1.6-7 7-.7-5.4-1.6-6.3-7-7 5.4-.7 6.3-1.6 7-7Z" />
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17.2v.1" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 1-5L16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 2Z" />
      <path d="m14.5 5.5 3.5 3.5" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M5.5 8.5A7.5 7.5 0 0 1 19 9" />
      <path d="M18.5 15.5A7.5 7.5 0 0 1 5 15" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 16, filled = false, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled || name === "spark" ? "currentColor" : "none"}
      stroke={name === "spark" ? "none" : "currentColor"}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
