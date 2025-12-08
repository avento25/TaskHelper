import React, { useState } from 'react';
import { Button } from './Button';
import { CalendarEvent, UserPreferences, Task, EventType } from '../types';
import { scheduleTask } from '../services/scheduler';
import { generateRecurringDates, addDays, setTime } from '../utils/dateUtils';
import { Plus, BookOpen, Clock, Calendar as CalendarIcon, Repeat } from 'lucide-react';

interface TaskFormProps {
  existingEvents: CalendarEvent[];
  onSchedule: (task: Task, events: CalendarEvent[]) => void;
  onAddEvents?: (events: CalendarEvent[]) => void;
  preferences: UserPreferences;
  availableLocations: string[];
  onAddLocation: (location: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  existingEvents, 
  onSchedule, 
  onAddEvents,
  preferences,
  availableLocations,
  onAddLocation
}) => {
  const [activeTab, setActiveTab] = useState<'TASK' | 'EVENT'>('TASK');
  const [loading, setLoading] = useState(false);

  // Common State
  const [selectedLocation, setSelectedLocation] = useState(preferences.preferredLocation);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  // Task State
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [sessions, setSessions] = useState(1);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(4);

  // Event/Class State
  const [eventType, setEventType] = useState<'ONE_TIME' | 'RECURRING'>('RECURRING');
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('09:30');
  const [eventEnd, setEventEnd] = useState('10:45');
  
  // Specific to Recurring
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sun, 1=Mon...
  const [semesterEnd, setSemesterEnd] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0]
  );

  // Specific to One-Time
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      onAddLocation(newLocation.trim());
      setSelectedLocation(newLocation.trim());
      setNewLocation('');
      setIsAddingLocation(false);
    }
  };

  const LocationSelector = () => (
    <div>
       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
       {!isAddingLocation ? (
         <div className="flex gap-2">
           <select 
             value={selectedLocation}
             onChange={(e) => {
               if (e.target.value === 'ADD_NEW') {
                 setIsAddingLocation(true);
               } else {
                 setSelectedLocation(e.target.value);
               }
             }}
             className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
           >
             {availableLocations.map(loc => (
               <option key={loc} value={loc}>{loc}</option>
             ))}
             <option value="ADD_NEW" className="font-bold text-nd-gold">+ Add New Location</option>
           </select>
         </div>
       ) : (
         <div className="flex gap-2">
           <input 
             type="text"
             value={newLocation}
             onChange={e => setNewLocation(e.target.value)}
             className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
             placeholder="Enter location..."
             autoFocus
           />
           <Button type="button" size="sm" onClick={handleAddLocation} disabled={!newLocation.trim()}>
              <Plus size={16} />
           </Button>
           <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingLocation(false)}>
              Cancel
           </Button>
         </div>
       )}
    </div>
  );

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const deadlineDate = deadline ? new Date(deadline) : new Date(Date.now() + 86400000 * 3);
      
      const { task, events } = scheduleTask(
        title,
        hours * 60,
        deadlineDate,
        sessions,
        selectedLocation,
        existingEvents,
        preferences,
        maxSessionsPerDay
      );

      onSchedule(task, events);
      
      // Reset form
      setTitle('');
      setHours(1);
      setSessions(1);
      setDeadline('');
      setLoading(false);
    }, 500); 
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (eventType === 'RECURRING' && selectedDays.length === 0) {
      alert("Please select at least one day for the recurring class.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let newEvents: CalendarEvent[] = [];

      if (eventType === 'RECURRING') {
        const instances = generateRecurringDates(
          new Date(), // start from today
          eventStart,
          eventEnd,
          selectedDays,
          new Date(semesterEnd)
        );

        newEvents = instances.map(inst => ({
          id: crypto.randomUUID(),
          title: eventTitle,
          start: inst.start,
          end: inst.end,
          type: EventType.FIXED,
          location: selectedLocation,
          color: '#0C2340', // ND Navy for classes
          isCompleted: false
        }));
      } else {
        // One-Time Event
        const startDateTime = setTime(new Date(eventDate), eventStart);
        const endDateTime = setTime(new Date(eventDate), eventEnd);
        
        // Handle overnight events slightly gracefully (if end < start, assume next day)
        if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }

        newEvents = [{
          id: crypto.randomUUID(),
          title: eventTitle,
          start: startDateTime,
          end: endDateTime,
          type: EventType.FIXED,
          location: selectedLocation,
          color: '#AE9142', // Metallic Gold for one-time events
          isCompleted: false
        }];
      }

      if (onAddEvents) onAddEvents(newEvents);

      // Reset
      setEventTitle('');
      if (eventType === 'ONE_TIME') {
          // Keep date as is or reset to today
      } else {
          setSelectedDays([]);
      }
      setLoading(false);
    }, 500);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('TASK')}
          className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors ${activeTab === 'TASK' ? 'bg-slate-50 dark:bg-slate-800 text-nd-navy dark:text-nd-gold border-b-2 border-nd-gold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Study Task
        </button>
        <button 
          onClick={() => setActiveTab('EVENT')}
          className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors ${activeTab === 'EVENT' ? 'bg-slate-50 dark:bg-slate-800 text-nd-navy dark:text-nd-gold border-b-2 border-nd-gold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Add Event
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'TASK' ? (
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Name</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                placeholder="e.g. Calculus Midterm Study"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Hours</label>
                <input 
                  type="number" 
                  min="0.5" 
                  step="0.5"
                  required
                  value={hours}
                  onChange={e => setHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sessions</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  required
                  value={sessions}
                  onChange={e => setSessions(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                 Max Sessions / Day: <span className="text-nd-navy dark:text-nd-gold">{maxSessionsPerDay}</span>
              </label>
              <input 
                type="range"
                min="1"
                max="4"
                value={maxSessionsPerDay}
                onChange={e => setMaxSessionsPerDay(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-nd-gold"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                 <span>1</span>
                 <span>2</span>
                 <span>3</span>
                 <span>4</span>
              </div>
            </div>

            <LocationSelector />

            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <CalendarIcon size={12} /> Deadline
              </label>
              <input 
                type="datetime-local" 
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Scheduling...' : 'Add to Schedule'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEventSubmit} className="space-y-4">
             {/* Event Type Toggle */}
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Type</label>
               <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
                 <button
                   type="button"
                   onClick={() => setEventType('RECURRING')}
                   className={`flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-sm transition-all ${eventType === 'RECURRING' ? 'bg-white dark:bg-slate-700 shadow-sm text-nd-navy dark:text-nd-gold' : 'text-slate-500'}`}
                 >
                   <Repeat size={14} /> Recurring Class
                 </button>
                 <button
                   type="button"
                   onClick={() => setEventType('ONE_TIME')}
                   className={`flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-sm transition-all ${eventType === 'ONE_TIME' ? 'bg-white dark:bg-slate-700 shadow-sm text-nd-navy dark:text-nd-gold' : 'text-slate-500'}`}
                 >
                   <CalendarIcon size={14} /> One-Time Event
                 </button>
               </div>
             </div>

             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {eventType === 'RECURRING' ? 'Class Name' : 'Event Title'}
              </label>
              <input 
                type="text" 
                required
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                placeholder={eventType === 'RECURRING' ? "e.g. Intro to Philosophy" : "e.g. Club Meeting"}
              />
            </div>

            {eventType === 'ONE_TIME' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input 
                  type="date"
                  required
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                <input 
                  type="time" 
                  required
                  value={eventStart}
                  onChange={e => setEventStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                <input 
                  type="time" 
                  required
                  value={eventEnd}
                  onChange={e => setEventEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                />
              </div>
            </div>

            {eventType === 'RECURRING' && (
              <>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Days of Week</label>
                   <div className="flex justify-between">
                      {weekDays.map((day, idx) => {
                         const isSelected = selectedDays.includes(idx);
                         return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleDay(idx)}
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${isSelected 
                                   ? 'bg-nd-navy text-nd-gold ring-2 ring-nd-gold ring-offset-1 dark:ring-offset-slate-900' 
                                   : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 hover:border-nd-navy'
                                }
                              `}
                            >
                               {day}
                            </button>
                         )
                      })}
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End of Semester</label>
                  <input 
                    type="date" 
                    required
                    value={semesterEnd}
                    onChange={e => setSemesterEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-nd-gold focus:outline-none"
                  />
                </div>
              </>
            )}

            <LocationSelector />

            <Button type="submit" disabled={loading} className="w-full" variant="secondary">
              {loading ? 'Adding...' : (eventType === 'RECURRING' ? 'Add Class Schedule' : 'Add Event')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};