import { normalizeUser } from '@/helpers/user';

export const ROLE_LABELS = {
  OWNER: 'Proprietário',
  MEMBER: 'Membro',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || 'Membro';

export const getUserInitials = (userOrName, fallbackEmail = '') => {
  if (!userOrName && !fallbackEmail) return 'U';

  if (typeof userOrName === 'object' && userOrName !== null) {
    const first = userOrName.firstName || userOrName.first_name || '';
    const last = userOrName.lastName || userOrName.last_name || '';
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    const nameStr = userOrName.name || first || '';
    if (nameStr) {
      return getUserInitials(nameStr, userOrName.email || fallbackEmail);
    }
    const emailStr = userOrName.email || fallbackEmail || '';
    if (emailStr) {
      return emailStr.slice(0, 2).toUpperCase();
    }
    return 'U';
  }

  const trimmed = String(userOrName || '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }

  if (fallbackEmail) {
    return String(fallbackEmail).trim().slice(0, 2).toUpperCase();
  }

  return 'U';
};

export const normalizeShopMember = (member) => {
  if (!member) return null;
  const rawUser = member.user || member;
  const normalizedUser = normalizeUser(rawUser);
  const userId =
    member.user_id ?? member.userId ?? member.user?.id ?? member.id;
  const displayName =
    normalizedUser?.name ||
    member.name ||
    normalizedUser?.email ||
    member.email ||
    'Usuário';
  const email = normalizedUser?.email || member.email || '';
  const image = normalizedUser?.image ?? member.image ?? null;
  const role = member.role || 'MEMBER';
  const joinedAt =
    member.joined_at ??
    member.joinedAt ??
    member.created_at ??
    member.createdAt ??
    null;

  return {
    id: member.id ?? userId,
    userId,
    displayName,
    email,
    image,
    initials: getUserInitials(normalizedUser || displayName, email),
    role,
    roleLabel: getRoleLabel(role),
    joinedAt,
    raw: member,
  };
};
