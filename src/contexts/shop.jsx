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
import { getShopsQueryKey, useGetShops } from '@/features/shops/api/hooks';

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

  const shops = useMemo(() => {
    if (!userId) return [];
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
    return [...base, ...additional];
  }, [fetchedShops, createdShops, userId]);

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
    }
  }, [activeShop?.id]);

  const setActiveShop = useCallback(
    (shopOrId) => {
      if (!shopOrId) return;

      const nextShopId =
        typeof shopOrId === 'string' ? shopOrId : (shopOrId?.id ?? null);

      if (!nextShopId) return;

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

  const role = activeShop?.role ?? null;

  const contextValue = useMemo(
    () => ({
      shops,
      activeShop,
      role,
      isLoading,
      setActiveShop,
    }),
    [shops, activeShop, role, isLoading, setActiveShop]
  );

  return (
    <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>
  );
};
