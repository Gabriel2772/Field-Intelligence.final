import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@workspace/replit-auth-web';
import { Shell } from '@/components/layout/shell';
import Login from '@/pages/login';

// Pages
import Dashboard from '@/pages/dashboard';
import ObrasList from '@/pages/obras/index';
import ObraDetail from '@/pages/obras/detail';
import VisitasList from '@/pages/visitas/index';
import VisitaDetail from '@/pages/visitas/detail';
import RncsList from '@/pages/rncs/index';
import RncDetail from '@/pages/rncs/detail';
import CompromissosList from '@/pages/compromissos/index';
import DocumentosList from '@/pages/documentos/index';
import AtivosList from '@/pages/ativos/index';
import ContratosList from '@/pages/contratos/index';
import KpisList from '@/pages/kpis/index';
import ConciliacoesList from '@/pages/conciliacoes/index';
import ExcecoesList from '@/pages/excecoes/index';
import AuditLogList from '@/pages/audit-log/index';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/obras" component={ObrasList} />
        <Route path="/obras/:id" component={ObraDetail} />
        <Route path="/visitas" component={VisitasList} />
        <Route path="/visitas/:id" component={VisitaDetail} />
        <Route path="/rncs" component={RncsList} />
        <Route path="/rncs/:id" component={RncDetail} />
        <Route path="/compromissos" component={CompromissosList} />
        <Route path="/documentos" component={DocumentosList} />
        <Route path="/ativos" component={AtivosList} />
        <Route path="/contratos" component={ContratosList} />
        <Route path="/kpis" component={KpisList} />
        <Route path="/conciliacoes" component={ConciliacoesList} />
        <Route path="/excecoes" component={ExcecoesList} />
        <Route path="/audit-log" component={AuditLogList} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ProtectedRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
