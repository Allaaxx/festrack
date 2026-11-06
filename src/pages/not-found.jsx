import { Link } from 'react-router';

import { LogoIcon } from '@/assets/images';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center">
        <Link
          to="/"
          aria-label="Festrack Home"
          className="mb-6 flex items-center gap-2"
        >
          <LogoIcon className="text-primary h-10 w-10" />
          <span className="text-xl font-bold tracking-tight">Festrack</span>
        </Link>
        <span className="text-primary text-7xl font-extrabold tracking-tight">
          404
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          O endereço que você tentou acessar não existe, foi removido ou está
          temporariamente indisponível.
        </p>
        <Button
          nativeButton={false}
          render={<Link to="/" />}
          className="mt-6"
          size="lg"
        >
          Voltar para o início
        </Button>
      </div>
    </main>
  );
};

export default NotFoundPage;
