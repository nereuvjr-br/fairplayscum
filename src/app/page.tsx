import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Next.js 15 + Shadcn UI + Tailwind CSS v4
          </h1>
          <p className="text-xl text-muted-foreground">
            Projeto configurado com as tecnologias mais recentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Next.js 15</CardTitle>
              <CardDescription>
                Framework React com App Router e Server Components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Aproveite os recursos mais recentes do Next.js, incluindo Turbopack e React 19.
              </p>
              <Button className="w-full">
                Explorar Next.js
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shadcn UI</CardTitle>
              <CardDescription>
                Componentes reutilizáveis e customizáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Biblioteca de componentes moderna com design system consistente.
              </p>
              <Button variant="outline" className="w-full">
                Ver Componentes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailwind CSS v4</CardTitle>
              <CardDescription>
                Framework CSS utilitário de nova geração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Estilização rápida e eficiente com a versão mais recente do Tailwind.
              </p>
              <Button variant="secondary" className="w-full">
                Aprender Tailwind
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>🚀 Projeto Pronto!</CardTitle>
            <CardDescription>
              Sua aplicação está configurada e pronta para desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button size="lg" className="w-full">
                Começar a Desenvolver
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                Ver Documentação
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Execute <code className="bg-muted px-2 py-1 rounded">npm run dev</code> para iniciar o servidor de desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
