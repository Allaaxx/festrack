import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { getShopsQueryKey, useGetShops } from '@/features/shops';

const getStoredActiveShopId = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY) || null;
  } catch {
    return null;
  }
};

const setStoredActiveShopId = (shopId) => {
  try {
    if (shopId) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY, shopId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY);
    }
  } catch {
    // Ignora falhas de acesso ao localStorage
  }
};

export const UNPROVIDED_SHOP_CONTEXT = Symbol(
  'festrack.shopContext.unprovided'
);

export const ShopContext = createContext({
  shops: [],
  activeShop: null,
  role: null,
  isLoading: false,
  setActiveShop: () => {},
  removeShop: () => {},
  updateShop: () => {},
  [UNPROVIDED_SHOP_CONTEXT]: true,
});

export const useShopContext = () => useContext(ShopContext);

export const ShopContextProvider = ({ children }) => {
  const { user } = useAuthContext();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { data: fetchedShops, isLoading } = useGetShops();

  const [selectedShopId, setSelectedShopId] = useState(() =>
    getStoredActiveShopId()
  );
  const [createdShops, setCreatedShops] = useState([]);
  const [removedShops, setRemovedShops] = useState([]);
  const [updatedShops, setUpdatedShops] = useState([]);

  const shops = useMemo(() => {
    if (!userId) return [];
    const removedIds = new Set(
      removedShops
        .filter((entry) => entry.userId === userId)
        .map((entry) => entry.shopId)
    );
    const patchesByShopId = new Map(
      updatedShops
        .filter((entry) => entry.userId === userId && entry.shopId)
        .map((entry) => [entry.shopId, entry.patch])
    );

    const base = Array.isArray(fetchedShops) ? fetchedShops : [];
    const baseIds = new Set(base.map((shop) => shop.id));
    const additional = createdShops
      .filter(
        (entry) =>
          entry.userId === userId &&
          entry.shop?.id &&
          !baseIds.has(entry.shop.id)
      )
      .map((entry) => entry.shop);

    return [...base, ...additional]
      .filter((shop) => !removedIds.has(shop.id))
      .map((shop) => {
        const patch = patchesByShopId.get(shop.id);
        return patch ? { ...shop, ...patch } : shop;
      });
  }, [fetchedShops, createdShops, removedShops, updatedShops, userId]);

  const activeShop = useMemo(() => {
    if (!shops.length) return null;
    const targetShopId = selectedShopId ?? getStoredActiveShopId();
    if (targetShopId) {
      const matched = shops.find((shop) => shop.id === targetShopId);
      if (matched) return matched;
    }
    return shops[0];
  }, [shops, selectedShopId]);

  useEffect(() => {
    if (activeShop?.id) {
      setStoredActiveShopId(activeShop.id);
    } else if (!isLoading && userId && shops.length === 0) {
      setStoredActiveShopId(null);
    }
  }, [activeShop?.id, isLoading, userId, shops.length]);

  const setActiveShop = useCallback(
    (shopOrId) => {
      if (!shopOrId) return;

      const nextShopId =
        typeof shopOrId === 'string' ? shopOrId : (shopOrId?.id ?? null);

      if (!nextShopId) return;

      setRemovedShops((prev) =>
        prev.filter(
          (entry) => !(entry.userId === userId && entry.shopId === nextShopId)
        )
      );

      if (typeof shopOrId === 'object' && shopOrId.name) {
        const normalizedShop = {
          ...shopOrId,
          role: shopOrId.role || 'OWNER',
        };
        setCreatedShops((prev) => {
          const filtered = prev.filter(
            (entry) =>
              !(entry.userId === userId && entry.shop?.id === normalizedShop.id)
          );
          return [...filtered, { userId, shop: normalizedShop }];
        });
        queryClient.setQueryData(
          getShopsQueryKey({ userId }),
          (previous = []) => {
            if (!Array.isArray(previous)) return [normalizedShop];
            const exists = previous.some(
              (item) => item.id === normalizedShop.id
            );
            return exists
              ? previous.map((item) =>
                  item.id === normalizedShop.id ? normalizedShop : item
                )
              : [...previous, normalizedShop];
          }
        );
      }

      setSelectedShopId(nextShopId);
      setStoredActiveShopId(nextShopId);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'getShops',
      });
    },
    [queryClient, userId]
  );

  const removeShop = useCallback(
    (shopOrId) => {
      const targetShopId =
        typeof shopOrId === 'string' ? shopOrId : (shopOrId?.id ?? null);
      if (!targetShopId) return;

      setRemovedShops((prev) => {
        const exists = prev.some(
          (entry) => entry.userId === userId && entry.shopId === targetShopId
        );
        return exists ? prev : [...prev, { userId, shopId: targetShopId }];
      });

      setCreatedShops((prev) =>
        prev.filter(
          (entry) =>
            !(entry.userId === userId && entry.shop?.id === targetShopId)
        )
      );

      queryClient.setQueryData(
        getShopsQueryKey({ userId }),
        (previous = []) => {
          if (!Array.isArray(previous)) return [];
          return previous.filter((item) => item.id !== targetShopId);
        }
      );

      setSelectedShopId((prev) => {
        const currentStored = getStoredActiveShopId();
        if (prev === targetShopId || currentStored === targetShopId) {
          setStoredActiveShopId(null);
          return null;
        }
        return prev;
      });

      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'getShops',
      });
    },
    [queryClient, userId]
  );

  const updateShop = useCallback(
    (shopPatch) => {
      const targetShopId = shopPatch?.shopId ?? shopPatch?.id;
      if (!targetShopId) return;

      const normalizedPatch = { ...shopPatch, id: targetShopId };
      delete normalizedPatch.shopId;

      setUpdatedShops((prev) => {
        const existing = prev.find(
          (entry) => entry.userId === userId && entry.shopId === targetShopId
        );
        const mergedPatch = existing
          ? { ...existing.patch, ...normalizedPatch }
          : normalizedPatch;
        const filtered = prev.filter(
          (entry) => !(entry.userId === userId && entry.shopId === targetShopId)
        );
        return [
          ...filtered,
          { userId, shopId: targetShopId, patch: mergedPatch },
        ];
      });

      queryClient.setQueryData(
        getShopsQueryKey({ userId }),
        (previous = []) => {
          if (!Array.isArray(previous)) return previous;
          return previous.map((item) =>
            item.id === targetShopId ? { ...item, ...normalizedPatch } : item
          );
        }
      );
    },
    [queryClient, userId]
  );

  const role = activeShop?.role ?? null;

  const contextValue = useMemo(
    () => ({
      shops,
      activeShop,
      role,
      isLoading,
      setActiveShop,
      removeShop,
      updateShop,
    }),
    [shops, activeShop, role, isLoading, setActiveShop, removeShop, updateShop]
  );

  return (
    <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>
  );
};
