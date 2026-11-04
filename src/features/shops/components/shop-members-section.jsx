import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Loader2Icon,
  MailIcon,
  Trash2Icon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  useGetShopInvitations,
  useGetShopMembers,
  useRemoveShopMember,
  useRevokeShopInvitation,
} from '@/features/shops/api/hooks';
import InviteMemberDialog from '@/features/shops/components/invite-member-dialog';
import {
  copyInvitationLink,
  getRoleLabel,
  normalizeShopMember,
} from '@/features/shops/helpers/member';

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const formatDatePtBr = (dateValue) => {
  if (!dateValue) return '-';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '-';
  return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
};

const RemoveMemberActionCell = ({ member, shopId, onRemoved }) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: removeMember, isPending } = useRemoveShopMember();

  const handleConfirmRemove = async () => {
    try {
      await removeMember({
        shopId,
        userId: member.userId,
      });
      onRemoved?.(member.userId);
      toast.add({
        type: 'success',
        title: 'Membro removido com sucesso!',
        description: `${member.displayName} não possui mais acesso à loja.`,
      });
      setOpen(false);
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Não foi possível remover o membro',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        aria-label={`Remover ${member.displayName}`}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Remover {member.displayName}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Remover membro
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{member.displayName}</strong> ({member.email}) desta loja?
              Esta pessoa perderá o acesso aos eventos e registros financeiros
              imediatamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose
              render={
                <Button variant="outline" disabled={isPending}>
                  Cancelar
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isPending}
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              Sim, remover membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ShopMembersSection = ({ headerAction, children }) => {
  const tableKey = useId();
  const { user } = useAuthContext();
  const { activeShop, role } = useShopContext();
  const isOwner = (activeShop?.role ?? role) === 'OWNER';

  const { data: rawMembers = [], isLoading: isMembersLoading } =
    useGetShopMembers({ shopId: activeShop?.id });

  const { data: rawInvitations = [], isLoading: isInvitationsLoading } =
    useGetShopInvitations({ shopId: activeShop?.id });

  const { mutateAsync: revokeInvitation, isPending: isRevoking } =
    useRevokeShopInvitation();

  const [removedUsersByShop, setRemovedUsersByShop] = useState({});
  const [createdInvitationsByShop, setCreatedInvitationsByShop] = useState({});
  const [revokedInvitationsByShop, setRevokedInvitationsByShop] = useState({});

  const handleMemberRemoved = useCallback(
    (removedUserId) => {
      const currentShopId = activeShop?.id;
      if (!currentShopId || !removedUserId) return;
      setRemovedUsersByShop((prev) => ({
        ...prev,
        [currentShopId]: [...(prev[currentShopId] || []), removedUserId],
      }));
    },
    [activeShop?.id]
  );

  const handleInvitationCreated = (invitation) => {
    const currentShopId = activeShop?.id;
    if (!currentShopId || !invitation) return;
    setCreatedInvitationsByShop((prev) => {
      const existing = prev[currentShopId] || [];
      const filtered = existing.filter(
        (inv) =>
          inv.id !== invitation.id &&
          inv.email?.toLowerCase() !== invitation.email?.toLowerCase()
      );
      return {
        ...prev,
        [currentShopId]: [...filtered, invitation],
      };
    });
    if (invitation.id) {
      setRevokedInvitationsByShop((prev) => ({
        ...prev,
        [currentShopId]: (prev[currentShopId] || []).filter(
          (id) => id !== invitation.id
        ),
      }));
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    const currentShopId = activeShop?.id;
    if (!currentShopId || !invitation?.id) return;
    try {
      await revokeInvitation({
        shopId: currentShopId,
        invitationId: invitation.id,
      });
      setRevokedInvitationsByShop((prev) => ({
        ...prev,
        [currentShopId]: [...(prev[currentShopId] || []), invitation.id],
      }));
      toast.add({
        type: 'success',
        title: 'Convite revogado com sucesso!',
        description: `O convite para ${invitation.email} foi cancelado.`,
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Não foi possível revogar o convite',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    }
  };

  const handleCopyInviteLink = async (invitation) => {
    await copyInvitationLink(invitation?.token, toast);
  };

  const pendingInvitations = useMemo(() => {
    const currentShopId = activeShop?.id;
    const revokedSet = new Set(revokedInvitationsByShop[currentShopId] || []);
    const base = Array.isArray(rawInvitations) ? rawInvitations : [];
    const additional = (createdInvitationsByShop[currentShopId] || []).filter(
      (created) =>
        !base.some(
          (item) =>
            item.id === created.id ||
            item.email?.toLowerCase() === created.email?.toLowerCase()
        )
    );
    return [...base, ...additional].filter(
      (inv) =>
        inv &&
        !revokedSet.has(inv.id) &&
        (!inv.status || inv.status === 'PENDING')
    );
  }, [
    rawInvitations,
    createdInvitationsByShop,
    revokedInvitationsByShop,
    activeShop?.id,
  ]);

  const members = useMemo(() => {
    const removedSet = new Set(removedUsersByShop[activeShop?.id] || []);
    return (Array.isArray(rawMembers) ? rawMembers : [])
      .map(normalizeShopMember)
      .filter((member) => member && !removedSet.has(member.userId));
  }, [rawMembers, removedUsersByShop, activeShop?.id]);

  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: 'displayName',
        accessorKey: 'displayName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Membro
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        ),
        sortFn: (rowA, rowB, columnId) => {
          const a = String(rowA.getValue(columnId) ?? '');
          const b = String(rowB.getValue(columnId) ?? '');
          return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
        },
        cell: ({ row: { original: member } }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {member.image && (
                <AvatarImage src={member.image} alt={member.displayName} />
              )}
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-medium">{member.displayName}</span>
              <span className="text-muted-foreground text-xs">
                {member.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Função
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        ),
        sortFn: (rowA, rowB, columnId) => {
          const a = String(rowA.getValue(columnId) ?? '');
          const b = String(rowB.getValue(columnId) ?? '');
          return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
        },
        cell: ({ row: { original: member } }) => (
          <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
            {member.roleLabel}
          </Badge>
        ),
      },
      {
        id: 'joinedAt',
        accessorKey: 'joinedAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data de entrada
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        ),
        sortFn: (rowA, rowB, columnId) => {
          const a = new Date(rowA.getValue(columnId) ?? 0).getTime() || 0;
          const b = new Date(rowB.getValue(columnId) ?? 0).getTime() || 0;
          return a - b;
        },
        cell: ({ row: { original: member } }) =>
          formatDatePtBr(member.joinedAt),
      },
    ];

    if (isOwner) {
      baseColumns.push({
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row: { original: member } }) => {
          if (member.userId === user?.id) {
            return null;
          }
          return (
            <RemoveMemberActionCell
              member={member}
              shopId={activeShop?.id}
              onRemoved={handleMemberRemoved}
            />
          );
        },
      });
    }

    return baseColumns;
  }, [isOwner, user?.id, activeShop?.id, handleMemberRemoved]);

  const totalPages = Math.max(
    1,
    Math.ceil(members.length / pagination.pageSize)
  );
  const effectivePageIndex = Math.min(
    Math.max(0, pagination.pageIndex),
    Math.max(0, totalPages - 1)
  );

  const table = useTable({
    key: tableKey,
    features,
    data: members,
    columns,
    getRowId: (row, index) => row.id?.toString() ?? index.toString(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination: {
        pageIndex: effectivePageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  const rows = table.getRowModel().rows;
  const currentPage = (table.state.pagination?.pageIndex ?? 0) + 1;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Membros e Convites</h3>
        <p className="text-muted-foreground text-sm">
          Gerencie os membros com acesso à loja e acompanhe os convites
          pendentes.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Membros Ativos</h4>
                <p className="text-muted-foreground text-xs">
                  Pessoas que atualmente colaboram nesta loja.
                </p>
              </div>
              {isOwner &&
                (headerAction ?? (
                  <InviteMemberDialog
                    shopId={activeShop?.id}
                    onSuccess={handleInvitationCreated}
                  />
                ))}
            </div>

            {isMembersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>

                    <TableBody>
                      {rows.length > 0 ? (
                        rows.map((row) => (
                          <TableRow key={row.id} data-testid="shop-member-row">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <UsersIcon className="text-muted-foreground size-6" />
                              <span className="text-muted-foreground text-sm">
                                Nenhum membro encontrado.
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="text-muted-foreground text-xs">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Página anterior"
                    >
                      <ChevronLeftIcon className="size-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Próxima página"
                    >
                      <ChevronRightIcon className="size-4" />
                      <span className="sr-only">Próxima página</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isOwner && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      Convites Pendentes
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      Convites aguardando aceitação pelos membros.
                    </p>
                  </div>

                  {isInvitationsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                  ) : pendingInvitations.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted">
                          <TableRow>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Expira em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingInvitations.map((invitation) => {
                            const expiresAt =
                              invitation.expires_at ?? invitation.expiresAt;
                            return (
                              <TableRow
                                key={invitation.id || invitation.email}
                                data-testid="pending-invitation-row"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                                      <MailIcon className="size-4" />
                                    </div>
                                    <span className="text-sm font-medium">
                                      {invitation.email}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {getRoleLabel(invitation.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {expiresAt
                                    ? `Expira em ${formatDatePtBr(expiresAt)}`
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {invitation.token && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        aria-label={`Copiar link de ${invitation.email}`}
                                        onClick={() =>
                                          handleCopyInviteLink(invitation)
                                        }
                                      >
                                        <CopyIcon className="size-3.5" />
                                        Copiar link
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      aria-label={`Revogar convite de ${invitation.email}`}
                                      disabled={isRevoking}
                                      onClick={() =>
                                        handleRevokeInvitation(invitation)
                                      }
                                    >
                                      <XCircleIcon className="size-3.5" />
                                      Revogar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Nenhum convite pendente no momento.
                    </p>
                  )}
                </div>
              </>
            )}

            {isOwner && children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopMembersSection;
