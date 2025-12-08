import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { TaskForm } from './components/TaskForm';
import { Modal } from './components/Modal';
import { ChatInterface } from './components/ChatInterface';
import { Button } from './components/Button';
import { CalendarEvent, Task, UserPreferences, ViewMode, EventType } from './types';
import { Settings, Sun, Moon, Calendar as CalendarIcon, CheckCircle, Menu, X, Trash2, Edit2, MapPin, Clock, Circle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { generateRecurringDates, startOfDay, addDays, addMinutes } from './utils/dateUtils';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEEK);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false); // Toggle for completed tasks dropdown
  
  // Selection State for Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Locations State
  const [availableLocations, setAvailableLocations] = useState<string[]>([
    'Hesburgh Library',
    'DeBartolo Hall',
    'LaFortune Student Center',
    'Duncan Student Center',
    'Bond Hall',
    'Home',
    'Dorm Room',
    'Room 109',
    'Leighton & Quinn'
  ]);

  const handleAddLocation = (newLocation: string) => {
    if (!availableLocations.includes(newLocation)) {
      setAvailableLocations([...availableLocations, newLocation]);
    }
  };

  // --- Initial Data Generation ---
  // Generate classes starting from the current week's Monday to ensure they are visible immediately
  const generateInitialEvents = (): CalendarEvent[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const mondayOfThisWeek = addDays(today, diffToMonday);
    
    // Semester end (approx 4 months out)
    const semesterEnd = addDays(mondayOfThisWeek, 120);

    const classes = [
      // Mon, Wed: Object Design (Blue)
      {
        title: 'Object Design and Fabrication',
        days: [1, 3], // Mon, Wed
        start: '09:15',
        end: '10:30',
        color: '#0ea5e9', // Sky Blue
        location: 'Bond Hall'
      },
      // Wed: Business Analytics (Red) - Regular time
      {
         title: 'ESTM 60210: Business Analytics (Valya K)',
         days: [3],
         start: '17:30',
         end: '18:45',
         color: '#dc2626', // Red
         location: 'Room 109'
      },
      // Mon: Gen AI (Red)
      {
         title: 'ESTM 60244: Generative AI (Emelia H)',
         days: [1],
         start: '17:30',
         end: '18:45',
         color: '#dc2626', // Red
         location: 'Room 109'
      },
      // Tue, Thu: Capstone (Red)
      {
         title: 'ESTM 68302: ESTEEM Capstone',
         days: [2, 4],
         start: '13:00',
         end: '14:15',
         color: '#dc2626', // Red
         location: 'Room 109'
      },
      // Tue, Thu: Finance (Red)
      {
         title: 'ESTM 63607: Finance for Tech',
         days: [2, 4],
         start: '15:00',
         end: '16:15',
         color: '#dc2626', // Red
         location: 'DeBartolo Hall 203'
      },
      // Thu: Strat Marketing (Red)
      {
         title: 'ESTM 60102: Strategic Tech Marketing (Mike K)',
         days: [4],
         start: '09:15',
         end: '10:30',
         color: '#dc2626', // Red
         location: 'Room 109'
      },
      // Wed: Meeting (Blue)
      {
         title: 'Benjamin / Alex Weekly Meeting',
         days: [3],
         start: '13:00',
         end: '14:00',
         color: '#0ea5e9', // Sky Blue
         location: 'LaFortune'
      }
    ];

    let allEvents: CalendarEvent[] = [];

    classes.forEach(cls => {
       const instances = generateRecurringDates(
          mondayOfThisWeek,
          cls.start,
          cls.end,
          cls.days,
          semesterEnd
       );
       
       const events = instances.map(inst => ({
          id: crypto.randomUUID(),
          title: cls.title,
          start: inst.start,
          end: inst.end,
          type: EventType.FIXED,
          color: cls.color,
          location: cls.location,
          isCompleted: false
       }));
       
       allEvents = [...allEvents, ...events];
    });

    return allEvents;
  };

  const [events, setEvents] = useState<CalendarEvent[]>(generateInitialEvents);

  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    workStartHour: 9,
    workEndHour: 22,
    preferredLocation: 'Hesburgh Library',
    theme: 'light'
  });

  // --- Derived State for Dashboard ---
  const activeTasks = tasks
      .filter(t => !t.isCompleted)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  const completedTasks = tasks
      .filter(t => t.isCompleted)
      .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

  const totalStudyHours = tasks.reduce((acc, t) => acc + (t.totalDurationMinutes / 60), 0);
  const completedTasksCount = completedTasks.length;

  // --- Effects ---
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // --- Handlers ---
  const handleScheduleTask = (newTask: Task, newEvents: CalendarEvent[]) => {
    // Add visual deadline event
    const deadlineEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        title: `DUE: ${newTask.title}`,
        start: newTask.deadline,
        end: addMinutes(newTask.deadline, 30), // 30 min block for visibility
        type: EventType.DEADLINE,
        color: '#ef4444', // Red for deadlines
        isCompleted: false,
        taskId: newTask.id
    };

    setTasks(prev => [...prev, newTask]);
    setEvents(prev => [...prev, ...newEvents, deadlineEvent]);
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(t => 
       t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    ));
    
    // Optional: Also mark linked events as completed?
    // For now, we'll focus on the task list itself as per requirements.
  };

  const handleAddEvents = (newEvents: CalendarEvent[]) => {
    setEvents(prev => [...prev, ...newEvents]);
  };

  const toggleTheme = () => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Create a deep copy to avoid direct mutation issues during editing
    setSelectedEvent({ ...event });
    setIsEventModalOpen(true);
  };

  const handleSlotClick = (date: Date) => {
    setSelectedSlot(date);
    setIsBlockModalOpen(true);
  };

  // Event CRUD
  const handleDeleteEvent = () => {
    if (selectedEvent && selectedEvent.id) {
      // Direct delete without confirmation for better UX given the report
      const idToDelete = selectedEvent.id;
      setEvents(prev => prev.filter(e => e.id !== idToDelete));
      
      // If this event was tied to a task, we might want to check if the task needs update,
      // but simpler to just delete the session.
      
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleDeleteBatch = (eventIds: string[]) => {
     setEvents(prev => prev.filter(e => !eventIds.includes(e.id)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    // Also remove all associated events (sessions + deadline)
    setEvents(prev => prev.filter(e => e.taskId !== taskId));
  };

  const handleUpdateEvent = (updated: Partial<CalendarEvent>) => {
    if (selectedEvent) {
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, ...updated } : e));
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleCreateBlock = (title: string, durationMinutes: number) => {
    if (selectedSlot) {
       const endTime = new Date(selectedSlot.getTime() + durationMinutes * 60000);
       const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          title: title || 'Busy',
          start: selectedSlot,
          end: endTime,
          type: EventType.FIXED,
          color: '#64748b', // Slate for blocked time
          location: 'Blocked',
          isCompleted: false
       };
       setEvents(prev => [...prev, newEvent]);
       setIsBlockModalOpen(false);
       setSelectedSlot(null);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col h-screen overflow-hidden">
      {/* Navigation Bar */}
      <nav className="bg-nd-navy shadow-md shrink-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden text-white hover:bg-white/10 p-1 rounded"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="bg-nd-gold p-1.5 rounded text-nd-navy font-bold">
                <CalendarIcon size={24} />
              </div>
              <span className="font-serif font-bold text-xl text-white tracking-wide">TaskHelper</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-blue-200 hover:text-white transition-colors rounded-full hover:bg-white/10"
              >
                {preferences.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className="p-2 text-blue-200 hover:text-white transition-colors rounded-full hover:bg-white/10"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Flex Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Task Form) */}
        <aside 
          className={`
            absolute md:relative z-20 top-0 left-0 h-full w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 transform transition-transform duration-300 ease-in-out overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="space-y-6">
            <TaskForm 
              existingEvents={events} 
              onSchedule={handleScheduleTask}
              onAddEvents={handleAddEvents}
              preferences={preferences}
              availableLocations={availableLocations}
              onAddLocation={handleAddLocation}
            />
            
            {/* Quick Tips Box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
               <h4 className="font-serif font-bold text-nd-navy dark:text-nd-gold text-sm mb-2">Did You Know?</h4>
               <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                 Breaking tasks into 45-minute "chunks" aligns with natural attention spans. Click any empty space on the calendar to block out time!
               </p>
            </div>
          </div>
        </aside>
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Center: Calendar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col">
          {/* Calendar Wrapper */}
          <div className="flex-1 min-h-[500px]">
            <Calendar 
              events={events} 
              currentDate={currentDate} 
              onDateChange={setCurrentDate} 
              viewMode={viewMode}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
            />
          </div>
        </main>

        {/* Right Sidebar (Stats & Task List) - Hidden on smaller screens */}
        <aside className="w-80 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex z-10">
           
           {/* Header Stats */}
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
               <h3 className="font-serif font-bold text-nd-navy dark:text-nd-gold text-lg mb-4">Dashboard</h3>
               <div className="grid grid-cols-2 gap-3">
                   {/* Tasks Completed Counter */}
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Completed</div>
                      <div className="flex items-end gap-1 mt-1">
                          <span className="text-2xl font-bold text-nd-navy dark:text-nd-gold">{completedTasksCount}</span>
                          <span className="text-xs text-slate-400 mb-1">tasks</span>
                      </div>
                   </div>
                   
                   {/* Study Hours */}
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Study Hrs</div>
                      <div className="flex items-end gap-1 mt-1">
                          <span className="text-2xl font-bold text-nd-green">{totalStudyHours.toFixed(1)}</span>
                          <span className="text-xs text-slate-400 mb-1">hrs</span>
                      </div>
                   </div>
               </div>
           </div>

           {/* Task List Section */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Active Tasks List */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                     <Flag size={12} /> Upcoming Deadlines
                  </h3>
                  
                  <div className="space-y-2">
                     {activeTasks.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">No pending tasks. Great job!</p>
                     ) : (
                        activeTasks.map(task => {
                           const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                           const isUrgent = daysLeft <= 2;
                           
                           return (
                             <div key={task.id} className="group bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 hover:border-nd-gold dark:hover:border-nd-gold transition-colors">
                                <div className="flex items-start gap-3">
                                   <button 
                                      onClick={() => handleToggleTaskCompletion(task.id)}
                                      className="mt-0.5 text-slate-400 hover:text-nd-green transition-colors"
                                   >
                                      <Circle size={20} />
                                   </button>
                                   <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-bold text-nd-navy dark:text-white leading-tight mb-1">{task.title}</h4>
                                      <div className="flex items-center justify-between">
                                         <span className={`text-xs font-medium ${isUrgent ? 'text-red-500' : 'text-slate-500'}`}>
                                            Due {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.deadline))}
                                         </span>
                                         <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                                            {task.sessions} sessions
                                         </span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                           );
                        })
                     )}
                  </div>
              </div>

              {/* Completed Tasks Accordion */}
              {completedTasks.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                   <button 
                      onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                      className="flex items-center justify-between w-full text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-nd-navy dark:hover:text-slate-300 transition-colors"
                   >
                      <span>Completed Tasks ({completedTasksCount})</span>
                      {isCompletedExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   </button>
                   
                   {isCompletedExpanded && (
                      <div className="mt-3 space-y-2">
                         {completedTasks.map(task => (
                             <div key={task.id} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-transparent opacity-75">
                                <div className="flex items-center gap-3">
                                   <button 
                                      onClick={() => handleToggleTaskCompletion(task.id)}
                                      className="text-nd-green"
                                   >
                                      <CheckCircle size={18} />
                                   </button>
                                   <span className="text-sm text-slate-500 line-through decoration-slate-400">{task.title}</span>
                                </div>
                             </div>
                         ))}
                      </div>
                   )}
                </div>
              )}
           </div>
        </aside>

        {/* Chatbot Overlay (Slides in from right over the sidebar) */}
        <ChatInterface 
          onSchedule={handleScheduleTask} 
          onDeleteEvents={handleDeleteBatch}
          onDeleteTask={handleDeleteTask}
          existingEvents={events}
          tasks={tasks}
          preferences={preferences}
        />
      </div>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Preferences"
      >
        <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium mb-1">Default Location</label>
                <select 
                    value={preferences.preferredLocation}
                    onChange={(e) => setPreferences({...preferences, preferredLocation: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Hour (0-23)</label>
                    <input 
                        type="number" 
                        value={preferences.workStartHour}
                        onChange={(e) => setPreferences({...preferences, workStartHour: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Hour (0-23)</label>
                    <input 
                        type="number" 
                        value={preferences.workEndHour}
                        onChange={(e) => setPreferences({...preferences, workEndHour: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
             </div>
             <p className="text-xs text-slate-500 mt-2">
                Note: The Gemini API Key is loaded from system environment variables for security.
             </p>
        </div>
      </Modal>
      
      {/* Event Details Modal */}
      <Modal
         isOpen={isEventModalOpen}
         onClose={() => setIsEventModalOpen(false)}
         title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                <input 
                   type="text" 
                   value={selectedEvent.title}
                   onChange={e => setSelectedEvent({...selectedEvent, title: e.target.value})}
                   className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                <div className="flex gap-2">
                   <select 
                     value={selectedEvent.location || ''}
                     onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
                     className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                   >
                     {availableLocations.map(loc => (
                       <option key={loc} value={loc}>{loc}</option>
                     ))}
                     <option value="">Other</option>
                   </select>
                </div>
             </div>
             <div className="flex justify-between items-center pt-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteEvent} 
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                   <Trash2 size={16} className="mr-2" /> Delete Event
                </Button>
                <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleUpdateEvent({ title: selectedEvent.title, location: selectedEvent.location })}
                >
                   <Edit2 size={16} className="mr-2" /> Save Changes
                </Button>
             </div>
          </div>
        )}
      </Modal>

      {/* Add Block Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Block Time"
      >
         <BlockForm onSubmit={handleCreateBlock} onCancel={() => setIsBlockModalOpen(false)} />
      </Modal>
    </div>
  );
};

// Sub-component for blocking time
const BlockForm: React.FC<{ onSubmit: (title: string, duration: number) => void, onCancel: () => void }> = ({ onSubmit, onCancel }) => {
   const [title, setTitle] = useState('Busy');
   const [duration, setDuration] = useState(60);

   return (
      <div className="space-y-4">
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Label</label>
            <input 
               type="text" 
               value={title}
               onChange={e => setTitle(e.target.value)}
               className="w-full px-3 py-2 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
               placeholder="e.g. Lunch, Gym, Meeting"
            />
         </div>
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
            <div className="flex gap-2">
               {[30, 60, 90, 120].map(m => (
                  <button 
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={`px-3 py-1 rounded text-sm ${duration === m ? 'bg-nd-navy text-nd-gold' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                     {m}m
                  </button>
               ))}
            </div>
         </div>
         <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => onSubmit(title, duration)}>Block Time</Button>
         </div>
      </div>
   );
};

export default App;