import React, { useMemo } from 'react';
import { CalendarEvent, EventType, ViewMode } from '../types';
import { getWeekDays, isSameDay, formatTime, startOfDay } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Clock, MapPin, Flag } from 'lucide-react';

interface CalendarProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  currentDate, 
  onDateChange, 
  viewMode,
  onEventClick,
  onSlotClick
}) => {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  // Extend hours to midnight (07:00 to 00:00)
  const hours = Array.from({ length: 18 }, (_, i) => i + 7); 

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-xl font-serif font-bold text-nd-navy dark:text-nd-gold">
          {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => onDateChange(new Date())} className="text-sm font-medium px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-md">
            Today
          </button>
          <button onClick={handleNext} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
            <div className="p-2 border-r border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">Time</div>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              // Check if there's a deadline on this day
              const hasDeadline = events.some(e => 
                e.type === EventType.DEADLINE && isSameDay(e.start, day)
              );

              return (
                <div key={day.toISOString()} className={`p-2 text-center border-r border-slate-100 dark:border-slate-800 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className={`text-xs font-semibold ${isToday ? 'text-nd-navy dark:text-nd-gold' : 'text-slate-500'}`}>
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)}
                  </div>
                  <div className={`text-lg font-serif ${isToday ? 'text-nd-navy dark:text-nd-gold' : 'text-slate-800 dark:text-slate-200'}`}>
                    {day.getDate()}
                  </div>
                  {/* Little Calendar Item / Dot for Deadline */}
                  {hasDeadline && (
                    <div className="flex justify-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" title="Deadline today"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dedicated Deadlines Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10 min-h-[2rem]">
            <div className="p-2 border-r border-slate-100 dark:border-slate-800 text-center text-[10px] font-bold text-red-800 dark:text-red-400 flex items-center justify-center uppercase tracking-wide">
               Due
            </div>
            {weekDays.map((day) => {
              const dayDeadlines = events.filter(e => 
                e.type === EventType.DEADLINE && isSameDay(e.start, day)
              );

              return (
                <div key={`deadline-${day.toISOString()}`} className="p-1 border-r border-slate-100 dark:border-slate-800 relative">
                   {dayDeadlines.map(ev => (
                      <div 
                        key={ev.id} 
                        className="text-[10px] bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border-l-2 border-red-500 p-1.5 rounded shadow-sm mb-1 cursor-pointer hover:bg-red-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 group"
                        onClick={() => onEventClick(ev)}
                      >
                         <Flag size={8} className="fill-red-500 text-red-500" />
                         <span className="font-bold">{formatTime(ev.start)}</span> 
                         <span className="truncate group-hover:whitespace-normal">{ev.title.replace('DUE: ', '')}</span>
                      </div>
                   ))}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="relative">
             {hours.map((hour) => (
               <div key={hour} className="grid grid-cols-8 h-20 border-b border-slate-100 dark:border-slate-800/50">
                 <div className="p-2 border-r border-slate-100 dark:border-slate-800 text-right text-xs text-slate-400 -mt-2.5 bg-white dark:bg-slate-900 z-10 sticky left-0">
                   {hour}:00
                 </div>
                 {weekDays.map(day => (
                   <div key={day.toISOString()} className="border-r border-slate-100 dark:border-slate-800/50 h-full relative group">
                     {/* Placeholder for click to add */}
                     <div 
                        className="absolute inset-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" 
                        onClick={() => {
                          if (onSlotClick) {
                            const slotDate = new Date(day);
                            slotDate.setHours(hour, 0, 0, 0);
                            onSlotClick(slotDate);
                          }
                        }}
                     />
                   </div>
                 ))}
               </div>
             ))}

             {/* Events Overlay (Excluding Deadlines since they are in top row) */}
             {events.filter(e => e.type !== EventType.DEADLINE).map(event => {
                const eventDate = startOfDay(event.start);
                // Find which column (day) this event belongs to
                const dayIndex = weekDays.findIndex(d => isSameDay(d, eventDate));
                
                if (dayIndex === -1) return null; // Event not in this week

                const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                
                // Only render if within the visible range (approx)
                if (startHour > 24) return null;

                const top = Math.max(0, (startHour - 7) * 5); // 5rem per hour (h-20)
                const height = Math.max(1.5, (endHour - startHour) * 5); // Minimum height for visibility

                // Determine styling based on event type and color
                const isTask = event.type === EventType.TASK_SESSION;

                // Default light colors
                let bgColor = isTask ? '#DCFCE7' : '#E0F2FE';
                let textColor = 'text-slate-800';
                let subTextColor = 'text-slate-600';
                let borderStyle = {};
                
                if (event.color) {
                   // Special handling for the Light Blue Outline ones from screenshot
                   const isOutline = event.color === '#E1F5FE' || event.color === '#F0F9FF'; 
                   
                   if (!isOutline) {
                       // Solid color background (Red/Blue classes)
                       bgColor = event.color;
                       textColor = 'text-white';
                       subTextColor = 'text-blue-50';
                       borderStyle = {
                           borderLeftWidth: '4px',
                           borderColor: event.color === '#00843D' ? '#00843D' : (event.color === '#dc2626' ? '#b91c1c' : '#0369a1') // Darker shade for border
                       };
                   } else {
                       // Outline / Light style
                       bgColor = '#F0F9FF'; // Very light blue
                       textColor = 'text-sky-700';
                       subTextColor = 'text-sky-600';
                       borderStyle = {
                           borderWidth: '1px',
                           borderColor: '#0ea5e9',
                           borderLeftWidth: '4px'
                       };
                   }
                } else {
                    // Fallback task style
                    borderStyle = {
                        borderLeftWidth: '4px',
                        borderColor: isTask ? '#00843D' : '#0C2340'
                    };
                }

                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`absolute z-20 rounded-md p-1.5 text-xs shadow-sm cursor-pointer overflow-hidden transition-transform hover:scale-105 hover:z-30`}
                    style={{
                      left: `${(dayIndex + 1) * 12.5 + 0.2}%`, // 100% / 8 columns = 12.5%
                      width: '12%',
                      top: `${top}rem`,
                      height: `${height}rem`,
                      backgroundColor: bgColor,
                      ...borderStyle
                    }}
                  >
                    <div className={`font-semibold truncate leading-tight ${textColor} flex items-center gap-1`}>
                        {event.title}
                    </div>
                    <div className={`flex items-center gap-1 truncate text-[10px] mt-0.5 ${subTextColor}`}>
                       <Clock size={10} /> {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                    {event.location && (
                       <div className={`flex items-center gap-1 truncate text-[10px] mt-0.5 ${subTextColor}`}>
                         <MapPin size={10} /> {event.location}
                       </div>
                    )}
                  </div>
                );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};