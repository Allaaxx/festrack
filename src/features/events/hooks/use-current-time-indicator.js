import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from 'date-fns';
import { useEffect, useState } from 'react';

export function useCurrentTimeIndicator(
  currentDate,
  view,
  startHour = 0,
  endHour = 24
) {
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [currentTimeVisible, setCurrentTimeVisible] = useState(false);

  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const totalMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
      const dayEndMinutes = (endHour - startHour) * 60;

      const position = (totalMinutes / dayEndMinutes) * 100;

      const isCurrentTimeVisible =
        view === 'day'
          ? isSameDay(now, currentDate)
          : isWithinInterval(now, {
              start: startOfWeek(currentDate, { weekStartsOn: 0 }),
              end: endOfWeek(currentDate, { weekStartsOn: 0 }),
            });

      setCurrentTimePosition(position);
      setCurrentTimeVisible(isCurrentTimeVisible);
    };

    calculateTimePosition();

    const interval = setInterval(calculateTimePosition, 60000);

    return () => clearInterval(interval);
  }, [currentDate, view, startHour, endHour]);

  return { currentTimePosition, currentTimeVisible };
}
