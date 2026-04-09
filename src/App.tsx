import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  Check,
  Info,
  AlertCircle,
  Camera,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  LayoutDashboard,
  LogOut,
  Globe,
  Flag,
  MapPin,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  Users,
  FileText,
  Settings,
  Trophy,
  ChevronRight,
  RotateCcw,
  Slack,
  Download
} from "lucide-react";
import { cn } from "./lib/utils";
import { INITIAL_USERS } from "./constants/users";
import type { User } from "./constants/users";
import { UserManagement } from "./components/UserManagement";

// --- Types ---

interface DealData {
  accountName: string;
  listPrice: number | "";
  salesPrice: number | "";
  softwareMrr: number | "";
  payMrr: number | "";
  isPayMrrEnabled: boolean;
  justification: string;
  salesforceLink?: string;
}

// --- Utils ---

const formatNumber = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === "") return "";
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

const Footer = ({ isScreenshotting }: { isScreenshotting?: boolean }) => {
  if (isScreenshotting) return null;
  return (
    <footer className="mt-8 py-8 border-t border-zinc-100 flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-zinc-500 font-semibold text-sm">Questions or feedback?</p>
      </div>
      <a 
        href="https://grid-lightspeedhq.enterprise.slack.com/archives/C0AS5HT32BT" 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 group"
      >
        <Slack className="w-3.5 h-3.5 text-[#4A154B]" />
        <span>Share in Slack</span>
      </a>
    </footer>
  );
};

// --- Components ---

const ManagerDashboard = ({ onLogout, onOpenUserManagement, allUsers, onTakeScreenshot, isScreenshotting }: { onLogout: () => void, onOpenUserManagement: () => void, allUsers: User[], onTakeScreenshot: () => void, isScreenshotting: boolean }) => {
  const [activeRegion, setActiveRegion] = useState<string>("Global");
  const [activeFunnel, setActiveFunnel] = useState<string>("All");
  const [activeUser, setActiveUser] = useState<string>("All");
  const [showWoW, setShowWoW] = useState(true);
  
  // Date Range State
  const [startDate, setStartDate] = useState<string>("2026-04-09");
  const [endDate, setEndDate] = useState<string>("2026-07-02"); // 12 weeks later
  
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [refreshKey, setRefreshKey] = useState(0);

  const BASE_DATE = useMemo(() => new Date(2026, 3, 9), []); // April 9, 2026

  // Generate 12 weeks of empty activity data for each user
  const userActivityData = useMemo(() => {
    const data: Record<string, any[]> = {};
    allUsers.forEach(user => {
      const userWeeks = [];
      for (let i = 0; i < 12; i++) {
        const dailyData = [];
        for (let d = 0; d < 7; d++) {
          dailyData.push({
            logins: 0,
            screenshots: 0,
            approvals: 0
          });
        }

        userWeeks.push({
          weekNum: i,
          logins: 0,
          screenshots: 0,
          approvals: 0,
          daily: dailyData,
          userId: user.id,
          userName: `${user.first} ${user.last}`,
          region: user.region,
          funnel: user.funnel
        });
      }
      data[user.id] = userWeeks;
    });
    return data;
  }, [allUsers]);

  // Aggregate data based on filters
  const processedData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate days between start and end
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (viewMode === "week") {
      const numWeeks = Math.ceil(diffDays / 7);
      const weeks = Array.from({ length: numWeeks }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + (i * 7));
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weekNum: i,
          logins: 0,
          screenshots: 0,
          approvals: 0,
          loginsInbound: 0,
          loginsOutbound: 0,
          screenshotsInbound: 0,
          screenshotsOutbound: 0,
          approvalsInbound: 0,
          approvalsOutbound: 0,
          timestamp: d.getTime()
        };
      });

      allUsers.forEach(user => {
        if (activeUser !== "All" && user.id !== activeUser) return;
        if (activeRegion !== "Global" && user.region !== activeRegion) return;
        if (activeFunnel !== "All" && user.funnel !== activeFunnel) return;

        const userData = userActivityData[user.id] || [];
        
        userData.forEach((weekData) => {
          const weekStart = new Date(BASE_DATE);
          weekStart.setDate(weekStart.getDate() + (weekData.weekNum * 7));
          
          // Check if this week falls within our selected range
          weeks.forEach((w, idx) => {
            const wStart = new Date(start);
            wStart.setDate(wStart.getDate() + (idx * 7));
            const wEnd = new Date(wStart);
            wEnd.setDate(wEnd.getDate() + 7);

            if (weekStart >= wStart && weekStart < wEnd) {
              w.logins += weekData.logins;
              w.screenshots += weekData.screenshots;
              w.approvals += weekData.approvals;
              
              if (user.funnel === "Inbound") {
                w.loginsInbound += weekData.logins;
                w.screenshotsInbound += weekData.screenshots;
                w.approvalsInbound += weekData.approvals;
              } else {
                w.loginsOutbound += weekData.logins;
                w.screenshotsOutbound += weekData.screenshots;
                w.approvalsOutbound += weekData.approvals;
              }
            }
          });
        });
      });

      return weeks;
    } else {
      // Daily view
      const days = Array.from({ length: diffDays }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return {
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: date.getTime(),
          logins: 0,
          screenshots: 0,
          approvals: 0
        };
      });

      allUsers.forEach(user => {
        if (activeUser !== "All" && user.id !== activeUser) return;
        if (activeRegion !== "Global" && user.region !== activeRegion) return;
        if (activeFunnel !== "All" && user.funnel !== activeFunnel) return;

        const userData = userActivityData[user.id] || [];
        
        userData.forEach((weekData) => {
          weekData.daily.forEach((dayData: any, dIdx: number) => {
            const dayDate = new Date(BASE_DATE);
            dayDate.setDate(dayDate.getDate() + (weekData.weekNum * 7) + dIdx);
            
            const targetDay = days.find(d => {
              const dDate = new Date(d.timestamp);
              return dDate.getFullYear() === dayDate.getFullYear() &&
                     dDate.getMonth() === dayDate.getMonth() &&
                     dDate.getDate() === dayDate.getDate();
            });

            if (targetDay) {
              targetDay.logins += dayData.logins;
              targetDay.screenshots += dayData.screenshots;
              targetDay.approvals += dayData.approvals;
            }
          });
        });
      });

      return days;
    }
  }, [allUsers, userActivityData, activeRegion, activeFunnel, activeUser, startDate, endDate, viewMode, BASE_DATE]);

  // Calculate Leaderboard
  const leaderboard = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const scores = allUsers.map(user => {
      const userData = userActivityData[user.id] || [];
      
      const totals = { logins: 0, screenshots: 0, approvals: 0 };
      
      userData.forEach(weekData => {
        weekData.daily.forEach((dayData: any, dIdx: number) => {
          const dayDate = new Date(BASE_DATE);
          dayDate.setDate(dayDate.getDate() + (weekData.weekNum * 7) + dIdx);
          
          if (dayDate >= start && dayDate <= end) {
            totals.logins += dayData.logins;
            totals.screenshots += dayData.screenshots;
            totals.approvals += dayData.approvals;
          }
        });
      });

      // Weighted Score: (Logins * 1) + (Screenshots * 2) + (Approvals * 2)
      const score = (totals.logins * 1) + (totals.screenshots * 2) + (totals.approvals * 2);

      return {
        ...user,
        ...totals,
        score
      };
    });

    return scores.sort((a, b) => b.score - a.score);
  }, [allUsers, userActivityData, startDate, endDate, BASE_DATE]);

  const calculateWoW = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const metrics = useMemo(() => {
    const totals = processedData.reduce((acc, curr) => ({
      logins: acc.logins + curr.logins,
      screenshots: acc.screenshots + curr.screenshots,
      approvals: acc.approvals + curr.approvals
    }), { logins: 0, screenshots: 0, approvals: 0 });

    // For WoW, we'll still use the last two periods if available
    const current = processedData[processedData.length - 1];
    const previous = processedData[processedData.length - 2];

    return {
      logins: {
        total: totals.logins,
        wow: previous ? calculateWoW(current.logins, previous.logins) : 0
      },
      screenshots: {
        total: totals.screenshots,
        wow: previous ? calculateWoW(current.screenshots, previous.screenshots) : 0
      },
      approvals: {
        total: totals.approvals,
        wow: previous ? calculateWoW(current.approvals, previous.approvals) : 0
      }
    };
  }, [processedData]);

  const handleExport = () => {
    // Prepare data for export
    const headers = ["Rank", "First Name", "Last Name", "Region", "Funnel", "Logins", "Screenshots", "Approvals", "Activity Score"];
    const rows = leaderboard.map((user, idx) => [
      idx + 1,
      user.first,
      user.last,
      user.region,
      user.funnel,
      user.logins,
      user.screenshots,
      user.approvals,
      user.score
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `manager-insights-${activeRegion}-${activeFunnel}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChartData = (data: any[], title: string) => {
    if (!data || data.length === 0) return;
    
    const keys = Object.keys(data[0]).filter(k => k !== 'weekNum' && k !== 'userId' && k !== 'userName' && k !== 'region' && k !== 'funnel');
    const headers = keys.join(",");
    const rows = data.map(item => keys.map(key => item[key]).join(","));
    const csvContent = [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChartImage = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: "#FFFFFF",
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          const exclusionClasses = ['export-button', 'opacity-0'];
          if (node instanceof HTMLElement) {
            return !exclusionClasses.some(cls => node.classList.contains(cls));
          }
          return true;
        }
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
      link.click();
    } catch (error) {
      console.error("Chart export failed:", error);
    }
  };

  const CombinedTrendChart = ({ data }: { data: any[] }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    
    return (
      <div ref={chartRef} className="glass p-8 rounded-[2.5rem] mb-8 relative group/chart">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-zinc-900">Unified Activity Trend</h3>
              <div className="flex bg-zinc-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                    viewMode === "week" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setViewMode("day")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                    viewMode === "day" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Daily
                </button>
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium">Combined view of Logins, Screenshots, and Approvals</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 mr-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Logins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Screenshots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Approvals</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover/chart:opacity-100 transition-opacity">
              <button 
                onClick={() => exportChartData(data, `Unified Activity Trend - ${viewMode}`)}
                className="export-button p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => exportChartImage(chartRef, `Unified Activity Trend - ${viewMode}`)}
                className="export-button p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
                title="Export PNG"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} 
                dy={10}
                interval={viewMode === "day" ? 6 : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: "20px", 
                  border: "none", 
                  boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
                  padding: "16px"
                }}
                itemStyle={{ fontWeight: 700, fontSize: "12px" }}
                labelStyle={{ fontWeight: 800, color: "#18181b", marginBottom: "8px" }}
              />
              <Line 
                type="monotone" 
                dataKey="logins" 
                name="Logins" 
                stroke="#3b82f6" 
                strokeWidth={viewMode === "day" ? 2 : 4} 
                dot={viewMode === "day" ? false : { r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="screenshots" 
                name="Screenshots" 
                stroke="#10b981" 
                strokeWidth={viewMode === "day" ? 2 : 4} 
                dot={viewMode === "day" ? false : { r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="approvals" 
                name="Approvals" 
                stroke="#ef4444" 
                strokeWidth={viewMode === "day" ? 2 : 4} 
                dot={viewMode === "day" ? false : { r: 6, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, data, dataKeys, colors }: { title: string, data: any[], dataKeys: string[], colors: string[] }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    
    return (
      <div ref={chartRef} className="glass p-6 rounded-3xl flex flex-col gap-4 relative group/chart">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {title === "Logins" && <Users className="w-5 h-5 text-blue-500" />}
            {title === "Screenshots" && <Camera className="w-5 h-5 text-emerald-500" />}
            {title === "Approvals" && <FileText className="w-5 h-5 text-red-500" />}
            {title} Trend
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover/chart:opacity-100 transition-opacity">
            <button 
              onClick={() => exportChartData(data, `${title} Trend`)}
              className="export-button p-1.5 rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-all"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => exportChartImage(chartRef, `${title} Trend`)}
              className="export-button p-1.5 rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-all"
              title="Export PNG"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#94a3b8" }} 
                interval={viewMode === "day" ? 6 : 0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }} />
              <Bar dataKey={dataKeys[0]} name="Inbound" fill={colors[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey={dataKeys[1]} name="Outbound" fill={colors[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#D1102D] flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Manager Insights</h1>
            </div>
            <p className="text-zinc-500 font-medium">Performance overview & granular drill-down</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* WoW Toggle */}
            <button 
              onClick={() => setShowWoW(!showWoW)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                showWoW ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200"
              )}
            >
              WoW Analysis {showWoW ? "ON" : "OFF"}
            </button>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">From</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-0 text-xs font-bold text-zinc-900 focus:ring-0 h-4"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-px h-6 bg-zinc-100 mx-1" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">To</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-0 text-xs font-bold text-zinc-900 focus:ring-0 h-4"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Insights
            </button>

            {!isScreenshotting && (
              <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  Export CSV
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onTakeScreenshot}
                  className="relative pl-6 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-black flex items-center gap-3 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] transition-all group"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider ml-1">Snapshot</span>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm transition-transform group-hover:translate-x-0.5">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              </div>
            )}

            <button 
              onClick={onOpenUserManagement}
              className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Settings className="w-4 h-4" />
              User Management
            </button>
            <button 
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-black text-white hover:bg-zinc-800 transition-all shadow-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Filters Bar */}
        <div className="glass p-4 rounded-3xl mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-zinc-900 focus:ring-0 p-0 pr-8"
              value={activeRegion}
              onChange={e => {
                setActiveRegion(e.target.value);
                setActiveUser("All");
              }}
            >
              <option value="Global">Global View</option>
              <option value="France">France</option>
              <option value="Benelux">Benelux</option>
            </select>
          </div>
          <div className="w-px h-6 bg-zinc-200 hidden md:block" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-400" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-zinc-900 focus:ring-0 p-0 pr-8"
              value={activeFunnel}
              onChange={e => setActiveFunnel(e.target.value)}
            >
              <option value="All">All Sales Motions</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>
          <div className="w-px h-6 bg-zinc-200 hidden md:block" />
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-zinc-400" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-zinc-900 focus:ring-0 p-0 pr-8 max-w-[200px]"
              value={activeUser}
              onChange={e => setActiveUser(e.target.value)}
            >
              <option value="All">All Users</option>
              {allUsers
                .filter(u => activeRegion === "Global" || u.region === activeRegion)
                .map(u => (
                  <option key={u.id} value={u.id}>{u.first} {u.last}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Logins", value: metrics.logins.total, wow: metrics.logins.wow, icon: Users, color: "blue" },
            { label: "Screenshots", value: metrics.screenshots.total, wow: metrics.screenshots.wow, icon: Camera, color: "emerald" },
            { label: "Approvals", value: metrics.approvals.total, wow: metrics.approvals.wow, icon: FileText, color: "red" }
          ].map((m, i) => (
            <div key={i} className="glass p-6 rounded-3xl flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", `bg-${m.color}-500/10`)}>
                <m.icon className={cn("w-6 h-6", `text-${m.color}-500`)} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{m.label}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-2xl font-black text-zinc-900">{formatNumber(m.value)}</h4>
                  {showWoW && (
                    <span className={cn(
                      "text-[10px] font-bold flex items-center gap-0.5",
                      m.wow >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {m.wow >= 0 ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(m.wow).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Unified Trend Graph */}
        <CombinedTrendChart data={processedData} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <ChartCard 
            title="Logins" 
            data={processedData} 
            dataKeys={["loginsInbound", "loginsOutbound"]} 
            colors={["#3b82f6", "#93c5fd"]} 
          />
          <ChartCard 
            title="Screenshots" 
            data={processedData} 
            dataKeys={["screenshotsInbound", "screenshotsOutbound"]} 
            colors={["#10b981", "#6ee7b7"]} 
          />
          <ChartCard 
            title="Approvals" 
            data={processedData} 
            dataKeys={["approvalsInbound", "approvalsOutbound"]} 
            colors={["#ef4444", "#fca5a5"]} 
          />
        </div>

        {/* Leaderboard */}
        <div className="glass rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Activity Leaderboard</h3>
              <p className="text-zinc-500 text-sm font-medium">Weighted Score: Logins(1) + Screenshots(2) + Approvals(2)</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Ranking
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Rank</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Logins</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Screenshots</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Approvals</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Activity Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leaderboard.slice(0, 10).map((user, idx) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                        idx === 0 ? "bg-yellow-100 text-yellow-700" : 
                        idx === 1 ? "bg-zinc-200 text-zinc-700" :
                        idx === 2 ? "bg-orange-100 text-orange-700" : "text-zinc-400"
                      )}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">
                          {user.first[0]}{user.last[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{user.first} {user.last}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{user.region} • {user.funnel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-zinc-600">{formatNumber(user.logins)}</td>
                    <td className="px-8 py-4 text-sm font-medium text-zinc-600">{formatNumber(user.screenshots)}</td>
                    <td className="px-8 py-4 text-sm font-medium text-zinc-600">{formatNumber(user.approvals)}</td>
                    <td className="px-8 py-4 text-right">
                      <span className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-black">
                        {formatNumber(user.score)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Footer isScreenshotting={isScreenshotting} />
      </div>
    </div>
  );
};

export default function App() {
  const [deal, setDeal] = useState<DealData>({
    accountName: "",
    listPrice: "",
    salesPrice: "",
    softwareMrr: "",
    payMrr: 120,
    isPayMrrEnabled: true,
    justification: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showListPriceInfo, setShowListPriceInfo] = useState(false);
  const [showSalesPriceInfo, setShowSalesPriceInfo] = useState(false);
  const [showPayMrrInfo, setShowPayMrrInfo] = useState(false);
  const [showSwMrrInfo, setShowSwMrrInfo] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | null>(null);
  const [userName, setUserName] = useState<{ first: string, last: string, region?: string, funnel?: string } | null>(null);
  const [loginTimestamp, setLoginTimestamp] = useState<string | null>(null);
  const [screenshotTimestamp, setScreenshotTimestamp] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ userId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const appRef = useRef<HTMLDivElement>(null);

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("hw_discount_users_v2");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [showUserManagement, setShowUserManagement] = useState(false);

  useEffect(() => {
    localStorage.setItem("hw_discount_users_v2", JSON.stringify(allUsers));
  }, [allUsers]);

  const handleNumericChange = (field: keyof DealData, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setDeal(prev => ({ ...prev, [field]: cleanValue === "" ? "" : Number(cleanValue) }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = allUsers.find(u => u.id.toLowerCase() === loginData.userId.toLowerCase());

    if (user && user.pw === loginData.password) {
      setIsAuthenticated(true);
      setUserRole(user.role);
      setUserName({ 
        first: user.first, 
        last: user.last, 
        region: user.region, 
        funnel: user.funnel 
      });
      setLoginTimestamp(new Date().toLocaleString());
      setLoginError("");
    } else {
      setLoginError("Invalid User ID or Password");
    }
  };

  const handleAddUser = (user: User) => {
    setAllUsers([...allUsers, user]);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    setAllUsers(allUsers.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const handleDeleteUser = (id: string) => {
    setAllUsers(allUsers.filter(u => u.id !== id));
  };

  const handleResetUsers = () => {
    setAllUsers(INITIAL_USERS);
    localStorage.removeItem("hw_discount_users");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setLoginData({ userId: "", password: "" });
  };

  const resetDeal = () => {
    setDeal({
      accountName: "",
      listPrice: "",
      salesPrice: "",
      softwareMrr: "",
      payMrr: 120,
      isPayMrrEnabled: true,
      justification: "",
      salesforceLink: ""
    });
    setSubmitStatus("idle");
  };

  const takeScreenshot = async () => {
    if (!appRef.current) return;
    
    setScreenshotTimestamp(new Date().toLocaleString());
    setIsScreenshotting(true);
    
    // Wait for the next paint to ensure layout shifts are applied
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(appRef.current!, {
          backgroundColor: "#FFFFFF",
          quality: 1,
          pixelRatio: 2,
          // Force a specific width for the screenshot to ensure desktop layout
          width: 1280,
        });
        
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `deal-approval-${deal.accountName || "unnamed"}.png`;
        link.click();
      } catch (error) {
        console.error("Screenshot failed:", error);
      } finally {
        setIsScreenshotting(false);
      }
    }, 150);
  };

  // --- Logic ---
  
  const metrics = useMemo(() => {
    const listPrice = deal.listPrice || 0;
    const salesPrice = deal.salesPrice || 0;
    const effectivePayMrr = deal.isPayMrrEnabled ? (deal.payMrr || 0) : 0;
    const totalMrr = (deal.softwareMrr || 0) + effectivePayMrr;

    // Discount % = (List - Sales) / List
    const discountPercent = listPrice > 0 ? ((listPrice - salesPrice) / listPrice) * 100 : 0;
    
    // Cost = List * 0.7 (30% margin)
    const hardwareCost = listPrice * 0.7;
    
    // Payback = (Total Product Cost - Total Sales Price) / MRR
    const rawPayback = totalMrr > 0 ? Math.max(0, (listPrice - salesPrice) / totalMrr) : 0;
    const paybackMonths = rawPayback.toFixed(1);

    const hwLoss = listPrice - salesPrice;
    const isMissingSoftwareMrr = !deal.softwareMrr || deal.softwareMrr <= 0;
    const isEmpty = !deal.accountName && !deal.listPrice && isMissingSoftwareMrr;

    let approvalLevel: "auto" | "manager" | "director" = "auto";
    const isOutbound = userName?.funnel !== "Inbound";

    if (isMissingSoftwareMrr) {
      // If software MRR is missing, it cannot be auto-approved
      approvalLevel = "manager";
    } else if (isOutbound) {
      if (rawPayback > 12) {
        approvalLevel = "director";
      } else if (rawPayback > 4.5) {
        approvalLevel = "manager";
      }
    } else {
      if (rawPayback > 8) {
        approvalLevel = "director";
      } else if (rawPayback > 3.5) {
        approvalLevel = "manager";
      }
    }

    return {
      discountPercent,
      paybackMonths,
      rawPayback,
      approvalLevel,
      needsApproval: approvalLevel !== "auto",
      hardwareCost,
      hwLoss,
      isEmpty,
      isMissingSoftwareMrr
    };
  }, [deal, userName]);

  const handleSubmit = async () => {
    if (metrics.needsApproval && !deal.justification) {
      alert("Please provide a justification for this discount.");
      return;
    }

    setIsSubmitting(true);
    const submitTimestamp = new Date().toLocaleString();
    try {
      const response = await fetch("https://hooks.zapier.com/hooks/catch/26900047/unfhniu/", {
        method: "POST",
        body: JSON.stringify({
          ...deal,
          userId: loginData.userId,
          firstName: userName?.first,
          lastName: userName?.last,
          region: userName?.region,
          funnel: userName?.funnel,
          loginTime: loginTimestamp,
          screenshotTime: screenshotTimestamp,
          submitTime: submitTimestamp,
          discount: metrics.discountPercent,
          payback: metrics.paybackMonths,
          hwLoss: metrics.hwLoss,
          hardwareCost: metrics.hardwareCost,
          totalMrr: (deal.softwareMrr || 0) + (deal.isPayMrrEnabled ? (deal.payMrr || 0) : 0),
          salesforceLink: deal.salesforceLink,
          approvalLevel: metrics.approvalLevel
        })
      });
      
      if (response.ok) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] w-full max-w-[440px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative"
        >
          {/* Top Accent Bar */}
          <div className="h-1.5 bg-[#D1102D] w-full absolute top-0 left-0" />
          
          <div className="p-10 pt-12">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-[#D1102D] flex items-center justify-center mb-6 shadow-[0_8px_20px_rgba(209,16,45,0.3)]">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">Lightspeed Hardware Approval Calculator</h1>
              <p className="text-zinc-500 text-sm font-medium">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 ml-1">Username</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    className="w-full !pl-14 pr-4 bg-[#F3F4F6] border-transparent focus:bg-white focus:border-[#D1102D] focus:ring-0 transition-all rounded-xl py-4 text-zinc-900 placeholder:text-zinc-400"
                    placeholder="Enter your username"
                    value={loginData.userId}
                    onChange={e => setLoginData({...loginData, userId: e.target.value})}
                    required
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#D1102D] transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 ml-1">Password</label>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full !pl-14 !pr-14 bg-[#F3F4F6] border-transparent focus:bg-white focus:border-[#D1102D] focus:ring-0 transition-all rounded-xl py-4 text-zinc-900 placeholder:text-zinc-400"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                    required
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#D1102D] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[#D1102D] text-xs font-semibold flex items-center gap-2 bg-red-50 p-4 rounded-xl border border-red-100"
                >
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full pl-10 pr-3 py-3 rounded-full bg-gradient-to-r from-[#D1102D] to-[#800A1B] text-white font-black flex items-center justify-between transition-all active:scale-[0.98] shadow-[0_15px_30px_-10px_rgba(209,16,45,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(209,16,45,0.5)] hover:-translate-y-0.5 group"
              >
                <span className="text-lg tracking-tight">Sign In</span>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#D1102D] shadow-lg transition-transform group-hover:translate-x-1">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </button>
            </form>

            <div className="mt-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-zinc-200 flex-1" />
                <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Need Help?</span>
                <div className="h-px bg-zinc-200 flex-1" />
              </div>
              
              <p className="text-sm text-zinc-500 text-center">
                Forgot your credentials? <a href="https://grid-lightspeedhq.enterprise.slack.com/archives/C0AS5HT32BT" target="_blank" rel="noopener noreferrer" className="text-[#D1102D] font-bold hover:underline">Contact your admin</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      {userRole === "manager" ? (
        <div ref={appRef} className={cn("min-h-screen bg-[#F4F4F4]", isScreenshotting && "w-[1280px]")}>
          <ManagerDashboard 
            onLogout={handleLogout} 
            onOpenUserManagement={() => setShowUserManagement(true)} 
            allUsers={allUsers}
            onTakeScreenshot={takeScreenshot}
            isScreenshotting={isScreenshotting}
          />
        </div>
      ) : (
        <div ref={appRef} className={cn("min-h-screen bg-white text-zinc-900", isScreenshotting && "w-[1280px]")}>
          {/* Logout Button */}
          {!isScreenshotting && (
            <div className="fixed top-4 right-4 z-50">
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
              >
                Logout
              </button>
            </div>
          )}
          {/* Main Content */}
          <main className={cn(
            "p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full transition-all duration-300",
            isScreenshotting && "p-16 w-[1280px] max-w-none"
          )}>
            <header className={cn(
              "mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6",
              isScreenshotting && "flex-row items-end"
            )}>
              <div>
                <div className="flex flex-col">
                  <h1 className={cn(
                    "text-4xl font-bold tracking-tight",
                    isScreenshotting && "text-5xl"
                  )}>{userName?.funnel === "Inbound" ? "Inbound Sales" : "Outbound Sales"}</h1>
                  <span className={cn(
                    "text-xl font-medium text-zinc-400 tracking-tight",
                    isScreenshotting && "text-2xl"
                  )}>Hardware Approval Calculator</span>
                  {userName && (
                    <div className="mt-4 px-4 py-2 bg-zinc-100 rounded-xl inline-flex items-center gap-2 w-fit">
                      <span className="text-sm font-bold text-zinc-600">Hi {userName.first} {userName.last} ({userName.region})</span>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className={cn(
              "grid gap-8",
              isScreenshotting ? "grid-cols-12" : "grid-cols-1 lg:grid-cols-12"
            )}>
              {/* Left Column: Inputs */}
              <div className={cn(
                "flex flex-col",
                isScreenshotting ? "col-span-5" : "lg:col-span-5"
              )}>
                <section className="glass p-10 rounded-[2.5rem] flex flex-col gap-8 h-full">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold">
                      Deal Details
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium italic">
                      Values can be entered in any currency—just be sure to use the same across all fields
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="whitespace-nowrap">Account Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Acme Corp" 
                        className="w-full"
                        value={deal.accountName}
                        onChange={e => setDeal({...deal, accountName: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="mb-0 whitespace-nowrap">Software MRR</label>
                          <button 
                            type="button"
                            onClick={() => setShowSwMrrInfo(!showSwMrrInfo)}
                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {showSwMrrInfo && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[10px] text-blue-400 mb-2 leading-tight font-medium"
                          >
                            Total software MRR
                          </motion.div>
                        )}
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full"
                          value={formatNumber(deal.softwareMrr)}
                          onChange={e => handleNumericChange("softwareMrr", e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <label className="mb-0 whitespace-nowrap">Pay MRR</label>
                            <button 
                              type="button"
                              onClick={() => setShowPayMrrInfo(!showPayMrrInfo)}
                              className="text-zinc-400 hover:text-blue-500 transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => setDeal({...deal, isPayMrrEnabled: !deal.isPayMrrEnabled})}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                              deal.isPayMrrEnabled ? "bg-blue-500" : "bg-zinc-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                deal.isPayMrrEnabled ? "translate-x-4.5" : "translate-x-0.5"
                              )}
                            />
                          </button>
                        </div>
                        {showPayMrrInfo && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[10px] text-blue-400 mb-2 leading-tight font-medium"
                          >
                            By default, Pay MRR is set to 120
                          </motion.div>
                        )}
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className={cn(
                            "w-full transition-opacity",
                            !deal.isPayMrrEnabled && "opacity-50 pointer-events-none"
                          )}
                          value={formatNumber(deal.payMrr)}
                          onChange={e => handleNumericChange("payMrr", e.target.value)}
                          disabled={!deal.isPayMrrEnabled}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="mb-0 whitespace-nowrap">Total Product Cost</label>
                          <button 
                            type="button"
                            onClick={() => setShowListPriceInfo(!showListPriceInfo)}
                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {showListPriceInfo && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[10px] text-blue-400 mb-2 leading-tight font-medium"
                          >
                            Total product cost
                          </motion.div>
                        )}
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full"
                          value={formatNumber(deal.listPrice)}
                          onChange={e => handleNumericChange("listPrice", e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="mb-0 whitespace-nowrap">Total Sales Price</label>
                          <button 
                            type="button"
                            onClick={() => setShowSalesPriceInfo(!showSalesPriceInfo)}
                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {showSalesPriceInfo && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[10px] text-blue-400 mb-2 leading-tight font-medium"
                          >
                            Total sales price
                          </motion.div>
                        )}
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full"
                          value={formatNumber(deal.salesPrice)}
                          onChange={e => handleNumericChange("salesPrice", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Metrics & Approval */}
              <div className={cn(
                "flex flex-col",
                isScreenshotting ? "col-span-7" : "lg:col-span-7"
              )}>

                {/* Approval Workflow */}
                <AnimatePresence mode="wait">
                  {submitStatus === "success" ? (
                    <motion.div 
                      key="success-message"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass p-12 rounded-[2rem] border-emerald-500/20 bg-emerald-500/10 flex flex-col items-center text-center h-full justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-3xl font-bold mb-2">Approval Submitted!</h3>
                      <p className="text-zinc-500 max-w-sm mb-8">
                        Your deal has been successfully sent to the sales manager for review. You will be notified via Slack once a decision is made.
                      </p>
                      <button 
                        onClick={resetDeal}
                        className="px-10 py-4 rounded-2xl bg-black text-white font-bold hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        Start New Calculation
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : metrics.isEmpty ? (
                    <motion.div 
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass p-12 rounded-[2rem] border-zinc-200 bg-zinc-50/50 flex flex-col items-center text-center h-full justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
                        <Info className="w-10 h-10 text-zinc-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 mb-2">Ready to calculate?</h3>
                      <p className="text-zinc-500 max-w-xs">
                        Get started by adding your deal information in the form on the left.
                      </p>
                    </motion.div>
                  ) : metrics.isMissingSoftwareMrr ? (
                    <motion.div 
                      key="missing-mrr"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass p-12 rounded-[2rem] border-blue-200 bg-blue-50/50 flex flex-col items-center text-center h-full justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 mb-2">Add Software MRR</h3>
                      <p className="text-zinc-500 max-w-xs">
                        Please enter the Software MRR to calculate the payback period and determine the approval level.
                      </p>
                    </motion.div>
                  ) : metrics.needsApproval ? (
                    <motion.div 
                      key="approval"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        "glass p-8 rounded-[2rem] h-full flex flex-col",
                        metrics.approvalLevel === "director" 
                          ? "border-red-500/20 bg-red-500/10" 
                          : "border-orange-500/20 bg-orange-500/10"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          metrics.approvalLevel === "director" ? "bg-red-500/20" : "bg-orange-500/20"
                        )}>
                          <AlertCircle className={cn(
                            "w-6 h-6",
                            metrics.approvalLevel === "director" ? "text-red-500" : "text-orange-500"
                          )} />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-xl font-bold mb-1">
                            {metrics.approvalLevel === "director" ? "VP/MD Approval Required" : "Manager Approval Required"}
                          </h3>
                          <div className="flex flex-col items-center sm:items-start mb-4">
                            <div className={cn(
                              "text-4xl font-black leading-none",
                              metrics.approvalLevel === "director" ? "text-red-500" : "text-orange-500"
                            )}>
                              {formatNumber(metrics.paybackMonths)} mo
                            </div>
                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest mt-1",
                              metrics.approvalLevel === "director" ? "text-red-500/60" : "text-orange-500/60"
                            )}>
                              HW CAC Payback
                            </div>
                          </div>
                          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                            {metrics.approvalLevel === "director" 
                              ? `This deal has a payback period exceeding ${userName?.funnel === "Inbound" ? "8" : "12"} months. VP/MD approval is required to proceed.`
                              : `This deal has a payback period between ${userName?.funnel === "Inbound" ? "3.5 and 8" : "4.5 and 12"} months. Manager approval is required to proceed.`
                            }
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold mb-2">Justification</label>
                              <textarea 
                                rows={4}
                                className="w-full resize-none"
                                placeholder="e.g. Strategic account with high expansion potential..."
                                value={deal.justification}
                                onChange={e => setDeal({...deal, justification: e.target.value})}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold mb-2 whitespace-nowrap">Link to Salesforce Opportunity</label>
                              <input 
                                type="url"
                                className="w-full"
                                placeholder="https://lightspeed.lightning.force.com/..."
                                value={deal.salesforceLink || ""}
                                onChange={e => setDeal({...deal, salesforceLink: e.target.value})}
                              />
                            </div>
                            
                            <button 
                              onClick={handleSubmit}
                              disabled={isSubmitting || !deal.justification || !deal.salesforceLink}
                              className={cn(
                                "w-full pl-10 pr-3 py-3 rounded-full font-black flex items-center justify-between transition-all relative overflow-hidden group",
                                isSubmitting || !deal.justification || !deal.salesforceLink
                                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-zinc-900 to-zinc-700 text-white hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5 shadow-xl shadow-black/10"
                              )}
                            >
                              <span className="text-lg tracking-tight">
                                {isSubmitting ? "Submitting..." : submitStatus === "success" ? "Submitted" : "Submit for Approval"}
                              </span>
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:translate-x-1",
                                isSubmitting || !deal.justification || !deal.salesforceLink ? "bg-zinc-200 text-zinc-400" : "bg-white text-zinc-900"
                              )}>
                                {isSubmitting ? (
                                  <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                                ) : submitStatus === "success" ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  <Send className="w-6 h-6" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="auto-approved"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass p-12 rounded-[2rem] border-emerald-500/20 bg-emerald-500/10 flex flex-col items-center text-center h-full justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                        <Check className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Hardware auto-approved</h3>
                      <div className="flex flex-col items-center mb-6">
                        <div className="text-6xl font-black text-emerald-500 leading-none">
                          {formatNumber(metrics.paybackMonths)} mo
                        </div>
                        <div className="text-sm font-bold uppercase tracking-widest text-emerald-500/60 mt-2">
                          HW CAC Payback
                        </div>
                      </div>
                      <p className="text-zinc-500 max-w-sm mb-8">
                        Great work! This deal is within the {userName?.funnel === "Inbound" ? "3.5" : "4.5"}-month payback threshold and is automatically approved.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {!isScreenshotting && (
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={takeScreenshot}
                            className="relative pl-10 pr-3 py-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-black flex items-center gap-6 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.6)] transition-all group overflow-hidden"
                          >
                            <span className="text-lg tracking-tight">Take a screenshot</span>
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-lg transition-transform group-hover:translate-x-1">
                              <Camera className="w-6 h-6" />
                            </div>
                          </motion.button>
                        )}
                        {!isScreenshotting && deal.listPrice > 0 && (
                          <button 
                            onClick={resetDeal}
                            className="px-8 py-4 rounded-2xl bg-white border-2 border-zinc-100 text-zinc-500 font-bold hover:text-zinc-900 hover:border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95 flex items-center gap-2"
                          >
                            Start Again
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <Footer isScreenshotting={isScreenshotting} />
          </main>
        </div>
      )}

      <AnimatePresence>
        {showUserManagement && (
          <UserManagement 
            users={allUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onClose={() => setShowUserManagement(false)}
            onReset={handleResetUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
