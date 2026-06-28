"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { logout } from "@/app/actions/auth";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { useUser } from "./user-provider";
import {
  Book,
  Chart,
  ClipboardCheck,
  Clock,
  EyePreview,
  Grid,
  Logout,
  Menu,
  Settings,
  User,
  Users,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  href: string;
  label: string;
  Icon: Icon;
  /** Shortcut links never take the active highlight. */
  noActive?: boolean;
  /** Renders a form button invoking the logout server action instead of a link. */
  action?: "logout";
}

interface NavGroup {
  items: NavItem[];
  label?: string;
}

const STUDENT_NAV: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Beranda", Icon: Grid },
      { href: "/courses", label: "Mata Kuliah", Icon: Book },
      { href: "/me/results", label: "Nilai Saya", Icon: Chart },
      { href: "/me/profile", label: "Profil", Icon: User },
    ],
  },
  {
    label: "Pintasan",
    items: [
      {
        href: "/courses/kimia-dasar/termokimia",
        label: "Lanjut belajar",
        Icon: Clock,
        noActive: true,
      },
    ],
  },
];

const STUDENT_FOOT: NavItem[] = [
  { href: "/login", label: "Keluar", Icon: Logout, noActive: true, action: "logout" },
];

const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dasbor", Icon: Grid },
      { href: "/admin/courses", label: "Mata Kuliah", Icon: Book },
      { href: "/admin/students", label: "Siswa", Icon: Users },
      { href: "/admin/enrollments", label: "Pendaftaran", Icon: ClipboardCheck },
      { href: "/admin/gradebook", label: "Buku Nilai", Icon: Chart },
      { href: "/admin/settings", label: "Pengaturan", Icon: Settings },
    ],
  },
];

const ADMIN_FOOT: NavItem[] = [
  { href: "/dashboard", label: "Lihat sebagai siswa", Icon: EyePreview, noActive: true },
  { href: "/login", label: "Keluar", Icon: Logout, noActive: true, action: "logout" },
];

export interface AppShellProps {
  variant?: "student" | "admin";
  crumb: ReactNode;
  /** Extra class on .content, e.g. "narrow". */
  contentClassName?: string;
  avatar?: { initials: string; name: string };
  children: ReactNode;
}

export function AppShell({
  variant = "student",
  crumb,
  contentClassName,
  avatar,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const close = () => setNavOpen(false);

  const sessionUser = useUser();
  const groups = variant === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const foot = variant === "admin" ? ADMIN_FOOT : STUDENT_FOOT;
  const av =
    avatar ??
    (sessionUser
      ? { initials: sessionUser.initials, name: sessionUser.fullName }
      : variant === "admin"
        ? { initials: "BM", name: "Bu Maya" }
        : { initials: "ES", name: "Emmil Saputra" });

  const isActive = (item: NavItem) => {
    if (item.noActive) return false;
    if (item.href === "/admin" || item.href === "/dashboard")
      return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const { Icon } = item;
    if (item.action === "logout") {
      return (
        <form action={logout} style={{ display: "contents" }}>
          <button type="submit" className="nav-item" style={{ width: "100%" }}>
            <Icon />
            {item.label}
          </button>
        </form>
      );
    }
    return (
      <Link
        href={item.href}
        className={`nav-item${isActive(item) ? " active" : ""}`}
        onClick={close}
      >
        <Icon />
        {item.label}
      </Link>
    );
  };

  return (
    <div className={`app${navOpen ? " nav-open" : ""}`}>
      <div className="sidebar-scrim" onClick={close} />
      <aside className="sidebar">
        <Brand admin={variant === "admin"} />
        {groups.map((g, gi) => (
          <div key={gi} style={{ display: "contents" }}>
            {g.label ? <div className="nav-label">{g.label}</div> : null}
            {g.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ))}
        <div className="sidebar-foot">
          {foot.map((item) => (
            <NavLink key={item.href + item.label} item={item} />
          ))}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="Menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <Menu />
          </button>
          <span className="crumb">{crumb}</span>
          <span className="spacer" />
          <ThemeToggle />
          <div className="avatar" title={av.name}>
            {av.initials}
          </div>
        </header>

        <div className={`content${contentClassName ? " " + contentClassName : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
