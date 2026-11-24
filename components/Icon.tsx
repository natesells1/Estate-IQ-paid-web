const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v5M16 3v5",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  check: "M5 12.5 10 17l9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7",
  gavel: "m14 5 5 5M11 8l5 5M12.5 6.5l5 5-3 3-5-5zM9.5 12.5 4 18l2 2 5.5-5.5M4 21h9",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
};

export function Icon({ name, size = 18, stroke = 1.8 }: { name: keyof typeof PATHS | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function LogoMark() {
  return (
    <span className="logo-mark">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11 12 4l8 7v9h-5v-5H9v5H4z" />
      </svg>
    </span>
  );
}
