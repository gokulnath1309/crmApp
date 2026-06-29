import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Paperclip, Trash2, Download, Search, FileText, Image as ImageIcon,
  FileSpreadsheet, Archive, Folder, Loader2, ArrowUpRight 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FilesCardProps {
  lead: any;
}

export function FilesCard({ lead }: FilesCardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Queries/Mutations
  const files = useQuery(api.leads.listLeadAttachments, lead ? { leadId: lead._id } : "skip");
  const uploadMutation = useMutation(api.leads.uploadAttachment);
  const deleteMutation = useMutation(api.leads.deleteAttachment);

  // States
  const [searchVal, setSearchVal] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "type">("none");

  if (!lead) return null;

  // Permission Logic
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  // Base64 file parser helper
  const processFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast("error", `File ${file.name} exceeds 5 MB limit.`);
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await processFileBase64(file);
      await uploadMutation({
        leadId: lead._id,
        fileName: file.name,
        fileType: file.type,
        fileUrl: base64,
      });
      toast("success", "File uploaded successfully!");
    } catch (err: any) {
      toast("error", err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file permanently?")) return;
    try {
      await deleteMutation({ attachmentId: fileId as any });
      toast("success", "File deleted successfully");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete file");
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-rose-500" />;
    if (type.includes("sheet") || type.includes("csv") || type.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (type.includes("zip") || type.includes("tar") || type.includes("rar")) return <Archive className="w-5 h-5 text-amber-600" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  // Filter Files
  const getFilteredFiles = () => {
    if (!files) return [];
    if (!searchVal.trim()) return files;
    const q = searchVal.toLowerCase();
    return files.filter(f => f.fileName.toLowerCase().includes(q));
  };

  const filtered = getFilteredFiles();

  // Group files by type
  const getGroupedFiles = () => {
    const groups: Record<string, typeof filtered> = {
      "Images": [],
      "Documents": [],
      "Archives": [],
      "Others": [],
    };

    filtered.forEach(f => {
      const type = f.fileType.toLowerCase();
      if (type.includes("image")) groups["Images"].push(f);
      else if (type.includes("pdf") || type.includes("word") || type.includes("sheet") || type.includes("excel") || type.includes("text") || type.includes("csv")) {
        groups["Documents"].push(f);
      } else if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("7z")) {
        groups["Archives"].push(f);
      } else {
        groups["Others"].push(f);
      }
    });

    return Object.keys(groups).reduce((acc, key) => {
      if (groups[key].length > 0) {
        acc[key] = groups[key];
      }
      return acc;
    }, {} as Record<string, typeof filtered>);
  };

  const renderFileRow = (f: any) => {
    const isImage = f.fileType.includes("image");
    
    // Check permission to delete
    const isOwner = f.uploadedBy === currentUser?._id;
    const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
    const canDelete = isOwner || isAdmin;

    return (
      <div 
        key={f._id} 
        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-905/30 hover:bg-slate-100/40 dark:hover:bg-slate-805/30 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isImage ? (
            <div className="w-9 h-9 rounded-lg border border-slate-200/50 dark:border-slate-800 overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={f.fileUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-150/10">
              {getFileIcon(f.fileType)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-805 dark:text-slate-200 truncate pr-4">
              {f.fileName}
            </p>
            <p className="text-[10px] text-slate-405 font-medium mt-0.5">
              Uploaded by {f.uploaderName} • {new Date(f.uploadedAt || f.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={f.fileUrl}
            download={f.fileName}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {canDelete && (
            <button
              onClick={() => handleDelete(f._id)}
              className="p-2 border border-slate-200 dark:border-slate-700 text-slate-350 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer shadow-xs opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/40 mb-4">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-505" /> Attachment Vault
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Grouping Filter */}
          <div className="flex bg-slate-105 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-xl p-0.5">
            <button
              onClick={() => setGroupBy("none")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                groupBy === "none" 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setGroupBy("type")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                groupBy === "type" 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Folder
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search files..."
              className="h-7.5 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 text-xs outline-none w-44 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      {canModify && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 mb-4 text-center cursor-pointer transition-all ${
            isDragging 
              ? "border-indigo-650 bg-indigo-50/20 dark:bg-indigo-950/10" 
              : "border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-350">Uploading file to vault...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <ArrowUpRight className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 rotate-45" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Drag & drop files here, or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
              </p>
              <p className="text-[10px] text-slate-405 mt-1">PDF, DOC, XLS, ZIP, Images, Videos up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* Vault Files Feed */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[380px] space-y-4">
        {!files ? (
          <div className="space-y-2">
            <div className="h-14 w-full bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No attachments stored in vault.
          </div>
        ) : groupBy === "type" ? (
          /* Folder Grouping View */
          <div className="space-y-4">
            {Object.entries(getGroupedFiles()).map(([folderName, folderFiles]) => (
              <div key={folderName} className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                  <Folder className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" /> {folderName} ({folderFiles.length})
                </h4>
                <div className="space-y-2 pl-2 border-l border-slate-100 dark:border-slate-800/80 ml-2">
                  {folderFiles.map(renderFileRow)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat list view */
          <div className="space-y-2">
            {filtered.map(renderFileRow)}
          </div>
        )}
      </div>
    </div>
  );
}
