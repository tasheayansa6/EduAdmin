function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function Mark() {
  return <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-sm font-bold text-white">EA</span>;
}

export function GridIcon() {
  return <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon>;
}

export function UsersIcon() {
  return <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3 3 0 0 1 0 5.74" /></Icon>;
}

export function BookIcon() {
  return <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Icon>;
}

export function ClipboardIcon() {
  return <Icon><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></Icon>;
}

export function TrendIcon() {
  return <Icon><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon>;
}

export function ChartIcon() {
  return <Icon><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></Icon>;
}

export function ShieldIcon() {
  return <Icon><path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" /></Icon>;
}

export function PercentIcon() {
  return <Icon><path d="M19 5L5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></Icon>;
}

export function ActivityIcon() {
  return <Icon><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Icon>;
}

export function MenuIcon() {
  return <Icon><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon>;
}

export function CloseIcon() {
  return <Icon><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Icon>;
}

export function UserIcon() {
  return <Icon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="3" /></Icon>;
}

export function LogoutIcon() {
  return <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>;
}

export function SearchIcon() {
  return <Icon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>;
}

export function BellIcon() {
  return <Icon><path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 19a2 2 0 0 0 4 0" /></Icon>;
}

export function PanelLeftIcon() {
  return <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></Icon>;
}

export function SettingsIcon() {
  return <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>;
}

export function ChevronDownIcon() {
  return <Icon><path d="M6 9l6 6 6-6" /></Icon>;
}

export function ChevronRightIcon() {
  return <Icon><path d="M9 6l6 6-6 6" /></Icon>;
}

export function ArrowRightIcon() {
  return <Icon><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Icon>;
}

export function CheckIcon() {
  return <Icon><path d="M5 12.5l4.5 4.5L19 7" /></Icon>;
}

export function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function CartIcon() {
  return <Icon><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.6l2.3 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21.5 7H6" /></Icon>;
}

export function PlayIcon() {
  return <Icon><circle cx="12" cy="12" r="9.5" /><path d="M10 8.5v7l5.5-3.5z" fill="currentColor" /></Icon>;
}

export function ClockIcon() {
  return <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
}

export function LockIcon() {
  return <Icon><rect x="4.5" y="11" width="15" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></Icon>;
}

export function LinkIcon() {
  return <Icon><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Icon>;
}

export function AlertIcon() {
  return <Icon><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L14.7 3.9a2 2 0 0 0-3.4 0z" /></Icon>;
}

export function CompassIcon() {
  return <Icon><circle cx="12" cy="12" r="9" /><path d="m16.2 7.8-2.4 6-6 2.4 2.4-6 6-2.4z" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></Icon>;
}

export function FlameIcon() {
  return <Icon><path d="M12 3c2 3 5 4.5 5 8.2A5 5 0 0 1 7 11.5C7 8 9 6 12 3z" /><path d="M10.5 14.5c0 1.5 1 2.5 1.5 3.5.5-1 1.5-2 1.5-3.5" /></Icon>;
}

export function LeafIcon() {
  return <Icon><path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" /><path d="M5 19c3-3 6-6 9-8" /></Icon>;
}
