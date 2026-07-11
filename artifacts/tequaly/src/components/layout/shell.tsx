import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  LayoutDashboard,
  HardHat,
  MapPin,
  AlertTriangle,
  CalendarCheck,
  FileText,
  Box,
  FileSignature,
  LineChart,
  CheckSquare,
  AlertOctagon,
  History,
  LogOut,
  Menu,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeviceContext } from "@/hooks/use-device-context";
import { tequalyLogoDark } from "@/brand/logo";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Obras", href: "/obras", icon: HardHat },
  { title: "Visitas", href: "/visitas", icon: MapPin },
  { title: "RNCs", href: "/rncs", icon: AlertTriangle },
  { title: "Compromissos", href: "/compromissos", icon: CalendarCheck },
  { title: "Documentos", href: "/documentos", icon: FileText },
  { title: "Ativos", href: "/ativos", icon: Box },
  { title: "Contratos", href: "/contratos", icon: FileSignature },
  { title: "KPIs", href: "/kpis", icon: LineChart },
  { title: "Conciliações", href: "/conciliacoes", icon: CheckSquare },
  { title: "Exceções", href: "/excecoes", icon: AlertOctagon },
  { title: "Audit Log", href: "/audit-log", icon: History },
];

const mobileNavItems = [
  { title: "Início", href: "/", icon: LayoutDashboard },
  { title: "Visitas", href: "/visitas", icon: MapPin },
  { title: "RNCs", href: "/rncs", icon: AlertTriangle },
  { title: "Ativos", href: "/ativos", icon: Box },
];

function isRouteActive(location: string, href: string) {
  return location === href || (href !== "/" && location.startsWith(href));
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const device = useDeviceContext();

  useEffect(() => setIsMobileOpen(false), [location]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.viewportClass = device.viewportClass;
    root.dataset.pointerType = device.pointerType;
    root.dataset.displayMode = device.displayMode;
    root.dataset.orientation = device.orientation;
  }, [device]);

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email?.[0]?.toUpperCase() || "U";

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const active = isRouteActive(location, item.href);
        return (
          <Link key={item.href} href={item.href} className="block">
            <span
              className={cn(
                "group flex min-h-12 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                active
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-4 w-4",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span>{item.title}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  const UserPanel = () => (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={user?.profileImage || ""} />
          <AvatarFallback className="bg-primary/20 font-mono text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="truncate font-mono text-xs uppercase text-muted-foreground">
            {user?.role || "Operador"}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="min-h-12 w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </>
  );

  return (
    <div
      className="flex min-h-[100dvh] bg-background"
      data-viewport={device.viewportClass}
      data-pointer={device.pointerType}
      data-display-mode={device.displayMode}
    >
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex xl:w-72">
        <div className="flex min-h-20 items-center px-5 py-4">
          <img
            src={tequalyLogoDark}
            alt="Tequaly"
            className="h-10 w-auto max-w-[190px] object-contain object-left"
          />
        </div>
        <ScrollArea className="flex-1 px-4">
          <NavLinks />
        </ScrollArea>
        <div className="mt-auto p-4">
          <Separator className="mb-4 bg-border" />
          <UserPanel />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-5 lg:hidden">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-12 min-w-12"
                aria-label="Abrir menu principal"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <img
              src={tequalyLogoDark}
              alt="Tequaly"
              className="h-8 w-auto max-w-[150px] object-contain object-left"
            />
            <span className="ml-auto rounded-full border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
              {device.viewportClass}
            </span>
          </header>

          <SheetContent
            side="left"
            className="flex w-[min(88vw,22rem)] flex-col p-0"
          >
            <SheetHeader className="border-b border-border p-5 text-left">
              <SheetTitle>
                <img
                  src={tequalyLogoDark}
                  alt="Tequaly"
                  className="h-10 w-auto max-w-[180px] object-contain object-left"
                />
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4 py-4">
              <NavLinks />
            </ScrollArea>
            <div className="mt-auto border-t border-border bg-muted/20 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <UserPanel />
            </div>
          </SheetContent>
        </Sheet>

        <main className="relative flex-1 overflow-auto bg-background/50 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#6C07750a_1px,transparent_1px),linear-gradient(to_bottom,#6C07750a_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative z-10 h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label="Navegação principal móvel"
        >
          {mobileNavItems.map((item) => {
            const active = isRouteActive(location, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir mais opções"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
