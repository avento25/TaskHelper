export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const getWeekDays = (startDate: Date): Date[] => {
  const start = startOfDay(startDate);
  const dayOfWeek = start.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = start.getDate() - dayOfWeek;
  const sunday = new Date(start.setDate(diff));
  
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    week.push(addDays(sunday, i));
  }
  return week;
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const setTime = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export const generateRecurringDates = (
  startDate: Date,
  startTimeStr: string,
  endTimeStr: string,
  repeatDays: number[], // 0 (Sun) - 6 (Sat)
  untilDate: Date
): { start: Date; end: Date }[] => {
  const instances: { start: Date; end: Date }[] = [];
  let current = new Date(startDate);
  
  // Ensure we start checking from the start date (ignoring time for the loop day check)
  current = startOfDay(current);
  const endLimit = endOfDay(untilDate);

  while (current <= endLimit) {
    if (repeatDays.includes(current.getDay())) {
      const start = setTime(current, startTimeStr);
      const end = setTime(current, endTimeStr);
      
      // Handle cases where end time is simpler, assume same day duration
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      // Only add if it's after/on the initial startDate time
      // (Simple check: if we are on day 1, ensure time hasn't passed if we care about that, 
      // but usually for classes we just want the slot)
      instances.push({ start, end });
    }
    current = addDays(current, 1);
  }
  return instances;
};