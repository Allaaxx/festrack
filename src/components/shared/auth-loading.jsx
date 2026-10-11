import { Loader2Icon } from 'lucide-react';

const AuthLoading = ({ message = 'Carregando...' }) => {
  return (
    <div
      data-testid="auth-loading"
      role="status"
      aria-label={message}
      className="bg-background flex h-screen w-screen items-center justify-center"
    >
      <Loader2Icon className="text-primary size-8 animate-spin" />
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default AuthLoading;
