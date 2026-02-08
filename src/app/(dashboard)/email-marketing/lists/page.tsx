"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  _count: { members: number };
}

export default function ContactListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchLists = () => {
    fetch("/api/email-marketing/lists?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setLists(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/email-marketing/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc || undefined }),
      });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      fetchLists();
    } catch {
      // error handled silently
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this list? Contacts won't be deleted.")) return;
    await fetch(`/api/email-marketing/lists/${id}`, { method: "DELETE" });
    fetchLists();
  };

  const filtered = search
    ? lists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : lists;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Lists</h1>
          <p className="text-sm text-gray-500 mt-1">Organize contacts into lists for email campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create List
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New Contact List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="List name"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              autoFocus
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-3 py-1.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9] disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search lists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
        />
      </div>

      {/* Lists */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No contact lists found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0891b2]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#0891b2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{list.name}</div>
                {list.description && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{list.description}</div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {list._count?.members ?? list.memberCount} contacts
              </div>
              <div className="text-xs text-gray-400">
                {new Date(list.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(list.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link href="/email-marketing" className="text-sm text-gray-500 hover:text-[#0891b2]">
          &larr; Back to Email Marketing
        </Link>
      </div>
    </div>
  );
}
