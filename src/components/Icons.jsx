// Minimal stroke icons — 16px grid, 1.5 stroke weight
const Icon = ({ children, size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);

export const IcPlay     = (p) => <Icon {...p}><path d="M4 3l9 5-9 5V3z" fill="currentColor" stroke="none"/></Icon>;
export const IcStop     = (p) => <Icon {...p}><rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" stroke="none"/></Icon>;
export const IcSave     = (p) => <Icon {...p}><path d="M3 3h8l2 2v8H3V3z"/><path d="M5 3v4h6V3"/><path d="M5 10h6"/></Icon>;
export const IcBranch   = (p) => <Icon {...p}><circle cx="4" cy="3" r="1.4"/><circle cx="4" cy="13" r="1.4"/><circle cx="12" cy="6" r="1.4"/><path d="M4 4.4v7.2"/><path d="M4 7c0 2 2 2.5 4.5 2.5S12 8 12 7.4"/></Icon>;
export const IcCommit   = (p) => <Icon {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v4"/><path d="M8 10.5v4"/></Icon>;
export const IcDb       = (p) => <Icon {...p}><ellipse cx="8" cy="3.5" rx="5" ry="1.8"/><path d="M3 3.5v9c0 1 2.2 1.8 5 1.8s5-.8 5-1.8v-9"/><path d="M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8"/></Icon>;
export const IcFolder   = (p) => <Icon {...p}><path d="M1.5 4a1 1 0 011-1h3l1.5 1.5h6.5a1 1 0 011 1V12a1 1 0 01-1 1h-11a1 1 0 01-1-1V4z"/></Icon>;
export const IcFile     = (p) => <Icon {...p}><path d="M3 2h6l3 3v9H3V2z"/><path d="M9 2v3h3"/></Icon>;
export const IcSearch   = (p) => <Icon {...p}><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></Icon>;
export const IcCheck    = (p) => <Icon {...p}><path d="M3 8l3.5 3.5L13 5"/></Icon>;
export const IcX        = (p) => <Icon {...p}><path d="M3 3l10 10"/><path d="M13 3L3 13"/></Icon>;
export const IcPlus     = (p) => <Icon {...p}><path d="M8 3v10"/><path d="M3 8h10"/></Icon>;
export const IcChevron  = (p) => <Icon {...p}><path d="M6 4l4 4-4 4"/></Icon>;
export const IcChevDn   = (p) => <Icon {...p}><path d="M4 6l4 4 4-4"/></Icon>;
export const IcMonitor  = (p) => <Icon {...p}><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M5 14h6"/><path d="M8 11.5V14"/></Icon>;
export const IcHistory  = (p) => <Icon {...p}><path d="M2 8a6 6 0 106-6"/><path d="M2 3v3h3"/><path d="M8 5v3l2 2"/></Icon>;
export const IcSpark    = (p) => <Icon {...p}><path d="M8 2v4M8 10v4M2 8h4M10 8h4"/></Icon>;
export const IcAlert    = (p) => <Icon {...p}><path d="M8 2l6.5 11H1.5L8 2z"/><path d="M8 6v3"/><circle cx="8" cy="11" r=".5" fill="currentColor"/></Icon>;
export const IcDiff     = (p) => <Icon {...p}><path d="M5 2v12"/><path d="M11 2v12"/><path d="M3 5h4"/><path d="M9 11h4"/></Icon>;
export const IcCopy     = (p) => <Icon {...p}><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 10V4a1 1 0 011-1h6"/></Icon>;
export const IcTable    = (p) => <Icon {...p}><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 7h12"/><path d="M6 3v10"/></Icon>;
export const IcSettings = (p) => <Icon {...p}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></Icon>;
export const IcUser     = (p) => <Icon {...p}><circle cx="8" cy="6" r="2.5"/><path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4"/></Icon>;
export const IcEye      = (p) => <Icon {...p}><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></Icon>;
export const IcBolt     = (p) => <Icon {...p}><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" fill="currentColor" stroke="none"/></Icon>;
