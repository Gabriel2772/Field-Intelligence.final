import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-destructive opacity-80" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase">404</h1>
            <h2 className="text-xl font-medium">Page Not Found</h2>
            <p className="text-sm text-muted-foreground uppercase font-mono tracking-widest mt-4">
              The requested resource is unavailable or access is restricted.
            </p>
          </div>
          <Button asChild className="mt-4 font-mono uppercase tracking-widest text-xs">
            <Link href="/">
              Return to Command Center
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}