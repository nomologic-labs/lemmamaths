/*
 * The complete icon set. Every icon is a 24-unit stroked path on the same grid with the
 * same 1.5 stroke weight, so they sit together without looking borrowed from different
 * places. Icons are decorative by default; the control around them carries the label.
 */

type IconProps = { size?: number; className?: string };

function Icon({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8L20.5 20.5" />
  </Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 14.5A8.2 8.2 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </Icon>
);

export const SystemIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="4.5" width="19" height="12.5" rx="1.5" />
    <path d="M8.5 20.5h7" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />
  </Icon>
);

export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4.5v14M6.5 13l5.5 5.5L17.5 13" />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
    <path d="M15 6.5A2.5 2.5 0 0012.5 4h-6A2.5 2.5 0 004 6.5v6A2.5 2.5 0 006.5 15" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const ReviewedIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6z" />
    <path d="M9 12l2 2 4-4.5" />
  </Icon>
);

export const EditorialIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6z" />
    <path d="M9.5 12.5h5" />
  </Icon>
);

export const InReviewIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const FilterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 6.5h17M6.5 12h11M10 17.5h4" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);

export const DashboardIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="4.5" width="7" height="4" rx="1.5" />
    <rect x="3.5" y="14.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="8" rx="1.5" />
  </Icon>
);
