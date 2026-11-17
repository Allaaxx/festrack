import {
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Faz o parse seguro de uma data vinda da API ou do form,
 * sem causar deslocamento de timezone.
 *
 * @param {Date | string | null | undefined} dateValue
 * @returns {Date | null}
 */
export const parseEventDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }
  const str = String(dateValue).trim();

  // Try to match YYYY-MM-DDTHH:mm
  const matchTime = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (matchTime) {
    const [, year, month, day, hour, minute] = matchTime;
    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0
    );
    return isValid(localDate) ? localDate : null;
  }

  // Fallback for just date YYYY-MM-DD
  const matchDate = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchDate) {
    const [, year, month, day] = matchDate;
    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      0,
      0,
      0
    );
    return isValid(localDate) ? localDate : null;
  }

  const parsed = parseISO(str);
  return isValid(parsed) ? parsed : null;
};

/**
 * Extrai a string de hora (HH:mm) de uma data ISO.
 * Retorna '00:00' se não houver ou se não for possível fazer o parse.
 *
 * @param {Date | string | null | undefined} dateValue
 * @returns {string}
 */
export const parseEventTime = (dateValue) => {
  if (!dateValue) return '00:00';
  const str = String(dateValue).trim();
  const match = str.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return '00:00';
};

/**
 * Formata uma data local para o padrão ISO com offset explícito esperado pela API.
 * Se allDay for true, zera o horário ou coloca no final do dia.
 * Se houver timeStr ("HH:mm"), injeta ele.
 *
 * @param {Date | string} dateValue
 * @param {'start' | 'end'} type
 * @param {boolean} allDay
 * @param {string} timeStr
 * @returns {string}
 */
export const formatEventDateToApi = (
  dateValue,
  type = 'start',
  allDay = true,
  timeStr = ''
) => {
  if (!dateValue) return '';
  const date =
    dateValue instanceof Date ? dateValue : parseEventDate(dateValue);
  if (!date || !isValid(date)) return '';

  let hours = type === 'start' ? 0 : 23;
  let minutes = type === 'start' ? 0 : 59;
  const seconds = allDay && type === 'end' ? 59 : 0;

  if (!allDay) {
    let finalTime = timeStr;
    if (!finalTime && dateValue instanceof Date) {
      const dateHours = dateValue.getHours();
      const dateMinutes = dateValue.getMinutes();
      if (dateHours !== 0 || dateMinutes !== 0) {
        finalTime = format(dateValue, 'HH:mm');
      }
    }
    if (finalTime) {
      const [parsedHours, parsedMinutes] = finalTime.split(':').map(Number);
      if (!Number.isNaN(parsedHours) && !Number.isNaN(parsedMinutes)) {
        hours = parsedHours;
        minutes = parsedMinutes;
      }
    }
  }

  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds
  );

  return format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Formata uma data para exibição no padrão dd/MM/yyyy.
 *
 * @param {Date | string | null | undefined} dateValue
 * @returns {string}
 */
export const formatEventDate = (dateValue) => {
  const date = parseEventDate(dateValue);
  if (!date) return '—';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formata o intervalo de datas de um evento.
 * Exemplo: "01/12/2026 até 31/12/2026"
 *
 * @param {Date | string | null | undefined} startDate
 * @param {Date | string | null | undefined} endDate
 * @returns {string}
 */
export const formatEventDateRange = (startDate, endDate) => {
  return `${formatEventDate(startDate)} até ${formatEventDate(endDate)}`;
};

/**
 * Calcula o status temporal de um evento em relação à data atual.
 *
 * @param {{ startDate: Date | string, endDate: Date | string }} event
 * @returns {'scheduled' | 'in_progress' | 'completed'}
 */
export const getEventStatus = (event) => {
  const today = startOfDay(new Date());
  const start = startOfDay(parseEventDate(event.startDate) ?? new Date(0));
  const end = startOfDay(parseEventDate(event.endDate) ?? new Date(0));

  if (isBefore(today, start)) return 'scheduled';
  if (isAfter(today, end)) return 'completed';
  return 'in_progress';
};

export const EVENT_STATUSES = {
  scheduled: {
    key: 'scheduled',
    label: 'Agendado',
    dotClass: 'bg-violet-500',
    badgeClass: 'text-violet-500 fill-violet-500',
    filterClass:
      'border-violet-200 bg-violet-100/50 text-violet-800 hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40',
    calendarClass:
      'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8',
  },
  in_progress: {
    key: 'in_progress',
    label: 'Em andamento',
    dotClass: 'bg-amber-500',
    badgeClass: 'text-amber-500 fill-amber-500',
    filterClass:
      'border-amber-200 bg-amber-100/50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40',
    calendarClass:
      'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8',
  },
  completed: {
    key: 'completed',
    label: 'Finalizado',
    dotClass: 'bg-rose-500',
    badgeClass: 'text-rose-500 fill-rose-500',
    filterClass:
      'border-rose-200 bg-rose-100/50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40',
    calendarClass:
      'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8',
  },
};

/**
 * Mapeia o valor interno do status para o texto em pt-BR.
 *
 * @param {'scheduled' | 'in_progress' | 'completed'} status
 * @returns {string}
 */
export const getEventStatusLabel = (status) => {
  return EVENT_STATUSES[status]?.label ?? '—';
};

/**
 * Normaliza o autor de um evento para exibição uniforme (nome, email, avatar, iniciais).
 * Suporta formatos de objeto (user, creator, author) ou string direta,
 * com fallback inteligente para o usuário autenticado caso o evento pertença a ele ou não tenha autor.
 *
 * @param {Object} event
 * @param {Object} [fallbackUser]
 * @returns {{ name: string, email: string, avatar: string | null, initials: string, hasAuthor: boolean }}
 */
export const normalizeEventAuthor = (event, fallbackUser = null) => {
  const rawAuthor =
    event?.author ??
    event?.creator ??
    event?.user ??
    event?.created_by ??
    event?.createdBy ??
    event?.rawEvent?.author ??
    event?.rawEvent?.creator ??
    event?.rawEvent?.user ??
    event?.rawEvent?.created_by ??
    event?.rawEvent?.createdBy ??
    event?.rawEvent?.created_by_user_name ??
    (event?.firstName ||
    event?.lastName ||
    (event?.name && !event?.title && !event?.startDate) ||
    event?.email
      ? event
      : null);

  if (rawAuthor) {
    if (typeof rawAuthor === 'string') {
      const trimmed = rawAuthor.trim();
      const parts = trimmed.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : (trimmed.slice(0, 2) || '—').toUpperCase();
      return {
        name: trimmed || 'Membro',
        email: '',
        avatar: null,
        initials,
        hasAuthor: Boolean(trimmed),
      };
    }

    const firstName = String(
      rawAuthor.firstName ?? rawAuthor.first_name ?? ''
    ).trim();
    const lastName = String(
      rawAuthor.lastName ?? rawAuthor.last_name ?? ''
    ).trim();
    const joinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const rawName = String(rawAuthor.name ?? '').trim();
    const email = String(rawAuthor.email ?? '').trim();
    const avatar = rawAuthor.image || rawAuthor.avatar || null;

    const name =
      rawName || joinedName || (email ? email.split('@')[0] : '') || 'Membro';
    const hasAuthor = Boolean(rawName || joinedName || email || avatar);

    let initials = '—';
    if (firstName && lastName) {
      initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else {
      const parts = (rawName || joinedName || email.split('@')[0] || '')
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length >= 2) {
        initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      } else if (parts.length === 1 && parts[0]) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    }

    return {
      name,
      email,
      avatar,
      initials,
      hasAuthor,
    };
  }

  // Se houver fallbackUser disponível
  if (fallbackUser) {
    const createdByUserId =
      event?.createdByUserId ??
      event?.created_by_user_id ??
      event?.rawEvent?.createdByUserId ??
      event?.rawEvent?.created_by_user_id ??
      event?.user_id ??
      event?.rawEvent?.user_id;

    if (createdByUserId && createdByUserId === fallbackUser.id) {
      return normalizeEventAuthor(fallbackUser);
    }
  }

  return {
    name: 'Membro',
    email: '',
    avatar: null,
    initials: '—',
    hasAuthor: false,
  };
};

/**
 * Mapeia um evento do domínio para o formato esperado pelo EventCalendar.
 *
 * @param {{ id: string, name: string, description: string | null, startDate: string | Date, endDate: string | Date, allDay?: boolean }} event
 * @returns {{ id: string, title: string, description: string | null, start: Date, end: Date, allDay: boolean, color: string, rawEvent: any }}
 */
export const mapEventToCalendarItem = (event) => {
  const start = parseEventDate(event.startDate) ?? new Date();
  const end = parseEventDate(event.endDate) ?? start;
  const status = getEventStatus(event);

  return {
    id: event.id,
    title: event.name,
    description: event.description ?? event.rawEvent?.description ?? null,
    author: event.author ?? event.creator ?? event.user ?? null,
    creator: event.creator ?? null,
    user: event.user ?? null,
    createdByUserId:
      event.createdByUserId ??
      event.created_by_user_id ??
      event.rawEvent?.createdByUserId ??
      event.rawEvent?.created_by_user_id ??
      null,
    tag: event.tag ?? null,
    start,
    end,
    allDay: event.allDay ?? false,
    color: status,
    rawEvent: event,
  };
};
