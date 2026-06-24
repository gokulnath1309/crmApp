import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Search, X, Building, Loader2, Edit, Trash2, Globe, Tag } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CompanyForm {
  name: string;
  domain: string;
  industry: string;
  phone: string;
  website: string;
  status: string;
}

const emptyForm: CompanyForm = { name: "", domain: "", industry: "", phone: "", website: "", status: "Prospect" };
const statusOptions = ["Prospect", "Active", "Customer", "Partner", "Inactive"];

function Chip({ label, v = "neutral" }: { label: string; v?: "neutral" | "green" | "blue" | "orange" | "red" | "purple" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>{label}</span>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-xl w-full max-w-lg mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CompaniesPage() {
  const { toast } = useToast();
  const companies = useQuery(api.workspaces.list, {});
  const createCompany = useMutation(api.workspaces.create);
  const updateCompany = useMutation(api.workspaces.update);
  const deleteCompany = useMutation(api.workspaces.remove);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);

  const filtered = (companies ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.domain && c.domain.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: any) {
    setEditingId(c._id);
    setForm({ name: c.name, domain: c.domain || "", industry: c.industry || "", phone: c.phone || "", website: c.website || "", status: c.status || "Prospect" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await updateCompany({ id: editingId as any, ...form });
        toast("success", "Company updated");
      } else {
        await createCompany(form);
        toast("success", "Company created");
      }
      setShowForm(false);
    } catch {
      toast("error", "Failed to save company");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteCompany({ id: id as any });
      toast("success", "Company deleted");
    } catch {
      toast("error", "Failed to delete company");
    }
  }

  return (
    <div className="space-y-5 pb-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Companies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {companies === undefined ? "Loading..." : `${filtered.length} companies`}
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* List */}
      {companies === undefined ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-12 text-center">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{search ? "No companies match your search." : "No companies yet. Add one to get started."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/40">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Domain</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden lg:table-cell">Industry</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
              {filtered.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center"><Building className="w-4 h-4 text-indigo-500" /></div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                        {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" />{c.website}</a>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{c.domain || "—"}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                    {c.industry ? <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{c.industry}</span> : "—"}
                  </td>
                  <td className="px-5 py-4"><Chip label={c.status || "Prospect"} v={c.status === "Active" || c.status === "Customer" ? "green" : c.status === "Partner" ? "blue" : c.status === "Inactive" ? "red" : "neutral"} /></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c._id, c.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal title={editingId ? "Edit Company" : "Add Company"} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Company Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Corp" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Domain</label>
                <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="acme.com" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Industry</label>
                <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Technology" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0123" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Website</label>
                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://acme.com" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">{editingId ? "Update" : "Create"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
