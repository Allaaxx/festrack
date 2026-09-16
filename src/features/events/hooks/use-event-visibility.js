// React Imports
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

export function useEventVisibility({ eventHeight, eventGap }) {
  const contentRef = useRef(null);
  const observerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight);
      }
    };

    updateHeight();

    if (!observerRef.current) {
      observerRef.current = new ResizeObserver(() => {
        updateHeight();
      });
    }

    observerRef.current.observe(contentRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const getVisibleEventCount = useMemo(() => {
    return (totalEvents) => {
      if (!contentHeight) return totalEvents;

      const maxEvents = Math.floor(contentHeight / (eventHeight + eventGap));

      if (totalEvents <= maxEvents) {
        return totalEvents;
      }

      return maxEvents > 0 ? maxEvents - 1 : 0;
    };
  }, [contentHeight, eventHeight, eventGap]);

  return { contentRef, getVisibleEventCount };
}
