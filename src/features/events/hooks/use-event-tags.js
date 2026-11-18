import { useCallback, useMemo } from 'react';

import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import {
  useCreateEventTag,
  useDeleteEventTag,
  useGetEventTags,
} from '@/features/events/api/hooks';
import { TAG_COLOR_PALETTE } from '@/features/events/constants';
import {
  findTagOption,
  normalizeTagOption,
  toTagSlug,
} from '@/features/events/helpers/event';

/**
 * Picks the first free color from TAG_COLOR_PALETTE not currently used by existing tags.
 * If all colors are in use, repeats from the beginning of the palette.
 *
 * @param {Array<Object>} existingTags Array of tag option objects
 * @returns {string} Tailwind background color class
 */
export function getNextTagColor(existingTags = []) {
  const usedColors = new Set(
    existingTags.map((opt) => opt.dotClass || opt.color).filter(Boolean)
  );
  const freeColor = TAG_COLOR_PALETTE.find((color) => !usedColors.has(color));
  if (freeColor) {
    return freeColor;
  }
  return TAG_COLOR_PALETTE[existingTags.length % TAG_COLOR_PALETTE.length];
}

/**
 * Hook for managing shop-scoped event tags (fetching, normalization, creation, and deletion).
 *
 * @param {Object} [options={}] Optional overrides such as explicit shopId or serverTags.
 * @returns {{ shopId: string | undefined, tagOptions: Array<Object>, addTag: Function, removeTag: Function }}
 */
export function useEventTags(options = {}) {
  const shopContext = useShopContext?.();
  const shopId =
    options.shopId !== undefined ? options.shopId : shopContext?.activeShop?.id;

  const { data: serverTags } = useGetEventTags();
  const createTagMutation = useCreateEventTag();
  const deleteTagMutation = useDeleteEventTag();

  const tagOptions = useMemo(() => {
    const rawTags = options.serverTags || options.tagOptions || serverTags;
    return Array.isArray(rawTags) && rawTags.length > 0
      ? rawTags.map(normalizeTagOption)
      : [];
  }, [options.serverTags, options.tagOptions, serverTags]);

  const addTag = useCallback(
    async (name) => {
      if (typeof name !== 'string') return;
      const trimmed = name.trim();
      if (!trimmed) return;

      const slug = toTagSlug(trimmed);
      const existing = tagOptions.find(
        (opt) =>
          opt.value?.toLowerCase() === slug.toLowerCase() ||
          opt.label?.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      const payload = {
        name: trimmed,
        color: getNextTagColor(tagOptions),
        slug,
        ...(shopId ? { shopId } : {}),
      };

      try {
        const created =
          typeof createTagMutation?.mutateAsync === 'function'
            ? await createTagMutation.mutateAsync(payload)
            : typeof createTagMutation?.mutate === 'function'
              ? await new Promise((resolve, reject) => {
                  createTagMutation.mutate(payload, {
                    onSuccess: resolve,
                    onError: reject,
                  });
                })
              : undefined;

        return created ? normalizeTagOption(created) : undefined;
      } catch {
        toast.add({
          type: 'error',
          title: 'Erro ao criar etiqueta',
          description: 'Não foi possível criar a etiqueta. Tente novamente.',
        });
        return false;
      }
    },
    [tagOptions, createTagMutation, shopId]
  );

  const removeTag = useCallback(
    (value, id) => {
      const targetTag =
        findTagOption(tagOptions, value) ||
        (id ? tagOptions.find((opt) => opt.id === id) : undefined);

      const targetId = id || targetTag?.id;
      if (targetId) {
        deleteTagMutation?.mutate?.({
          tagId: targetId,
          ...(shopId ? { shopId } : {}),
        });
      }

      return targetTag?.value || value;
    },
    [tagOptions, deleteTagMutation, shopId]
  );

  return {
    shopId,
    tagOptions,
    addTag,
    removeTag,
  };
}
