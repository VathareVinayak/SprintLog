import React from 'react';
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}>
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-sm text-slate-500 font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

const TaskItem = ({ title, priority, status }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-50 hover:border-indigo-100 transition-colors cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
      <div>
        <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">Updated 2h ago</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
        }`}>
        {priority}
      </span>
      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
        {status}
      </span>
    </div>
  </div>
);

function App() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">SL</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SprintLog</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={Layers} label="Sprints" />
          <SidebarItem icon={CheckSquare} label="Tasks" />
          <SidebarItem icon={BarChart3} label="Insights" />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto p-4 bg-indigo-600 rounded-2xl text-white relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80">Pro Plan</p>
            <p className="font-bold text-lg mt-1">Upgrade Today</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center bg-slate-50 px-4 py-2 rounded-xl w-96 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, sprints..."
              className="bg-transparent border-none outline-none ml-3 text-sm w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Alex Rivers</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Scrum Master</p>
              </div>
              <img
                src="avatar.png"
                alt="Profile"
                className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm object-cover"
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Alex+Rivers&background=4f46e5&color=fff' }}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform active:scale-95">
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard icon={Layers} label="Active Sprints" value="3" trend="+12%" />
            <StatCard icon={Clock} label="Avg. Cycle Time" value="4.2d" trend="-8%" />
            <StatCard icon={CheckSquare} label="Tasks Completed" value="24/38" />
            <StatCard icon={BarChart3} label="Velocity" value="32pts" trend="+5%" />
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Active Task List */}
            <div className="col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Current Sprint
                  <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">v2.4.0</span>
                </h3>
                <button className="text-sm text-indigo-600 font-semibold hover:underline">View All</button>
              </div>
              <div className="space-y-3 bg-white/50 p-2 rounded-2xl border border-slate-100/50">
                <TaskItem title="Implement dashboard analytics" priority="High" status="In Progress" />
                <TaskItem title="Refactor auth middleware" priority="Medium" status="Todo" />
                <TaskItem title="Fix dark mode flash bug" priority="High" status="In Progress" />
                <TaskItem title="UI components library" priority="Low" status="Done" />
                <TaskItem title="API Documentation update" priority="Medium" status="Todo" />
              </div>
            </div>

            {/* Progress / Sidebar */}
            <div className="col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Sprint Progress</h3>
                <div className="relative flex items-center justify-center py-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r="56" fill="transparent"
                      stroke="#4f46e5" strokeWidth="8"
                      strokeDasharray="351.8" strokeDashoffset="123"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">65%</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Done</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Remaining</span>
                    <span className="text-slate-900">4 days</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[65%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-2xl text-white shadow-xl">
                <h3 className="font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-indigo-400" />
                  Team Update
                </h3>
                <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
                  "Don't forget the retrospection meeting today at 4 PM! Bring your best ideas."
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-700/50 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/50 flex items-center justify-center text-[10px]">MJ</div>
                  <span className="text-xs text-indigo-200">Sarah from HR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
