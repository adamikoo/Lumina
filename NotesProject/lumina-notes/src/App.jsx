import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon,
  Type, Download, Share2, Trash2, Plus, X, Search, Menu, Moon, Sun,
  MoreVertical, ChevronDown, Loader2, Sparkles, Wand2, User, Mail, Lock,
  LogOut, Cloud, LayoutGrid, Hash, Pin, PinOff, Edit3, Eye, UserCog, KeyRound, Upload, Copy, FileText, Check, Droplet, Highlighter, Move, Settings, Camera, ShieldAlert, ArrowRight, AlertCircle, RefreshCw, Send, Palette, Save, Users, Tag, Keyboard, BarChart2, Database, Undo, Redo, Mic, PenTool, Bell
} from 'lucide-react';

const FONTS = [
  { name: 'Sans Serif', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Raleway', value: 'Raleway' },
  { name: 'Nunito', value: 'Nunito' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Playfair Display', value: 'Playfair Display' },
];

const FONT_SIZES = [
  { label: 'Tiny', value: '1' },
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Medium', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'Huge', value: '6' },
  { label: 'Giant', value: '7' },
];

// --- SDK Imports ---
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, db } from './firebase';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { parseKeepTakeout } from './utils/keepImport';

// --- Configuration ---
const GEN_AI_KEY = (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || "";
const genAI = GEN_AI_KEY ? new GoogleGenerativeAI(GEN_AI_KEY) : null;

// --- Styles & Animations ---
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `}</style>
);

// --- Constants ---
const THEMES = [
  { id: 'base', label: 'Minimal', bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900' },
  { id: 'blue', label: 'Ocean', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  { id: 'green', label: 'Mint', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  { id: 'yellow', label: 'Sun', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900' },
  { id: 'dark', label: 'Midnight', bg: 'bg-dark-bg', border: 'border-dark-border', text: 'text-gray-100' },
];

const PRESET_COLORS = [
  '#000000', '#545454', '#737373', '#A6A6A6', '#D9D9D9', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

const getTheme = (id) => THEMES.find(t => t.id === id) || THEMES[0];

const stripHtml = (html) => {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// --- Helpers ---
const Portal = ({ children }) => createPortal(children, document.body);

// --- Hook: useHistory ---
const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const set = (newState) => {
    if (newState === history[index]) return;
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (index > 0) setIndex(index - 1);
  };

  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
  };

  return [history[index], set, undo, redo, index > 0, index < history.length - 1];
};

// --- Hook: useFloatingPosition ---
const useFloatingPosition = (isOpen, direction = 'down') => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        if (direction === 'up') {
          setPosition({
            bottom: window.innerHeight - rect.top + 10,
            left: rect.left
          });
        } else {
          setPosition({
            top: rect.bottom + 5,
            left: rect.left
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, direction]);

  return { buttonRef, position };
};

// --- Component: Export Menu ---
const ExportMenu = ({ title, content, className, iconSize = 18, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buttonRef, position } = useFloatingPosition(isOpen);

  useEffect(() => {
    const handleOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && !e.target.closest('.export-popover')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buttonRef]);

  const cleanText = stripHtml(content);
  const finalTitle = title || "Untitled Note";

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([cleanText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${finalTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    setIsOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(finalTitle);
    const body = encodeURIComponent(cleanText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanText);
    alert("Copied to clipboard!");
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} transition-transform active:scale-95`}
        title="Export Note"
      >
        <Download size={iconSize} /> {label}
      </button>

      {isOpen && (
        <Portal>
          <div
            className="export-popover fixed glass dark:glass-dark rounded-xl z-[9999] w-48 py-1 animate-pop-in"
            style={{ top: position.top, left: Math.min(position.left - 100, window.innerWidth - 200) }}
          >
            <button onClick={handleDownload} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center gap-2 transition-colors">
              <FileText size={16} className="text-primary-500" /> Save as .txt
            </button>
            <button onClick={handleEmail} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center gap-2 transition-colors">
              <Mail size={16} className="text-primary-500" /> Email Note
            </button>
            <button onClick={handleCopy} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center gap-2 transition-colors">
              <Copy size={16} className="text-primary-500" /> Copy Text
            </button>
          </div>
        </Portal>
      )}
    </>
  );
};

// --- Component: Profile Menu ---
const ProfileMenu = ({ user, onOpenSettings, onSignOut, isDarkMode, toggleTheme, onImport, onBackup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buttonRef, position } = useFloatingPosition(isOpen, 'up');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && !e.target.closest('.profile-popover')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buttonRef]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-2 py-2 w-full rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 active:scale-95 group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary-500/30 overflow-hidden ring-2 ring-transparent group-hover:ring-primary-200 dark:group-hover:ring-primary-900 transition-all">
          {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-100">{user.displayName || (user.isAnonymous ? 'Guest' : 'User')}</p>
          <p className="text-xs text-gray-400 truncate">{user.email || 'No email'}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <Portal>
          <div
            className="profile-popover fixed glass dark:glass-dark rounded-xl z-[9999] w-64 p-2 animate-pop-in"
            style={{ bottom: position.bottom, left: position.left + 10 }}
          >
            <div className="px-3 py-2 mb-2 border-b border-gray-100 dark:border-gray-700/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Account</p>
            </div>

            <button onClick={() => { onOpenSettings('profile'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <UserCog size={18} className="text-primary-500" /> Profile Settings
            </button>

            <button onClick={() => { onOpenSettings('account'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <KeyRound size={18} className="text-primary-500" /> Account Security
            </button>

            <div className="my-2 border-t border-gray-100 dark:border-gray-700/50" />

            <button onClick={() => { onOpenSettings('shortcuts'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <Keyboard size={18} className="text-primary-500" /> Keyboard Shortcuts
            </button>

            <button onClick={() => { onOpenSettings('stats'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <BarChart2 size={18} className="text-primary-500" /> Statistics
            </button>

            <div className="my-2 border-t border-gray-100 dark:border-gray-700/50" />

            <input type="file" ref={fileInputRef} onChange={onImport} accept=".zip" className="hidden" />
            <button onClick={() => { fileInputRef.current?.click(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <Upload size={18} className="text-primary-500" /> Import from Keep
            </button>

            <button onClick={() => { onBackup(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              <Database size={18} className="text-primary-500" /> Backup Data
            </button>

            <div className="my-2 border-t border-gray-100 dark:border-gray-700/50" />

            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
              {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-primary-500" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <div className="my-2 border-t border-gray-100 dark:border-gray-700/50" />

            <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </Portal>
      )}
    </>
  );
};

// --- Component: Share Modal ---
const ShareModal = ({ note, isOpen, onClose, onShare }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onShare(note, email, role);
    setLoading(false);
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Share2 size={20} /> Share Note</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Share <strong>"{note.title || 'Untitled'}"</strong> with other users.</p>

          {note.collaborators && note.collaborators.length > 0 && (
            <div className="mb-6 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">People with access</label>
              {note.collaborators.map((collab, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                      {collab.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{collab.email}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-500 capitalize">
                    {collab.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Send Invite
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Component: Settings Modal ---
const SettingsModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Component: Profile Settings Form ---
const ProfileSettings = ({ user, onClose }) => {
  const [name, setName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(user, { displayName: name, photoURL: photoURL });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 mb-3 overflow-hidden relative group ring-4 ring-gray-50 dark:ring-gray-800 shadow-lg">
          {photoURL ? <img src={photoURL} className="w-full h-full object-cover" /> : <User className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" />}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Enter a URL below to change avatar</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo URL</label>
        <input value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="https://..." className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>
      {msg.text && <div className={`text-sm p-3 rounded-lg animate-fade-in ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{msg.text}</div>}
      <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none">{loading ? 'Saving...' : 'Save Changes'}</button>
    </div>
  );
};

// --- Component: Shortcuts Modal ---
const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const shortcuts = [
    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl', 'Y'], desc: 'Redo' },
    { keys: ['Ctrl', 'B'], desc: 'Bold' },
    { keys: ['Ctrl', 'I'], desc: 'Italic' },
    { keys: ['Ctrl', 'U'], desc: 'Underline' },
    { keys: ['Esc'], desc: 'Close Modals' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Keyboard size={20} /> Shortcuts</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map(k => <kbd key={k} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold font-mono border-b-2 border-gray-200 dark:border-gray-600 min-w-[24px] text-center">{k}</kbd>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Stats Modal ---
const StatsModal = ({ isOpen, onClose, notes }) => {
  if (!isOpen) return null;
  const totalNotes = notes.length;
  const totalWords = notes.reduce((acc, note) => acc + (stripHtml(note.content || '').trim().split(/\s+/).filter(w => w.length > 0).length || 0), 0);
  const totalChars = notes.reduce((acc, note) => acc + (stripHtml(note.content || '').length || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><BarChart2 size={20} /> Statistics</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-center border border-blue-100 dark:border-blue-800/30">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{totalNotes}</div>
              <div className="text-xs text-blue-400 dark:text-blue-300 uppercase font-bold tracking-wider">Notes</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-center border border-purple-100 dark:border-purple-800/30">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{totalWords}</div>
              <div className="text-xs text-purple-400 dark:text-purple-300 uppercase font-bold tracking-wider">Words</div>
            </div>
            <div className="col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between border border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Characters</span>
              <span className="text-gray-800 dark:text-gray-200 font-bold font-mono">{totalChars.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Account Settings Form ---
const AccountSettings = ({ user, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const isGuest = user.isAnonymous;
  const isGoogle = user.providerData.some(p => p.providerId === 'google.com');

  if (isGuest) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={32} /></div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Guest Account</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">You are currently browsing as a guest. To set a password and secure your data, please create an account.</p>
        <button onClick={() => signOut(auth)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98]">Sign Out & Register</button>
      </div>
    );
  }

  if (isGoogle) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4"><KeyRound size={32} /></div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Google Account</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">You signed in with Google. Please manage your password and security settings directly through your Google Account.</p>
      </div>
    );
  }

  const handleUpdate = async () => {
    if (password !== confirm) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (password.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 chars' }); return; }

    setLoading(true);
    try {
      await updatePassword(user, password);
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setMsg({ type: 'error', text: 'Requires recent login. Please log out and log back in to change your password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update the password for <strong>{user.email}</strong>.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>
      {msg.text && <div className={`text-sm p-3 rounded-lg animate-fade-in ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{msg.text}</div>}
      <button onClick={handleUpdate} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none">{loading ? 'Updating...' : 'Update Password'}</button>
    </div>
  );
};

// --- Component: Image Editor Tool ---
const ImageToolbar = ({ selectedImage, clearSelection, triggerUpdate }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (selectedImage) {
      const updatePos = () => {
        const rect = selectedImage.getBoundingClientRect();
        setPos({ top: rect.top + window.scrollY + 10, left: rect.left + (rect.width / 2) });
      };
      updatePos();
      window.addEventListener('scroll', updatePos, true);
      window.addEventListener('resize', updatePos);
      return () => {
        window.removeEventListener('scroll', updatePos, true);
        window.removeEventListener('resize', updatePos);
      };
    }
  }, [selectedImage]);

  if (!selectedImage) return null;

  const updateStyle = (styles) => { Object.assign(selectedImage.style, styles); triggerUpdate(); };
  const deleteImage = () => { selectedImage.remove(); clearSelection(); triggerUpdate(); };
  const currentWidth = selectedImage.style.width ? parseInt(selectedImage.style.width) : 100;
  const handleWidthChange = (e) => { selectedImage.style.width = `${e.target.value}%`; selectedImage.style.height = 'auto'; triggerUpdate(); };

  return (
    <Portal>
      <div className="fixed z-[9999] bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col gap-3 animate-pop-in w-56" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, 0)' }}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1"><Move size={12} /> Edit Image</span>
          <button onClick={deleteImage} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400"><span>Size</span><span>{currentWidth}%</span></div>
          <input type="range" min="10" max="100" defaultValue={currentWidth} onChange={handleWidthChange} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
        <div className="flex justify-between gap-1">
          <button onClick={() => updateStyle({ float: 'left', margin: '0 15px 10px 0', display: 'block' })} className="p-2 flex-1 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded text-gray-600 dark:text-gray-300 hover:text-blue-600" title="Left"><AlignLeft size={16} /></button>
          <button onClick={() => updateStyle({ float: 'none', margin: '0 auto', display: 'block' })} className="p-2 flex-1 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded text-gray-600 dark:text-gray-300 hover:text-blue-600" title="Center"><AlignCenter size={16} /></button>
          <button onClick={() => updateStyle({ float: 'right', margin: '0 0 10px 15px', display: 'block' })} className="p-2 flex-1 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded text-gray-600 dark:text-gray-300 hover:text-blue-600" title="Right"><AlignRight size={16} /></button>
        </div>
        <button onClick={clearSelection} className="w-full py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">Done</button>
      </div>
    </Portal>
  );
};

// --- Component: Improved Color Picker ---
const ColorPickerButton = ({ icon: Icon, command, defaultColor, title, isDark, readOnly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buttonRef, position } = useFloatingPosition(isOpen);

  useEffect(() => {
    const handleOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && !e.target.closest('.color-popover')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buttonRef]);

  const execColor = (color) => { document.execCommand(command, false, color); setIsOpen(false); };

  if (readOnly) return <button className="p-2 rounded-lg text-gray-300 dark:text-gray-700 cursor-not-allowed"><Icon size={18} /></button>;

  return (
    <>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-black/5'} ${isOpen ? 'bg-black/5' : ''}`} title={title}><Icon size={18} /></button>
      {isOpen && (
        <Portal>
          <div className="color-popover fixed p-3 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] w-56 animate-pop-in" style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 240) }}>
            <div className="grid grid-cols-6 gap-1 mb-2">
              {PRESET_COLORS.map(color => (<button key={color} onClick={() => execColor(color)} className="w-6 h-6 rounded-full border border-gray-100 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: color }} title={color} />))}
            </div>
            <div className="relative flex items-center justify-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 cursor-pointer hover:text-blue-600">Custom:</label>
              <input type="color" defaultValue={defaultColor} onChange={(e) => execColor(e.target.value)} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

// --- Component: Sketch Modal ---
const SketchModal = ({ isOpen, onClose, onSave, isDark }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      // Set white background initially
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isOpen, color, lineWidth]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-pop-in flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><PenTool size={20} /> Sketch</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={20} /></button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-center">
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="bg-white shadow-sm rounded-lg cursor-crosshair touch-none max-w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" title="Color" />
            <input type="range" min="1" max="10" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-24" title="Brush Size" />
            <button onClick={clearCanvas} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Clear"><Trash2 size={18} /></button>
          </div>
          <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors">Insert Sketch</button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Voice Input ---
const VoiceInput = ({ onInput, isDark, readOnly }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onInput(finalTranscript);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onInput, isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (!('webkitSpeechRecognition' in window)) return null;

  return (
    <button
      onClick={toggleListening}
      onMouseDown={(e) => e.preventDefault()}
      disabled={readOnly}
      className={`p-2 rounded-lg transition-all duration-200 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
      title={isListening ? "Stop Recording" : "Voice Note"}
    >
      <Mic size={18} />
    </button>
  );
};

// --- Component: AI Assistant ---
const AIAssistant = ({ content, onReplace, isDark, readOnly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { buttonRef, position } = useFloatingPosition(isOpen);

  useEffect(() => {
    const handleOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && !e.target.closest('.ai-popover')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buttonRef]);

  const runAI = async (promptType) => {
    if (!genAI) { alert("Gemini API Key is missing!"); return; }
    const text = stripHtml(content);
    if (!text.trim()) { alert("Write something first!"); return; }
    setLoading(true);
    setIsOpen(false); // Close popover immediately
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      let prompt = "";
      switch (promptType) {
        case 'fix': prompt = `Fix grammar and polish this text (return only the fixed text): ${text}`; break;
        case 'summarize': prompt = `Summarize this text (return only the summary): ${text}`; break;
        case 'continue': prompt = `Continue writing this text (return only the continuation): ${text}`; break;
        default: prompt = text;
      }

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Typing Animation
      let currentText = promptType === 'continue' ? content + " " : ""; // For continue, append. For others, replace.
      if (promptType !== 'continue') onReplace(""); // Clear if replacing

      const chars = response.split('');
      for (let i = 0; i < chars.length; i++) {
        currentText += chars[i];
        onReplace(currentText);
        // Dynamic delay for realism (faster for spaces/punctuation)
        const delay = chars[i] === ' ' ? 10 : (['.', '!', '?'].includes(chars[i]) ? 30 : 15);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error(error);
      alert("AI Error: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (readOnly) return null;

  return (
    <>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${loading ? 'animate-pulse text-blue-500' : (isDark ? 'text-purple-300 hover:bg-white/10' : 'text-purple-600 hover:bg-purple-50')}`} title="AI Assistant">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        <span className="text-xs font-bold hidden sm:inline">AI</span>
      </button>
      {isOpen && (
        <Portal>
          <div className="ai-popover fixed w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] py-1 animate-pop-in overflow-hidden" style={{ top: position.top, left: Math.min(position.left - 150, window.innerWidth - 220) }}>
            <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2"><Wand2 size={12} /> Gemini AI</div>
            <button onClick={() => runAI('fix')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Fix Grammar & Polish</button>
            <button onClick={() => runAI('summarize')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Summarize</button>
            <button onClick={() => runAI('continue')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Continue Writing</button>
          </div>
        </Portal>
      )}
    </>
  );
};

// --- Component: Font Picker ---
const FontPicker = ({ onFormat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buttonRef, position } = useFloatingPosition(isOpen);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('font'); // 'font' or 'size'

  useEffect(() => {
    const handleOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && !e.target.closest('.font-popover')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [buttonRef]);

  const filteredFonts = FONTS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'}`}
        title="Font Settings"
      >
        <Type size={18} />
      </button>

      {isOpen && (
        <Portal>
          <div
            className="font-popover fixed glass dark:glass-dark rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 z-[9999] w-64 overflow-hidden animate-pop-in flex flex-col"
            style={{ top: position.top, left: Math.max(10, Math.min(position.left - 80, window.innerWidth - 270)) }}
          >
            <div className="flex border-b border-gray-100 dark:border-gray-700/50">
              <button onClick={() => setTab('font')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${tab === 'font' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Font Family</button>
              <button onClick={() => setTab('size')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${tab === 'size' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Size</button>
            </div>

            {tab === 'font' && (
              <>
                <div className="p-2 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search fonts..."
                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border-none outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {filteredFonts.map(font => (
                    <button
                      key={font.value}
                      onClick={() => { onFormat('fontName', font.value); setIsOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-200 transition-colors truncate"
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === 'size' && (
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {FONT_SIZES.map(size => (
                  <button
                    key={size.value}
                    onClick={() => { onFormat('fontSize', size.value); setIsOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <span>{size.label}</span>
                    <span className="text-xs text-gray-400 opacity-50" style={{ fontSize: size.value === '1' ? '10px' : size.value === '3' ? '16px' : size.value === '7' ? '24px' : '14px' }}>Aa</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Portal>
      )}
    </>
  );
};

// --- Component: Reminder Modal ---
const ReminderModal = ({ isOpen, onClose, onSave, initialDate, isDark }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const d = new Date(initialDate);
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().slice(0, 5));
      } else {
        setDate('');
        setTime('');
      }
    }
  }, [isOpen, initialDate]);

  const handleSave = () => {
    if (!date || !time) return;
    const dateTime = new Date(`${date}T${time}`);
    onSave(dateTime.toISOString());
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Bell size={20} /> Set Reminder</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {initialDate && <button onClick={handleClear} className="flex-1 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold transition-colors">Remove</button>}
            <button onClick={handleSave} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">Save Reminder</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Toast ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800';

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-up ${bg}`}>
      {type === 'success' && <Check size={16} />}
      {type === 'error' && <AlertCircle size={16} />}
      {message}
    </div>
  );
};

// --- Component: Rich Text Editor ---
const RichTextEditor = ({ content, onChange, isDark, readOnly, onUndo, onRedo, onSetReminder, reminder }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSketchOpen, setIsSketchOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      const selection = window.getSelection();
      let savedRange = null;
      if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        savedRange = selection.getRangeAt(0);
      }
      editorRef.current.innerHTML = content;
      // Cursor restoration logic could go here, but it's complex.
      // For now, we accept that undo/redo might reset cursor to start/end or rely on browser behavior if focused.
    }
  }, [content]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) onRedo && onRedo();
      else onUndo && onUndo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      onRedo && onRedo();
    }
  };

  useEffect(() => {
    if (readOnly) return;
    const handleEditorClick = (e) => {
      if (e.target.tagName === 'IMG') setSelectedImage(e.target);
      else if (!e.target.closest('.fixed')) setSelectedImage(null);
    };
    const currentEditor = editorRef.current;
    if (currentEditor) {
      currentEditor.addEventListener('click', handleEditorClick);
      currentEditor.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (currentEditor) {
        currentEditor.removeEventListener('click', handleEditorClick);
        currentEditor.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [readOnly, onUndo, onRedo]);
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    // Default paste behavior is fine now
  };

  const format = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const checkFormats = () => {
    // Optional: Update toolbar state based on selection
  };

  const insertImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.execCommand('insertImage', false, evt.target.result);
        // Use setTimeout to ensure the image is inserted in the DOM before we call handleInput
        setTimeout(() => {
          handleInput(); // Trigger update after image insertion
        }, 0);
      };
      reader.readAsDataURL(file);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const insertSketch = (dataUrl) => {
    document.execCommand('insertImage', false, dataUrl);
    // Use setTimeout to ensure the image is inserted in the DOM before we call handleInput
    setTimeout(() => {
      handleInput(); // Trigger update after sketch insertion
    }, 0);
  };

  const btnBase = "p-1.5 rounded-lg transition-all duration-200 ease-out flex items-center justify-center hover:scale-105 active:scale-95";
  const btnInactive = "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700";
  const btnActive = "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm";
  const btnDisabled = "opacity-50 cursor-not-allowed text-gray-400 hover:scale-100 active:scale-100";

  return (
    <div className="flex flex-col h-full relative">
      <SketchModal isOpen={isSketchOpen} onClose={() => setIsSketchOpen(false)} onSave={insertSketch} isDark={isDark} />
      <div className={`flex items-center gap-1 p-2 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'} overflow-x-auto no-scrollbar flex-wrap sticky top-0 z-10 backdrop-blur-md`}>
        <button onClick={onUndo} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Undo"><Undo size={18} /></button>
        <button onClick={onRedo} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Redo"><Redo size={18} /></button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <FontPicker onFormat={format} />
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <button onClick={() => format('bold')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Bold"><Bold size={18} /></button>
        <button onClick={() => format('italic')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Italic"><Italic size={18} /></button>
        <button onClick={() => format('underline')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Underline"><Underline size={18} /></button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <ColorPickerButton icon={Droplet} command="foreColor" defaultColor="#000000" title="Text Color" isDark={isDark} readOnly={readOnly} />
        <ColorPickerButton icon={Highlighter} command="hiliteColor" defaultColor="#fef08a" title="Highlight Color" isDark={isDark} readOnly={readOnly} />
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <button onClick={() => format('justifyLeft')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Align Left"><AlignLeft size={18} /></button>
        <button onClick={() => format('justifyCenter')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Align Center"><AlignCenter size={18} /></button>
        <button onClick={() => format('justifyRight')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Align Right"><AlignRight size={18} /></button>
        <button onClick={() => format('insertUnorderedList')} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="List"><List size={18} /></button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={insertImage} />
        <button onClick={() => fileInputRef.current?.click()} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive}`} title="Upload Image"><ImageIcon size={18} /></button>
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex-shrink-0`} />
        <VoiceInput onInput={(text) => {
          document.execCommand('insertText', false, text + ' ');
        }} isDark={isDark} readOnly={readOnly} />
        <button onClick={onSetReminder} onMouseDown={(e) => e.preventDefault()} disabled={readOnly} className={`${btnBase} ${readOnly ? btnDisabled : btnInactive} ${reminder ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : ''}`} title="Set Reminder"><Bell size={18} /></button>
        <div className={`flex-grow`} />
        <AIAssistant content={content} onReplace={onChange} isDark={isDark} readOnly={readOnly} />
      </div>
      <div className="relative flex-grow flex flex-col overflow-hidden">
        <div
          ref={editorRef}
          className={`flex-1 p-4 sm:p-6 outline-none overflow-y-auto prose max-w-none ${isDark ? 'prose-invert' : ''} custom-scrollbar ${readOnly ? 'cursor-default' : ''}`}
          contentEditable={!readOnly}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={checkFormats}
          onMouseUp={checkFormats}
          onClick={checkFormats}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) onRedo && onRedo();
              else onUndo && onUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              onRedo && onRedo();
            }
          }}
          suppressContentEditableWarning={true}
          style={{
            minHeight: '200px',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        />
        {selectedImage && !readOnly && <ImageToolbar selectedImage={selectedImage} clearSelection={() => setSelectedImage(null)} triggerUpdate={handleInput} />}

        {/* Status Bar */}
        {!readOnly && (
          <div className={`px-4 py-1 text-[10px] font-medium flex items-center gap-3 border-t ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
            <span>{content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length} words</span>
            <span>{content.replace(/<[^>]*>/g, '').length} chars</span>
            <span className="ml-auto">{Math.ceil(content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length / 200)} min read</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Component: Note Modal ---
const NoteModal = ({ isOpen, onClose, note, userId, userEmail }) => {
  const [title, setTitle] = useState('');
  const [content, setContent, undo, redo] = useHistory('');
  const [themeId, setThemeId] = useState('base');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(note?.title || '');
      setContent(note?.content || '');
      setThemeId(note?.themeId || 'base');
      setIsPinned(note?.isPinned || false);
      setTags(note?.tags || []);
    }
  }, [isOpen, note]);

  const handleSave = async () => {
    let finalTags = [...tags];
    if (tagInput.trim() && !finalTags.includes(tagInput.trim())) finalTags.push(tagInput.trim());

    if ((!title.trim() && !stripHtml(content).trim()) || !userId) { onClose(); return; }
    setIsSaving(true);

    const noteData = {
      title,
      content,
      themeId,
      isPinned,
      tags: finalTags,
      updatedAt: serverTimestamp(),
      ownerId: note?.ownerId || userId,
      ownerEmail: note?.ownerEmail || userEmail,
      collaborators: note?.collaborators || [],
      allowedEmails: note?.allowedEmails || [userEmail]
    };

    try {
      if (note?.id) await updateDoc(doc(db, 'notes', note.id), noteData);
      else await addDoc(collection(db, 'notes'), { ...noteData, createdAt: serverTimestamp() });
    } catch (err) { console.error("Save error:", err); }
    finally { setIsSaving(false); onClose(); setTagInput(''); }
  };

  const handleShare = async (targetNote, targetEmail, role) => {
    if (!targetEmail) return;
    const newCollaborator = { email: targetEmail, role };
    const existingCollaborators = targetNote.collaborators || [];
    const updatedCollaborators = [...existingCollaborators.filter(c => c.email !== targetEmail), newCollaborator];
    const existingAllowed = targetNote.allowedEmails || [];
    const updatedAllowed = Array.from(new Set([...existingAllowed, targetEmail]));

    try {
      if (targetNote.id) {
        await updateDoc(doc(db, 'notes', targetNote.id), {
          collaborators: updatedCollaborators,
          allowedEmails: updatedAllowed
        });
        alert(`Invited ${targetEmail} as ${role}`);
      } else { alert("Please save the note first before sharing."); }
    } catch (err) { console.error("Share error:", err); alert("Failed to share note."); }
  };

  if (!isOpen) return null;
  const currentTheme = getTheme(themeId);
  const isDark = themeId === 'dark';

  const isOwner = note?.ownerId === userId || !note?.id;
  const collaborator = note?.collaborators?.find(c => c.email === userEmail);
  const role = isOwner ? 'owner' : (collaborator?.role || 'viewer');
  const canEdit = role === 'owner' || role === 'editor';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className={`relative w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all transform duration-300 ease-out animate-slide-up ${currentTheme.bg} ${isDark ? 'text-white' : 'text-gray-900'}`}>

          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200/50'}`}>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="sm:hidden p-2 -ml-2 rounded-full hover:bg-black/5"><ChevronDown className="rotate-90" size={24} /></button>
              {canEdit && (
                <button onClick={() => setIsPinned(!isPinned)} className={`p-2 rounded-full transition-colors ${isPinned ? 'bg-blue-100 text-blue-600' : 'hover:bg-black/5 text-gray-400'}`}>
                  {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
                </button>
              )}
              {!isOwner && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                  {role === 'editor' ? <Edit3 size={10} /> : <Eye size={10} />} {role === 'editor' ? 'Editor' : 'Viewer'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isOwner && note?.id && (
                <>
                  <ExportMenu title={title} content={content} className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors" iconSize={18} />
                  <button onClick={() => setIsShareOpen(true)} className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Share2 size={16} /> Share
                  </button>
                </>
              )}
              <button onClick={onClose} className="hidden sm:block px-4 py-2 rounded-lg font-medium text-gray-500 hover:bg-black/5 transition-colors">{canEdit ? 'Cancel' : 'Close'}</button>
              {canEdit && (
                <button onClick={handleSave} className={`px-6 py-2 rounded-full text-sm font-bold transition-colors shadow-sm ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Share/Export Buttons for Mobile (Toolbar) */}
          {isOwner && note?.id && (
            <div className="sm:hidden px-4 pt-2 flex justify-end gap-3">
              <ExportMenu title={title} content={content} className="flex items-center gap-1 text-gray-500 font-medium text-sm" iconSize={14} label="Export" />
              <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-1 text-indigo-600 font-medium text-sm"><Share2 size={14} /> Share Note</button>
            </div>
          )}

          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <input
              className={`w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none placeholder-opacity-40 ${isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
              placeholder="Untitled Note"
              value={title}
              readOnly={!canEdit}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2 min-h-[40px]">
            {tags.map(tag => (
              <span key={tag} className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 cursor-default ${isDark ? 'bg-gray-700' : 'bg-gray-200 text-gray-700'}`}>
                #{tag}
                {canEdit && <button onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1 hover:text-red-500"><X size={12} /></button>}
              </span>
            ))}
            {canEdit && (
              <div className="flex items-center gap-1 text-gray-400 text-sm"><Tag size={14} /><input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput(''); } }} placeholder="Add tag..." className={`bg-transparent outline-none min-w-[80px] ${isDark ? 'placeholder-gray-600' : 'placeholder-gray-400'}`} /></div>
            )}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col"><RichTextEditor content={content} onChange={setContent} isDark={isDark} readOnly={!canEdit} onUndo={undo} onRedo={redo} /></div>
          <div className={`p-3 sm:p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200/50'} flex items-center gap-2 overflow-x-auto no-scrollbar`}>
            {canEdit && THEMES.map(t => (<button key={t.id} onClick={() => setThemeId(t.id)} className={`w-8 h-8 rounded-full border hover:scale-110 flex-shrink-0 ${t.bg} ${t.border} ${themeId === t.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} title={t.label} />))}
            <div className="flex-grow" />
            {isOwner && note?.id && (<button onClick={async () => { if (confirm("Delete?")) { await deleteDoc(doc(db, 'notes', note.id)); onClose(); } }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>)}
          </div>
        </div>
      </div>
      <ShareModal note={note || {}} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} onShare={handleShare} />
    </>
  );
};

// --- Component: Note Card ---
const NoteCard = ({ note, onClick, index }) => {
  const theme = getTheme(note.themeId);
  const isDark = note.themeId === 'dark';
  const delayClass = index % 3 === 0 ? 'delay-100' : index % 3 === 1 ? 'delay-200' : 'delay-300';

  return (
    <div onClick={() => onClick(note)} className={`relative group break-inside-avoid mb-4 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 ${theme.bg} ${theme.border} ${theme.text} animate-slide-up ${delayClass} border border-transparent hover:border-primary-200 dark:hover:border-primary-700/50 shadow-sm`}>
      {note.isPinned && <div className={`absolute top-4 right-4 opacity-50 ${isDark ? 'text-white' : 'text-primary-600'}`}><Pin size={16} fill="currentColor" /></div>}
      {note.title && <h3 className="font-bold text-xl mb-3 leading-tight pr-6 tracking-tight">{note.title}</h3>}
      <div className={`text-sm leading-relaxed line-clamp-6 ${!note.title && 'font-medium text-base'} prose ${isDark ? 'prose-invert' : ''}`} dangerouslySetInnerHTML={{ __html: note.content || '<span class="opacity-40 italic">Empty note</span>' }} />
      {note.tags && note.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{note.tags.map(tag => <span key={tag} className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10 text-white/80' : 'bg-primary-50 text-primary-700'}`}>{tag}</span>)}</div>}
    </div>
  );
};

// --- Component: Verification Screen ---
const VerificationScreen = ({ user }) => {
  const [message, setMessage] = useState('');
  const resendEmail = async () => {
    try { await sendEmailVerification(user); setMessage('Email sent!'); }
    catch (e) { setMessage('Wait before retrying.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-dark-bg dark:to-gray-900 p-4 animate-fade-in">
      <div className="max-w-md w-full glass dark:glass-dark p-8 rounded-3xl text-center animate-pop-in">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
          <Mail size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-3 dark:text-white tracking-tight">Verify Email</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Check <strong>{user.email}</strong> for a link.</p>
        {message && <p className="text-sm text-primary-600 mb-4 font-medium">{message}</p>}
        <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold mb-3 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95">I Verified It</button>
        <button onClick={resendEmail} className="w-full border border-gray-200 dark:border-gray-700 py-3.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 transition-colors font-medium">Resend Email</button>
        <button onClick={() => signOut(auth)} className="block mx-auto mt-6 text-sm text-gray-400 hover:text-primary-500 transition-colors">Sign Out</button>
      </div>
    </div>
  );
};

// --- Component: Auth Screen ---
const AuthScreen = ({ onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (err) { setError("Google Sign-In failed."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(uc.user, { displayName: name });
        await sendEmailVerification(uc.user);
      }
    } catch (err) { setError(err.message.replace('Firebase: ', '')); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-100 dark:from-dark-bg dark:via-gray-900 dark:to-primary-900/20 p-4 animate-fade-in">
      <div className="w-full max-w-md glass dark:glass-dark rounded-3xl overflow-hidden flex flex-col animate-pop-in shadow-2xl">
        <div className="p-8 bg-gradient-to-br from-primary-600 to-indigo-600 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-shimmer" style={{ transform: 'skewX(-20deg)' }}></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg"><Cloud size={28} strokeWidth={3} /></div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Lumina</h1>
            <p className="text-primary-100 mt-2 font-medium">Capture your thoughts, organize your life.</p>
          </div>
        </div>
        <div className="p-8 pt-6 flex-1">
          {error && <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm flex items-start gap-3 border border-red-100 dark:border-red-800"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <button onClick={handleGoogleLogin} className="w-full mb-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />Continue with Google</button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div className="relative group"><User className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} /><input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none bg-gray-50 dark:bg-gray-900/50 dark:text-white focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all" required /></div>}
            <div className="relative group"><Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} /><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none bg-gray-50 dark:bg-gray-900/50 dark:text-white focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all" required /></div>
            <div className="relative group"><Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none bg-gray-50 dark:bg-gray-900/50 dark:text-white focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100">{loading ? <Loader2 className="animate-spin" size={24} /> : (isLogin ? 'Sign In' : 'Create Account')}</button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500"><button onClick={() => setIsLogin(!isLogin)} className="text-primary-600 font-bold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button></div>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50 text-center"><button onClick={onGuestLogin} className="text-gray-400 hover:text-primary-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors group">Continue as Guest <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></button></div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function LuminaApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeSettingsModal, setActiveSettingsModal] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => { if (typeof __initial_auth_token !== 'undefined') await signInWithCustomToken(auth, __initial_auth_token); };
    init();
    return onAuthStateChanged(auth, u => { setUser(u); if (!u) setNotes([]); });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || (!user.isAnonymous && !user.emailVerified)) { setIsLoading(false); return; }
    setIsLoading(true);
    const q = query(collection(db, 'notes'), where('allowedEmails', 'array-contains', user.email));
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
      setIsLoading(false);
    });
  }, [user]);

  const allTags = useMemo(() => Array.from(new Set(notes.flatMap(n => n.tags || []))).sort(), [notes]);
  const filteredNotes = notes.filter(n => {
    const term = filter.toLowerCase();
    return (!term || n.title?.toLowerCase().includes(term) || stripHtml(n.content || '').toLowerCase().includes(term)) && (!selectedTag || n.tags?.includes(selectedTag));
  });

  const handleGuestLogin = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };

  const handleKeepImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const importedNotes = await parseKeepTakeout(file);
      const batchPromises = importedNotes.map(n =>
        addDoc(collection(db, 'notes'), {
          ...n,
          ownerId: user.uid,
          ownerEmail: user.email,
          allowedEmails: [user.email],
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(batchPromises);
      addToast(`Successfully imported ${importedNotes.length} notes!`, 'success');
    } catch (err) {
      console.error(err);
      addToast("Failed to import notes: " + err.message, 'error');
    } finally {
      setIsLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleBackup = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Notes backed up successfully!", 'success');
  };

  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Check reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      notes.forEach(note => {
        if (note.reminder && !note.reminderShown) {
          const reminderTime = new Date(note.reminder);
          if (now >= reminderTime) {
            // Show notification
            if (Notification.permission === 'granted') {
              new Notification('Lumina Reminder', { body: note.title || 'Untitled Note' });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('Lumina Reminder', { body: note.title || 'Untitled Note' });
                }
              });
            }
            // Mark as shown (in a real app, update DB. Here just local state for session)
            // For simplicity in this demo, we won't persist "shown" state to DB to avoid complexity, 
            // but we'll alert.
            addToast(`Reminder: ${note.title || 'Untitled Note'}`, 'info');
          }
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [notes]);

  const handleSaveReminder = async (dateStr) => {
    if (!editingNote) return;
    const updatedNote = { ...editingNote, reminder: dateStr };
    setEditingNote(updatedNote);

    // Update in list immediately
    const updatedNotes = notes.map(n => n.id === editingNote.id ? updatedNote : n);
    setNotes(updatedNotes);

    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', editingNote.id), updatedNote);
        addToast("Reminder saved!", 'success');
      } catch (e) {
        console.error("Error saving reminder:", e);
        addToast("Failed to save reminder.", 'error');
      }
    }
  };

  return (
    <>
      <GlobalStyles />
      {!user ? (
        <AuthScreen onGuestLogin={handleGuestLogin} />
      ) : (!user.isAnonymous && !user.emailVerified) ? (
        <VerificationScreen user={user} />
      ) : (
        <>
          <div className="flex h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">

            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-fade-in" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 glass dark:glass-dark border-r border-white/20 dark:border-gray-700/30 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
              <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-700/50 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30"><Cloud size={20} strokeWidth={3} /></div>
                  <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Lumina</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:bg-white/50 rounded-lg transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                <button onClick={() => { setSelectedTag(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${!selectedTag ? 'bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 text-primary-700 dark:text-primary-300 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}><LayoutGrid size={20} /> All Notes</button>
                <div className="px-4 mb-3 mt-6 flex items-center justify-between"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tags</span></div>
                {allTags.length === 0 && <div className="px-4 text-xs text-gray-400 italic">No tags yet.</div>}
                {allTags.map(tag => <button key={tag} onClick={() => { setSelectedTag(tag); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedTag === tag ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}><Hash size={18} /> {tag}</button>)}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
                <ProfileMenu
                  user={user}
                  onSignOut={() => signOut(auth)}
                  isDarkMode={isDarkMode}
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  onOpenSettings={(type) => setActiveSettingsModal(type)}
                  onImport={handleKeepImport}
                  onBackup={handleBackup}
                />
              </div>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0">
              <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-3 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"><Menu size={24} /></button>
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all text-gray-900 dark:text-white" />
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth custom-scrollbar">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading notes...</div>
                ) : (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 mx-auto max-w-7xl">
                    <div onClick={() => { setEditingNote({}); setIsModalOpen(true); }} className="break-inside-avoid mb-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer transition-all min-h-[150px] group">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 flex items-center justify-center mb-2 transition-colors">
                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="font-bold">Create Note</span>
                    </div>
                    {filteredNotes.map((note, index) => (
                      <NoteCard key={note.id} note={note} onClick={(n) => { setEditingNote(n); setIsModalOpen(true); }} index={index} />
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>

          <NoteModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
            note={editingNote}
            userId={user?.uid}
            userEmail={user?.email}
            onSetReminder={() => setIsReminderOpen(true)}
          />

          <ReminderModal
            isOpen={isReminderOpen}
            onClose={() => setIsReminderOpen(false)}
            onSave={handleSaveReminder}
            initialDate={editingNote?.reminder}
            isDark={isDarkMode}
          />

          <SettingsModal isOpen={!!activeSettingsModal} onClose={() => setActiveSettingsModal(null)} title={activeSettingsModal === 'profile' ? 'Profile Settings' : 'Account Security'}>
            {activeSettingsModal === 'profile' && <ProfileSettings user={user} onClose={() => setActiveSettingsModal(null)} />}
            {activeSettingsModal === 'account' && <AccountSettings user={user} onClose={() => setActiveSettingsModal(null)} />}
          </SettingsModal>

          <ShortcutsModal isOpen={activeSettingsModal === 'shortcuts'} onClose={() => setActiveSettingsModal(null)} />
          <StatsModal isOpen={activeSettingsModal === 'stats'} onClose={() => setActiveSettingsModal(null)} notes={notes} />

          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
              <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
            ))}
          </div>
        </>
      )}
    </>
  );
};
