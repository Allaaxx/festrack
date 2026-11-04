import {
  AlertCircleIcon,
  AlertTriangleIcon,
  Loader2Icon,
  StoreIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { LogoIcon } from '@/assets/images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  getRoleLabel,
  useAcceptShopInvitation,
  useGetInvitationByToken,
} from '@/features/shops';

const isInvitationInvalidOrExpired = (invitation, isError) => {
  if (isError || !invitation) return true;
  const status = invitation.status?.toUpperCase?.();
  if (status && status !== 'PENDING') return true;
  const expiresAt = invitation.expires_at || invitation.expiresAt;
  if (expiresAt) {
    const expiresTime = new Date(expiresAt).getTime();
    if (!Number.isNaN(expiresTime) && expiresTime < Date.now()) {
      return true;
    }
  }
  return false;
};

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isInitializing, signout } = useAuthContext();
  const { setActiveShop } = useShopContext();
  const {
    data: invitation,
    isLoading,
    isError,
  } = useGetInvitationByToken(token);
  const acceptMutation = useAcceptShopInvitation();
  const [acceptError, setAcceptError] = useState(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const isPageLoading = isInitializing || isLoading;
  const isInvalidOrExpired =
    !isPageLoading && isInvitationInvalidOrExpired(invitation, isError);
  const shopName =
    invitation?.shop?.name ||
    invitation?.shop_name ||
    invitation?.shopName ||
    'Loja';
  const shopDescription =
    invitation?.shop?.description || invitation?.shop_description || null;
  const roleLabel = getRoleLabel(invitation?.role);

  const isEmailMatch = Boolean(
    user?.email &&
    invitation?.email &&
    user.email.trim().toLowerCase() === invitation.email.trim().toLowerCase()
  );

  const handleAcceptInvitation = async () => {
    setAcceptError(null);
    try {
      const response = await acceptMutation.mutateAsync(token);
      const joinedShopId =
        response?.shop_id ||
        response?.shopId ||
        invitation?.shop?.id ||
        invitation?.shop_id ||
        invitation?.shopId;
      const joinedRole = response?.role || invitation?.role || 'MEMBER';

      if (joinedShopId) {
        setActiveShop({
          id: joinedShopId,
          name: shopName,
          description: shopDescription,
          role: joinedRole,
        });
      }

      toast.add({
        type: 'success',
        title: 'Convite aceito com sucesso!',
        description: `Você agora faz parte da loja ${shopName}.`,
      });

      navigate('/finances', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível aceitar o convite. Tente novamente.';
      setAcceptError(message);
      toast.add({
        type: 'error',
        title: 'Erro ao aceitar convite',
        description: message,
      });
    }
  };

  const handleSwitchAccount = async () => {
    setIsSwitchingAccount(true);
    try {
      await signout();
    } finally {
      setIsSwitchingAccount(false);
      navigate('/signin', { state: { from: location }, replace: true });
    }
  };

  return (
    <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center p-6">
      <div className="mb-6 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-2 font-medium">
          <div className="text-primary flex h-6 w-6 items-center justify-center rounded-md">
            <LogoIcon className="size-4" />
          </div>
          <span className="text-lg font-semibold">Festrack</span>
        </Link>
      </div>

      <Card className="w-full max-w-md">
        {isPageLoading ? (
          <CardContent
            data-testid="invitation-loading"
            className="flex flex-col items-center justify-center gap-3 py-10"
          >
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Carregando detalhes do convite...
            </p>
          </CardContent>
        ) : isInvalidOrExpired ? (
          <>
            <CardHeader className="text-center">
              <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-10 items-center justify-center rounded-lg">
                <AlertCircleIcon className="size-5" />
              </div>
              <CardTitle>Convite inválido ou expirado</CardTitle>
              <CardDescription>
                O link de convite que você acessou não é válido, expirou ou foi
                revogado pelo proprietário da loja.
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<Link to="/" />}
              >
                Voltar para o início
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-10 items-center justify-center rounded-lg">
                <StoreIcon className="size-5" />
              </div>
              <CardTitle>Convite para participar de uma loja</CardTitle>
              <CardDescription>
                Você foi convidado para colaborar no espaço de trabalho abaixo.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{shopName}</span>
                  <Badge variant="secondary">{roleLabel}</Badge>
                </div>
                {shopDescription && (
                  <p className="text-muted-foreground text-xs">
                    {shopDescription}
                  </p>
                )}
                <div className="text-muted-foreground pt-1 text-xs">
                  <span>Destinatário: </span>
                  <span className="text-foreground font-medium">
                    {invitation?.email}
                  </span>
                </div>
              </div>

              {acceptError && (
                <div
                  role="alert"
                  className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs"
                >
                  <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                  <span>{acceptError}</span>
                </div>
              )}

              {user && !isEmailMatch && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300"
                >
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      E-mail incompatível com o convite
                    </p>
                    <p>
                      Este convite foi enviado para{' '}
                      <span className="font-semibold">{invitation?.email}</span>
                      , mas você está conectado como{' '}
                      <span className="font-semibold">{user.email}</span>.
                    </p>
                  </div>
                </div>
              )}

              {!user && (
                <p className="text-muted-foreground text-center text-sm">
                  Para aceitar este convite, entre na sua conta ou crie uma nova
                  conta usando o e-mail convidado.
                </p>
              )}
            </CardContent>

            {!user && (
              <CardFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="w-full sm:flex-1"
                  nativeButton={false}
                  render={<Link to="/signin" state={{ from: location }} />}
                >
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1"
                  nativeButton={false}
                  render={<Link to="/signup" state={{ from: location }} />}
                >
                  Criar conta
                </Button>
              </CardFooter>
            )}

            {user && isEmailMatch && (
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleAcceptInvitation}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending && (
                    <Loader2Icon className="animate-spin" />
                  )}
                  Aceitar Convite
                </Button>
              </CardFooter>
            )}

            {user && !isEmailMatch && (
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSwitchAccount}
                  disabled={isSwitchingAccount}
                >
                  {isSwitchingAccount && (
                    <Loader2Icon className="animate-spin" />
                  )}
                  Trocar de conta
                </Button>
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
