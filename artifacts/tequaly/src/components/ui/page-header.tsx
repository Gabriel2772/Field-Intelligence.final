import { ReactNode } from "react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-border pb-5 sm:mb-8 sm:pb-6 md:flex md:items-end md:justify-between md:gap-8">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="mb-3 flex max-w-full items-center overflow-x-auto whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            aria-label="Navegação estrutural"
          >
            {breadcrumbs.map((bc, i) => (
              <div key={`${bc.label}-${i}`} className="flex items-center">
                {bc.href ? (
                  <Link href={bc.href} className="min-h-11 content-center transition-colors hover:text-primary">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{bc.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="mx-2 text-border">/</span>}
              </div>
            ))}
          </nav>
        )}
        <div className="mb-3 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
        <h1 className="break-words text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="mt-5 flex w-full flex-wrap items-center gap-2 [&>*]:min-h-12 sm:w-auto md:mt-0">
          {actions}
        </div>
      )}
    </header>
  );
}
