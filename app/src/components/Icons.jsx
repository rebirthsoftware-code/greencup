// Lucide-benzeri hafif SVG ikon seti (sadece kullanılanlar)
const I = ({ children, size = 22, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);
export const Home = (p) => <I {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></I>;
export const Users = (p) => <I {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21.5 19a4.5 4.5 0 0 0-5-4.4"/></I>;
export const User = (p) => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I>;
export const UserPlus = (p) => <I {...p}><circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0"/><path d="M19 8v6M16 11h6"/></I>;
export const Box = (p) => <I {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></I>;
export const Wallet = (p) => <I {...p}><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor"/></I>;
export const More = (p) => <I {...p}><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></I>;
export const Bell = (p) => <I {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/></I>;
export const ChevronLeft = (p) => <I {...p}><path d="m15 5-7 7 7 7"/></I>;
export const ChevronRight = (p) => <I {...p}><path d="m9 5 7 7-7 7"/></I>;
export const ChevronDown = (p) => <I {...p}><path d="m6 9 6 6 6-6"/></I>;
export const Search = (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>;
export const Phone = (p) => <I {...p}><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></I>;
export const MapPin = (p) => <I {...p}><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></I>;
export const Clock = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I>;
export const Calendar = (p) => <I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></I>;
export const Truck = (p) => <I {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></I>;
export const Receipt = (p) => <I {...p}><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6M9 16h4"/></I>;
export const Cash = (p) => <I {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 10v4M18 10v4"/></I>;
export const Card = (p) => <I {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></I>;
export const Bank = (p) => <I {...p}><path d="m3 9 9-5 9 5H3zM5 9v8M10 9v8M14 9v8M19 9v8M3 21h18"/></I>;
export const Target = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></I>;
export const Plus = (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>;
export const Check = (p) => <I {...p}><path d="m5 12 5 5 9-10"/></I>;
export const FileText = (p) => <I {...p}><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></I>;
export const Note = (p) => <I {...p}><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/></I>;
export const ArrowUp = (p) => <I {...p}><path d="M12 19V5m0 0-6 6m6-6 6 6"/></I>;
export const ArrowDown = (p) => <I {...p}><path d="M12 5v14m0 0-6-6m6 6 6-6"/></I>;
export const Settings = (p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></I>;
export const BarChart = (p) => <I {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></I>;
export const Building = (p) => <I {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></I>;
export const Cloud = (p) => <I {...p}><path d="M7 18a4 4 0 0 1-.6-7.95A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z"/></I>;
export const Info = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></I>;
export const Lock = (p) => <I {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></I>;
export const Trash = (p) => <I {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></I>;
export const Cup = (p) => <I {...p}><path d="M5 4h12l-1.5 16h-9z"/><path d="M17 8h2a2 2 0 0 1 0 4h-2.5"/></I>;
export const Edit = (p) => <I {...p}><path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16z"/><path d="m13 7 4 4"/></I>;
export const X = (p) => <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>;
