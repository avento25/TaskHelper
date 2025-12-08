import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Send, Bot, Sparkles, X } from 'lucide-react';
import { ChatMessage, UserPreferences, CalendarEvent, Task } from '../types';
import { processUserRequest } from '../services/geminiService';
import { scheduleTask } from '../services/scheduler';

interface ChatInterfaceProps {
  onSchedule: (task: Task, events: CalendarEvent[]) => void;
  onDeleteEvents: (eventIds: string[]) => void;
  onDeleteTask: (taskId: string) => void;
  existingEvents: CalendarEvent[];
  tasks: Task[]; // Need access to full task list for rescheduling context
  preferences: UserPreferences;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSchedule, 
  onDeleteEvents, 
  onDeleteTask,
  existingEvents, 
  tasks,
  preferences 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: "Hi! I'm TaskBot. I can help you schedule new assignments or manage your existing ones. Just let me know what you need!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Provide detailed calendar and task context to the bot
  const getContextString = () => {
    if (tasks.length === 0) return "No active tasks.";

    const taskList = tasks.map(t => {
      // Find the next upcoming session for this task to help with relative moves ("push back 2 hours")
      const upcomingSessions = existingEvents
        .filter(e => e.taskId === t.id && !e.isCompleted && new Date(e.end) > new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      const nextSession = upcomingSessions[0];
      const scheduleInfo = nextSession 
        ? `Next Session: ${new Date(nextSession.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` 
        : "Not currently scheduled";

      return `- Task: "${t.title}" (ID: ${t.id}, ${t.totalDurationMinutes}m total, ${t.sessions} sessions)\n  ${scheduleInfo}`;
    }).join('\n');
    
    return `Current User Tasks & Schedule:\n${taskList}`;
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setInput('');
    setIsProcessing(true);

    // Add user message
    const newMessages = [...messages, { id: crypto.randomUUID(), role: 'user', text: userText } as ChatMessage];
    setMessages(newMessages);

    // Temporary thinking message
    setMessages(prev => [...prev, { id: 'temp', role: 'model', text: "Thinking...", isThinking: true }]);

    try {
      const history = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const context = getContextString();
      const currentDate = new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });

      // Call Unified Processor
      const result = await processUserRequest(userText, history, context, currentDate);
      
      // Remove thinking bubble
      setMessages(prev => prev.filter(m => m.id !== 'temp'));

      if (result.intent === 'CHAT') {
         setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: result.chatResponse }]);
      
      } else if (result.intent === 'DELETE') {
         // Logic to find and delete
         const target = result.taskDetails?.title?.toLowerCase() || '';
         const matches = existingEvents.filter(e => e.title.toLowerCase().includes(target));

         if (matches.length > 0) {
             // Check if these events belong to a Task (via taskId)
             const taskIds = new Set(matches.map(e => e.taskId).filter(Boolean));
             
             if (taskIds.size > 0) {
                 // It's a Task, delete the task entirely to remove it from Dashboard
                 taskIds.forEach(tid => onDeleteTask(tid as string));
             } else {
                 // Just a standalone event (like a manual block or one-time event)
                 const idsToDelete = matches.map(e => e.id);
                 onDeleteEvents(idsToDelete);
             }

             setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: result.chatResponse || `Deleted ${matches.length} events matching "${target}".` 
             }]);
         } else {
             setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: `I couldn't find any events matching "${target}" to delete.` 
             }]);
         }

      } else if (result.intent === 'SCHEDULE') {
         // Create New Task
         if (result.taskDetails && result.taskDetails.title) {
            const d = result.taskDetails;
            const deadline = d.deadline ? new Date(d.deadline) : new Date(Date.now() + 86400000 * 3);
            const startDate = d.startDate ? new Date(d.startDate) : new Date();

            const { task, events } = scheduleTask(
               d.title,
               d.totalMinutes || 60,
               deadline,
               d.sessions || 1,
               preferences.preferredLocation,
               existingEvents,
               preferences,
               4,
               startDate // Use the start date if provided
            );

            onSchedule(task, events);
            
            setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: result.chatResponse || `Scheduled "${d.title}".` 
             }]);
         }

      } else if (result.intent === 'RESCHEDULE') {
         // Reschedule Existing Task
         const targetTitle = result.taskDetails?.title;
         
         // Find the task object based on the mapped title
         // Use strict inclusion or exact match from what AI returned (AI instructed to use exact context name)
         const originalTask = tasks.find(t => t.title.toLowerCase().includes(targetTitle?.toLowerCase() || ''));
         
         if (originalTask) {
             // 1. Delete old task completely (Task object + Events) to prevent duplication
             onDeleteTask(originalTask.id);

             // 2. Schedule new
             const d = result.taskDetails;
             // Use new params if provided, else fallback to original task params
             const deadline = d.deadline ? new Date(d.deadline) : new Date(originalTask.deadline);
             const startDate = d.startDate ? new Date(d.startDate) : new Date(); // Default to now if not specified
             
             // Important: Filter events locally because state update above is async
             // We need to schedule against a calendar that DOES NOT have the old events.
             const eventsExcludingOld = existingEvents.filter(e => e.taskId !== originalTask.id);

             const { task, events } = scheduleTask(
                originalTask.title,
                originalTask.totalDurationMinutes,
                deadline,
                originalTask.sessions, // Keep original session count
                preferences.preferredLocation,
                eventsExcludingOld,
                preferences,
                originalTask.maxSessionsPerDay || 4,
                startDate
             );

             onSchedule(task, events);
             
             setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: result.chatResponse || `Rescheduled "${originalTask.title}" starting from ${startDate.toLocaleString('en-US', {weekday: 'short', hour: 'numeric', minute: '2-digit'})}.` 
             }]);

         } else {
             setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: `I understood you want to reschedule "${targetTitle}", but I couldn't find that task in your list.` 
             }]);
         }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.id !== 'temp').concat({ 
         id: crypto.randomUUID(), 
         role: 'model', 
         text: "I encountered an error processing that request." 
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Trigger Button - Hidden when Open */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 bg-nd-navy text-white rounded-full shadow-lg hover:bg-blue-900 transition-all z-[60] flex items-center gap-2 group ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open Assistant"
      >
        <Sparkles size={24} className="text-nd-gold" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-serif whitespace-nowrap">
           AI Assistant
        </span>
      </button>

      {/* Chat Dock */}
      <div 
        className={`
          fixed top-16 right-0 h-[calc(100vh-4rem)] w-full sm:w-96 
          bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 
          flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="bg-nd-navy p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-full">
              <Bot className="text-nd-gold" size={20} />
            </div>
            <div>
              <h3 className="text-white font-serif font-bold text-sm">TaskBot</h3>
              <p className="text-blue-200 text-xs">AI Scheduler</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-blue-200 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.isThinking ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="italic">Thinking...</span>
                    </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Reschedule Bio to Friday..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-full text-sm focus:ring-2 focus:ring-nd-gold focus:outline-none dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            className="p-2 bg-nd-gold hover:bg-yellow-600 text-nd-navy rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};