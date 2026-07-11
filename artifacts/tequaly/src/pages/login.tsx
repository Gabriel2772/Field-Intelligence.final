import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, RadioTower } from "lucide-react";
import { tequalyLogoDark } from "@/brand/logo";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(108,7,117,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(108,7,117,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary" />

      <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-7xl items-stretch lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between border-border px-6 py-8 sm:px-10 lg:border-r lg:px-14 lg:py-12">
          <img
            src={tequalyLogoDark}
            alt="Tequaly Técnica Industrial"
            className="h-12 w-auto max-w-[230px] object-contain object-left sm:h-14"
          />

          <div className="my-14 max-w-2xl lg:my-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <RadioTower className="h-3.5 w-3.5 text-primary" />
              Operação e auditoria em campo
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Inteligência de Campo
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Evidências, visitas, não conformidades, ativos e indicadores em uma única visão operacional da Tequaly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <span>Ambiente corporativo</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Release visual 2.1</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Central de supervisão
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Autentique-se com sua conta autorizada para acessar os dados operacionais e a trilha de auditoria.
            </p>

            <Button
              onClick={login}
              className="mt-8 min-h-12 w-full justify-between px-5 text-sm font-semibold uppercase tracking-[0.1em]"
            >
              Entrar no sistema
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              Acesso restrito. Todas as ações relevantes são registradas para fins de auditoria.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
