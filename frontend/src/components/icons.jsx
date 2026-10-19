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

export function AlertIcon() {
  return <Icon><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L14.7 3.9a2 2 0 0 0-3.4 0z" /></Icon>;
}
