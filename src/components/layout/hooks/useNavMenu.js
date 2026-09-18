import { useLocation } from 'react-router';

export const useNavMenu = (rawItems) => {
  const location = useLocation();

  const processedItems = rawItems.map((item) => {
    // Verifica se a rota principal ou algum subitem está ativo
    const isCurrentRoute =
      location.pathname === item.url ||
      item.items?.some((subItem) => location.pathname === subItem.url);

    // Mantém os parâmetros de busca (querystrings) se estiver na rota atual
    const to = isCurrentRoute
      ? { pathname: item.url, search: location.search }
      : item.url;

    // Processa os subitens
    const processedSubItems = item.items?.map((subItem) => {
      const isSubCurrent = location.pathname === subItem.url;
      const subTo = isSubCurrent
        ? { pathname: subItem.url, search: location.search }
        : subItem.url;

      return {
        ...subItem,
        isActive: isSubCurrent,
        url: subTo,
      };
    });

    return {
      ...item,
      isActive: isCurrentRoute,
      url: to,
      items: processedSubItems,
    };
  });

  return processedItems;
};

export default useNavMenu;
