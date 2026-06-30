import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  FileText, Plus, Trash2, History, RotateCcw,
  User, Loader2 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface NotesCardProps {
  lead: any;
}

export function NotesCard({ lead }: NotesCardProps) {
  const { toast } = useToast();

  // Queries/Mutations from api.notes
  const notes = useQuery(api.notes.list, lead ? { entityType: "lead", entityId: lead._id } : "skip");
  const createNoteMutation = useMutation(api.notes.create);
  const updateNoteMutation = useMutation(api.notes.update);
  const deleteNoteMutation = useMutation(api.notes.remove);

  // Local State
  const [newNoteBody, setNewNoteBody] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [viewHistoryNoteId, setViewHistoryNoteId] = useState<string | null>(null);

  // Query versions of a note
  const noteVersions = useQuery(
    api.notes.listVersions,
    viewHistoryNoteId ? { noteId: viewHistoryNoteId as any } : "skip"
  );

  // Autosave debounce timer ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Trigger autosave when typing
  const handleEditChange = (text: string, noteId: string) => {
    setEditBody(text);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        await updateNoteMutation({
          id: noteId as any,
          body: text,
        });
      } catch (err) {
        console.error("Autosave failed:", err);
      } finally {
        isSavingRef.current = false;
      }
    }, 1200); // 1.2s debounce for autosave
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim()) return;

    setIsCreating(true);
    try {
      await createNoteMutation({
        body: newNoteBody,
        entityType: "lead",
        entityId: lead._id,
      });
      setNewNoteBody("");
      toast("success", "Note created successfully");
    } catch (err: any) {
      toast("error", err.message || "Failed to create note");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note and its version history?")) return;
    try {
      await deleteNoteMutation({ id: noteId as any });
      toast("success", "Note deleted");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete note");
    }
  };

  const handleRestoreVersion = async (noteId: string, versionBody: string) => {
    try {
      await updateNoteMutation({
        id: noteId as any,
        body: versionBody,
      });
      setEditBody(versionBody);
      setViewHistoryNoteId(null);
      toast("success", "Note version restored!");
    } catch (err: any) {
      toast("error", err.message || "Failed to restore version");
    }
  };

  // Checklist parser helpers
  const handleToggleChecklistItem = async (note: any, lineIndex: number, currentChecked: boolean) => {
    const lines = note.body.split("\n");
    const targetLine = lines[lineIndex];
    
    // Toggle [ ] or [x]
    if (currentChecked) {
      lines[lineIndex] = targetLine.replace("[x]", "[ ]");
    } else {
      lines[lineIndex] = targetLine.replace("[ ]", "[x]");
    }

    const newBody = lines.join("\n");
    if (editingNoteId === note._id) {
      setEditBody(newBody);
    }

    try {
      await updateNoteMutation({
        id: note._id,
        body: newBody,
      });
    } catch (err) {
      toast("error", "Failed to update checklist item");
    }
  };

  const renderNoteBody = (note: any) => {
    const lines = note.body.split("\n");
    const hasChecklist = lines.some((l: string) => l.trim().startsWith("[ ]") || l.trim().startsWith("[x]"));

    if (!hasChecklist) {
      return <p className="text-xs text-slate-655 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">{note.body}</p>;
    }

    return (
      <div className="space-y-1 mt-1">
        {lines.map((line: string, idx: number) => {
          const isUnchecked = line.trim().startsWith("[ ]");
          const isChecked = line.trim().startsWith("[x]");
          
          if (isUnchecked || isChecked) {
            const cleanText = line.replace("[ ]", "").replace("[x]", "").trim();
            return (
              <label key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleChecklistItem(note, idx, isChecked)}
                  className="mt-0.5 rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={isChecked ? "line-through text-slate-400 dark:text-slate-500" : "font-medium"}>
                  {cleanText}
                </span>
              </label>
            );
          }

          return <p key={idx} className="text-xs text-slate-600 dark:text-slate-450 whitespace-pre-wrap">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/40 mb-4">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-505" /> Lead Notes
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Autosave Enabled
        </span>
      </div>

      {/* Create note form */}
      <form onSubmit={handleCreateNote} className="mb-5 bg-slate-50/50 dark:bg-slate-900/10 p-3.5 rounded-2xl border border-slate-100/70 dark:border-slate-800 space-y-3">
        <div>
          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Add Note / Task Checklist</label>
          <textarea
            placeholder="Type your note. Tip: Use [ ] to start a checklist line."
            value={newNoteBody}
            onChange={(e) => setNewNoteBody(e.target.value)}
            rows={3}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreating || !newNoteBody.trim()}
            className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4 overflow-y-auto pr-1 max-h-[400px]">
        {!notes ? (
          <div className="space-y-2">
            <div className="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No notes logged for this lead yet.
          </div>
        ) : (
          notes.map((note) => {
            const isEditing = editingNoteId === note._id;
            
            return (
              <div 
                key={note._id} 
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-750 bg-white dark:bg-slate-900/30 flex flex-col justify-between gap-3 group relative"
              >
                {/* Creator Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-105 dark:bg-slate-805 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {note.creatorAvatar ? (
                        <img src={note.creatorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        note.creatorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-705 dark:text-slate-205">{note.creatorName}</p>
                      <p className="text-[9px] text-slate-400 font-medium">Last Saved: {new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setViewHistoryNoteId(note._id);
                      }}
                      className="p-1 text-slate-355 hover:text-slate-655 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                      title="View Version History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="p-1 text-slate-355 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editor or Content body */}
                {isEditing ? (
                  <div className="mt-1">
                    <textarea
                      value={editBody}
                      onChange={(e) => handleEditChange(e.target.value, note._id)}
                      rows={4}
                      className="w-full p-2.5 text-xs rounded-xl border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-slate-400 italic">
                        {isSavingRef.current ? "Saving changes..." : "All edits autosaved."}
                      </span>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="h-6 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Done Editing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onDoubleClick={() => {
                      setEditingNoteId(note._id);
                      setEditBody(note.body);
                    }}
                    className="cursor-pointer"
                  >
                    {renderNoteBody(note)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Version History Modal Overlay */}
      {viewHistoryNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-5 border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col max-h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750 mb-3.5">
              <h4 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-505" /> Note Version Audit Trail
              </h4>
              <button 
                onClick={() => setViewHistoryNoteId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Versions Feed */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {!noteVersions ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-350" /></div>
              ) : noteVersions.length === 0 ? (
                <p className="text-xs text-slate-405 italic py-4 text-center">No older versions saved yet.</p>
              ) : (
                noteVersions.map((ver) => (
                  <div key={ver._id} className="p-3 bg-slate-50 dark:bg-slate-905 border border-slate-100/60 dark:border-slate-800/40 rounded-xl relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-350" />
                        <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">{ver.creatorName}</span>
                      </div>
                      <span className="text-[9px] text-slate-405 font-medium">{new Date(ver.updatedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-655 dark:text-slate-400 whitespace-pre-wrap bg-white dark:bg-slate-850 p-2 border border-slate-100 rounded-lg">{ver.body}</p>
                    
                    {/* Revert Trigger Button */}
                    <button
                      onClick={() => handleRestoreVersion(viewHistoryNoteId, ver.body)}
                      className="absolute right-4 top-2 text-[9px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Revert to this
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
