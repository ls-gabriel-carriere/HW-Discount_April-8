import React, { useState } from "react";
import { 
  Trash2, 
  Edit, 
  Plus, 
  X, 
  Search, 
  User as UserIcon, 
  Shield, 
  MapPin, 
  Filter,
  Save,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "../constants/users";
import { cn } from "../lib/utils";

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onClose: () => void;
  onReset: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onClose,
  onReset
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [funnelFilter, setFunnelFilter] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<User>({
    id: "",
    first: "",
    last: "",
    role: "admin",
    region: "Benelux",
    funnel: "Inbound"
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.first} ${u.last}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = regionFilter === "All" || u.region === regionFilter;
    const matchesFunnel = funnelFilter === "All" || u.funnel === funnelFilter;

    return matchesSearch && matchesRegion && matchesFunnel;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.id) return;
    onAddUser(newUser);
    setIsAdding(false);
    setNewUser({
      id: "",
      first: "",
      last: "",
      role: "admin",
      region: "Benelux",
      funnel: "Inbound"
    });
  };

  const handleUpdateSubmit = (id: string, updates: Partial<User>) => {
    onUpdateUser(id, updates);
    setEditingId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">User Management</h2>
            <p className="text-zinc-500 text-sm">Manage access for all sales representatives</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (confirm("Reset all users to default?")) {
                  onReset();
                }
              }}
              className="px-6 py-3 rounded-2xl bg-white border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 rounded-2xl bg-black text-white font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-6 border-b border-zinc-100 bg-white flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              className="w-full !pl-12 bg-zinc-100 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-2xl py-3"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-zinc-100 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-zinc-600 focus:bg-white focus:border-black focus:ring-0"
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
            >
              <option value="All">All Regions</option>
              <option value="Benelux">Benelux</option>
              <option value="France">France</option>
              <option value="Global">Global</option>
            </select>
            <select 
              className="bg-zinc-100 border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-zinc-600 focus:bg-white focus:border-black focus:ring-0"
              value={funnelFilter}
              onChange={e => setFunnelFilter(e.target.value)}
            >
              <option value="All">All Funnels</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-2xl text-zinc-500 text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>{filteredUsers.length} Users Found</span>
          </div>
        </div>

        {/* User List Table */}
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Funnel</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <AnimatePresence mode="popLayout">
                  {isAdding && (
                    <motion.tr 
                      initial={{ opacity: 0, bg: "rgba(0,0,0,0.05)" }}
                      animate={{ opacity: 1, bg: "transparent" }}
                      className="bg-zinc-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <input 
                            placeholder="First"
                            className="text-sm py-1.5 px-3 rounded-lg border-zinc-200 w-24"
                            value={newUser.first}
                            onChange={e => setNewUser({...newUser, first: e.target.value})}
                            autoFocus
                          />
                          <input 
                            placeholder="Last"
                            className="text-sm py-1.5 px-3 rounded-lg border-zinc-200 w-24"
                            value={newUser.last}
                            onChange={e => setNewUser({...newUser, last: e.target.value})}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          placeholder="ID"
                          className="text-sm py-1.5 px-3 rounded-lg border-zinc-200 w-32"
                          value={newUser.id}
                          onChange={e => setNewUser({...newUser, id: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="text-sm py-1.5 px-3 rounded-lg border-zinc-200"
                          value={newUser.region}
                          onChange={e => setNewUser({...newUser, region: e.target.value})}
                        >
                          <option value="Benelux">Benelux</option>
                          <option value="France">France</option>
                          <option value="Global">Global</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="text-sm py-1.5 px-3 rounded-lg border-zinc-200"
                          value={newUser.funnel}
                          onChange={e => setNewUser({...newUser, funnel: e.target.value})}
                        >
                          <option value="Inbound">Inbound</option>
                          <option value="Outbound">Outbound</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={handleAddSubmit}
                            className="p-2 rounded-lg bg-black text-white hover:bg-zinc-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsAdding(false)}
                            className="p-2 rounded-lg bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )}

                  {filteredUsers.map(user => (
                    <motion.tr 
                      layout
                      key={user.id}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        {editingId === user.id ? (
                          <div className="flex gap-2">
                            <input 
                              className="text-sm py-1.5 px-3 rounded-lg border-zinc-200 w-24"
                              value={user.first}
                              onChange={e => onUpdateUser(user.id, { first: e.target.value })}
                            />
                            <input 
                              className="text-sm py-1.5 px-3 rounded-lg border-zinc-200 w-24"
                              value={user.last}
                              onChange={e => onUpdateUser(user.id, { last: e.target.value })}
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-zinc-900">{user.first} {user.last}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-zinc-500">{user.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === user.id ? (
                          <select 
                            className="text-sm py-1.5 px-3 rounded-lg border-zinc-200"
                            value={user.region}
                            onChange={e => onUpdateUser(user.id, { region: e.target.value })}
                          >
                            <option value="Benelux">Benelux</option>
                            <option value="France">France</option>
                            <option value="Global">Global</option>
                          </select>
                        ) : (
                          <span className="text-sm text-zinc-600">{user.region}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === user.id ? (
                          <select 
                            className="text-sm py-1.5 px-3 rounded-lg border-zinc-200"
                            value={user.funnel}
                            onChange={e => onUpdateUser(user.id, { funnel: e.target.value })}
                          >
                            <option value="Inbound">Inbound</option>
                            <option value="Outbound">Outbound</option>
                          </select>
                        ) : (
                          <span className="text-sm text-zinc-600">{user.funnel}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingId === user.id ? (
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-lg bg-zinc-900 text-white hover:bg-black"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => setEditingId(user.id)}
                              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
