import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Briefcase, 
  Search, 
  Home, 
  AlertTriangle, 
  CheckCheck, 
  Settings, 
  ChevronLeft, 
  Heart, 
  User, 
  Zap, 
  Trash2,
  Moon,
  Plus,
  MapPin,
  Tag,
  Calendar
} from 'lucide-react';

// --- Mock Data for NeoList (Craigslist Redesign) ---
const initialNotifications = [
  {
    id: 1,
    type: 'message',
    category: 'Buy & Sell',
    title: 'Offer received: Vintage Film Camera',
    description: 'Buyer "AnalogFan" sent an offer of $120 for your Canon AE-1 Program.',
    time: '10m ago',
    read: false,
  },
  {
    id: 2,
    type: 'housing',
    category: 'Housing',
    title: 'New Apartment in Brooklyn',
    description: '2BR/1BA loft in Williamsburg matches your saved search "No Fee Rentals".',
    time: '45m ago',
    read: false,
  },
  {
    id: 3,
    type: 'missed_connection',
    category: 'Community',
    title: 'Missed Connection Match?',
    description: 'A post containing keywords "Red Scarf" and "L Train" was just posted.',
    time: '2h ago',
    read: true,
  },
  {
    id: 4,
    type: 'job',
    category: 'Jobs',
    title: 'Gig Alert: Event Photographer',
    description: 'Weekend gig posted in "Creative/Art" that matches your skills profile.',
    time: '3h ago',
    read: false,
  },
  {
    id: 5,
    type: 'service',
    category: 'Services',
    title: 'Mover quote received',
    description: 'FastMovers NY sent a quote for your upcoming move request.',
    time: '5h ago',
    read: true,
  },
  {
    id: 6,
    type: 'price_drop',
    category: 'Buy & Sell',
    title: 'Price Drop: Herman Miller Chair',
    description: 'A listing you favorited has dropped from $500 to $350.',
    time: '1d ago',
    read: true,
  },
  {
    id: 7,
    type: 'system',
    category: 'System',
    title: 'Post Expiring Soon',
    description: 'Your listing "MacBook Pro M1" will expire in 48 hours. Repost now?',
    time: '2d ago',
    read: true,
  },
];

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'Buy & Sell', label: 'Buy & Sell' },
  { id: 'Housing', label: 'Housing' },
  { id: 'Jobs', label: 'Jobs' },
  { id: 'Services', label: 'Services' },
  { id: 'Community', label: 'Community' },
];

// --- Helper Components ---

const NotificationIcon = ({ type }) => {
  const baseClasses = "p-3 rounded-xl flex items-center justify-center shrink-0 shadow-sm";
  
  // Using NeoList Purple palette accents
  switch (type) {
    case 'message':
      return <div className={`${baseClasses} bg-purple-100 text-purple-600`}><MessageSquare size={20} strokeWidth={2.5} /></div>;
    case 'housing':
      return <div className={`${baseClasses} bg-fuchsia-100 text-fuchsia-600`}><Home size={20} strokeWidth={2.5} /></div>;
    case 'job':
      return <div className={`${baseClasses} bg-blue-100 text-blue-600`}><Briefcase size={20} strokeWidth={2.5} /></div>;
    case 'price_drop':
      return <div className={`${baseClasses} bg-green-100 text-green-600`}><Tag size={20} strokeWidth={2.5} /></div>;
    case 'missed_connection':
      return <div className={`${baseClasses} bg-pink-100 text-pink-600`}><Heart size={20} strokeWidth={2.5} /></div>;
    case 'service':
      return <div className={`${baseClasses} bg-amber-100 text-amber-600`}><Zap size={20} strokeWidth={2.5} /></div>;
    default:
      return <div className={`${baseClasses} bg-slate-100 text-slate-600`}><Bell size={20} strokeWidth={2.5} /></div>;
  }
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
    <div className="bg-purple-50 p-8 rounded-full mb-6 shadow-inner">
      <CheckCheck size={48} className="text-purple-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">All caught up!</h3>
    <p className="text-slate-500 max-w-xs">No new updates in this category. Go discover something new on NeoList.</p>
  </div>
);

// Custom Peace Icon for Logo to match reference
const PeaceIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M12 12 5.5 20.5" />
    <path d="M12 12l6.5 8.5" />
  </svg>
);

export default function App() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'All' ? true : n.category === activeTab
  );

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markSingleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* --- NeoList Header (Matches Reference) --- */}
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-lg relative overflow-hidden">
         {/* Background decorative shapes */}
         <div className="absolute top-[-20%] right-[10%] w-64 h-64 bg-white/10 rounded-3xl rotate-12 blur-xl pointer-events-none" />
         <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

         <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between relative z-10">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <PeaceIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
              <span className="text-xl md:text-2xl font-bold tracking-tight">NeoList</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-purple-50">
              <a href="#" className="hover:text-white transition-colors">Listings</a>
              <a href="#" className="hover:text-white transition-colors">Events</a>
              <a href="#" className="hover:text-white transition-colors">Services</a>
              <a href="#" className="hover:text-white transition-colors">Jobs</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-5">
              <button className="p-1.5 text-purple-100 hover:text-white transition-colors">
                <Moon size={20} />
              </button>
              <button className="p-1.5 text-white relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-purple-600"></span>
              </button>
              <button className="p-1.5 text-purple-100 hover:text-white transition-colors">
                <MessageSquare size={20} />
              </button>
              <button className="p-1.5 text-purple-100 hover:text-white transition-colors">
                <User size={20} />
              </button>
              <button className="hidden md:flex bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors items-center gap-1">
                Post Listing
              </button>
            </div>
         </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="max-w-4xl mx-auto mt-8 px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 mt-1">Manage your alerts for Buy & Sell, Housing, and more.</p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
             <button 
               onClick={markAllRead}
               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100"
             >
               <CheckCheck size={16} />
               Mark all read
             </button>
             <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100">
               <Settings size={20} />
             </button>
          </div>
        </div>

        {/* Scrollable Tabs */}
        <div className="mb-8 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 min-w-max">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                   activeTab === tab.id 
                     ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' 
                     : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>

        {/* --- Notification List Card --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => markSingleRead(notification.id)}
                  className={`group relative p-5 sm:p-6 flex gap-4 transition-all duration-200 cursor-pointer hover:bg-purple-50/50 ${
                    !notification.read ? 'bg-purple-50/40' : 'bg-white'
                  }`}
                >
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                  )}

                  {/* Icon */}
                  <div className="mt-1">
                    <NotificationIcon type={notification.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                          notification.category === 'Buy & Sell' ? 'bg-indigo-100 text-indigo-700' :
                          notification.category === 'Housing' ? 'bg-fuchsia-100 text-fuchsia-700' :
                          notification.category === 'Jobs' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {notification.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{notification.time}</span>
                      </div>
                    </div>

                    <h4 className={`text-base pr-8 mb-1 ${!notification.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notification.title}
                    </h4>
                    
                    <p className={`text-sm leading-relaxed ${!notification.read ? 'text-slate-700' : 'text-slate-500'}`}>
                      {notification.description}
                    </p>
                  </div>

                  {/* Desktop Hover Actions */}
                  <div className="hidden md:flex opacity-0 group-hover:opacity-100 items-center gap-1 absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-sm border border-slate-100 rounded-lg p-1 transition-all">
                     <button 
                       title="Mark as read"
                       className="p-2 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-md transition-colors"
                       onClick={(e) => { e.stopPropagation(); markSingleRead(notification.id); }}
                     >
                       <CheckCheck size={16} />
                     </button>
                     <div className="w-px h-4 bg-slate-200" />
                     <button 
                       title="Delete"
                       className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                       onClick={(e) => deleteNotification(notification.id, e)}
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>

                  {/* Mobile Unread Dot (since we removed the bold text sometimes) */}
                  {!notification.read && (
                     <div className="md:hidden absolute right-4 top-6 w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Bottom Action */}
        <div className="mt-8 text-center">
           <button className="text-purple-600 text-sm font-semibold hover:text-purple-700 hover:underline">
             Adjust Notification Settings
           </button>
        </div>

      </div>

      {/* --- Mobile Bottom Nav (Optional for Mobile View to match App feel) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 safe-area-bottom">
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <Search size={24} />
          <span className="text-[10px] font-medium">Search</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-purple-600">
          <div className="relative">
            <Bell size={24} fill="currentColor" className="text-purple-100 stroke-purple-600" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <MessageSquare size={24} />
          <span className="text-[10px] font-medium">Chat</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <User size={24} />
          <span className="text-[10px] font-medium">Profile</span>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 12px);
        }
      `}</style>
    </div>
  );
}