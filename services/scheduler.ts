import { CalendarEvent, EventType, Task, UserPreferences } from '../types';
import { addMinutes, startOfDay, addDays } from '../utils/dateUtils';

// Helper to check overlap
const hasOverlap = (start: Date, end: Date, events: CalendarEvent[]): boolean => {
  return events.some(event => {
    return (
      start < event.end && end > event.start
    );
  });
};

export const scheduleTask = (
  taskTitle: string,
  totalDurationMinutes: number,
  deadline: Date,
  sessionsCount: number,
  location: string,
  existingEvents: CalendarEvent[],
  prefs: UserPreferences,
  maxSessionsPerDay: number = 4,
  minStartDate: Date = new Date()
): { task: Task, events: CalendarEvent[] } => {
  
  const taskId = crypto.randomUUID();
  // Ensure at least 15 min session
  const sessionDuration = Math.max(15, Math.ceil(totalDurationMinutes / sessionsCount));
  
  // 1. Generate all potential valid slots
  const validSlots: { start: Date, end: Date, score: number }[] = [];
  
  // Start searching from minStartDate, but not in the past
  let iterator = new Date(Math.max(Date.now(), minStartDate.getTime()));
  
  // Round up to next 15 mins to start clean
  const remainder = 15 - (iterator.getMinutes() % 15);
  iterator = addMinutes(iterator, remainder);
  
  // Limit max lookahead (e.g., 6 months) to prevent infinite loops if deadline is crazy far
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const cutoff = deadline < maxDate ? deadline : maxDate;

  while (iterator < cutoff) {
    // Check work hours
    const hour = iterator.getHours();
    if (hour < prefs.workStartHour || hour >= prefs.workEndHour) {
      // Skip to next start hour
      // If currently after end hour, go to tomorrow start
      if (hour >= prefs.workEndHour) {
         iterator = startOfDay(addDays(iterator, 1));
         iterator.setHours(prefs.workStartHour, 0, 0, 0);
      } else {
         // If before start hour, just jump to start hour
         iterator.setHours(prefs.workStartHour, 0, 0, 0);
      }
      continue;
    }

    const start = new Date(iterator);
    const end = addMinutes(start, sessionDuration);

    if (end > deadline) break;

    // Check overlaps with existing events
    if (!hasOverlap(start, end, existingEvents)) {
        // It's a valid time slot. Calculate Score.
        let score = 0;
        
        // --- Scoring Heuristics ---

        // 1. Chronological Preference: prefer earlier slots slightly to avoid procrastination.
        // Score decreases as time passes.
        // (start timestamp / 1hr in ms) inverted
        const hoursFromNow = (start.getTime() - Date.now()) / 3600000;
        score += (10000 - hoursFromNow); 

        // 2. Location Proximity Bonus
        // We want to group tasks with events in the same location.
        // "Near" defined as within 45 mins.
        const gapToleranceMinutes = 45;
        
        const nearbyEvents = existingEvents.filter(e => {
            if (e.location !== location) return false;
            
            // Check if this existing event ends near our start
            const gapAfter = (start.getTime() - e.end.getTime()) / 60000;
            const isPrev = gapAfter >= 0 && gapAfter <= gapToleranceMinutes;
            
            // Check if this existing event starts near our end
            const gapBefore = (e.start.getTime() - end.getTime()) / 60000;
            const isNext = gapBefore >= 0 && gapBefore <= gapToleranceMinutes;
            
            return isPrev || isNext;
        });

        if (nearbyEvents.length > 0) {
            score += 50000; // Massive bonus for location match
        }

        validSlots.push({ start, end, score });
    }

    // Step 15 mins for next slot check
    iterator = addMinutes(iterator, 15);
  }

  // 2. Sort slots by Score Descending
  validSlots.sort((a, b) => b.score - a.score);

  // 3. Select slots respecting session constraints
  const newEvents: CalendarEvent[] = [];
  const dailySessionCounts = new Map<string, number>(); // YYYY-MM-DD -> count

  for (const slot of validSlots) {
      if (newEvents.length >= sessionsCount) break;

      const dayKey = slot.start.toDateString();
      const currentDayCount = dailySessionCounts.get(dayKey) || 0;

      if (currentDayCount >= maxSessionsPerDay) continue;

      // Check overlap with ALREADY SELECTED newEvents (since we are picking multiple)
      if (hasOverlap(slot.start, slot.end, newEvents)) continue;

      // Select this slot
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        title: `${taskTitle} (${newEvents.length + 1}/${sessionsCount})`,
        start: slot.start,
        end: slot.end,
        type: EventType.TASK_SESSION,
        taskId: taskId,
        color: '#00843D', // Notre Dame Green
        isCompleted: false,
        location: location
      };

      newEvents.push(newEvent);
      dailySessionCounts.set(dayKey, currentDayCount + 1);
  }

  // 4. Cleanup
  // Re-sort selected events chronologically to label them 1/N, 2/N correctly
  newEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  newEvents.forEach((e, i) => {
      e.title = `${taskTitle} (${i + 1}/${sessionsCount})`;
  });

  const newTask: Task = {
    id: taskId,
    title: taskTitle,
    totalDurationMinutes,
    deadline,
    sessions: sessionsCount,
    maxSessionsPerDay,
    priority: 'MEDIUM',
    generatedEvents: newEvents.map(e => e.id),
    isCompleted: false
  };

  return { task: newTask, events: newEvents };
};