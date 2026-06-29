import React, { useState, useRef, useCallback } from "react";
import {
  Paperclip, Trash2, Download, Play, Pause, FileText,
  Image as ImageIcon, FileSpreadsheet, Film, Archive,
  AlertCircle, Music, Mic,
  ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface EvidenceItem {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  category: string;
  mimeType: string;
  duration?: number;
  isUploading: boolean;
  uploadProgress: number;
  storageId?: string;
}

interface InteractionEvidenceProps {
  files: EvidenceItem[];
  onFilesChange: (files: EvidenceItem[]) => void;
  onFilesSelected?: (files: Array<{ id: string; file: File }>) => void;
}

const CATEGORIES = [
  { value: "call-recording", label: "Call Recording" },
  { value: "voice-note", label: "Voice Note" },
  { value: "proposal", label: "Proposal" },
  { value: "contract", label: "Contract" },
  { value: "email", label: "Email" },
  { value: "quote", label: "Quote" },
  { value: "meeting-recording", label: "Meeting Recording" },
  { value: "site-visit", label: "Site Visit" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = [
  "mp3", "wav", "m4a", "aac", "ogg",
  "pdf", "doc", "docx", "xls", "xlsx",
  "png", "jpg", "jpeg", "gif", "svg", "webp",
  "mp4", "mov", "avi", "webm",
  "zip",
];

const SUPPORTED_MIME_PREFIXES = [
  "audio/", "video/", "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
];

const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "aac", "ogg"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "webm"];
function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function isAudioFile(filename: string, mimeType: string): boolean {
  if (mimeType.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.includes(getFileExtension(filename));
}

function isVideoFile(filename: string, mimeType: string): boolean {
  if (mimeType.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.includes(getFileExtension(filename));
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isSupportedFile(filename: string, mimeType: string): boolean {
  const ext = getFileExtension(filename);
  if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
  for (const prefix of SUPPORTED_MIME_PREFIXES) {
    if (mimeType.startsWith(prefix)) return true;
  }
  return false;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function guessCategoryFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("proposal")) return "proposal";
  if (lower.includes("contract") || lower.includes("agreement")) return "contract";
  if (lower.includes("quote") || lower.includes("quotation")) return "quote";
  if (lower.includes("email")) return "email";
  if (lower.includes("meeting")) return "meeting-recording";
  if (lower.includes("site") || lower.includes("visit")) return "site-visit";
  if (lower.includes("call") || lower.includes("discussion") || lower.includes("demo")) return "call-recording";
  if (lower.includes("voice") || lower.includes("note") || lower.includes("audio")) return "voice-note";
  return "other";
}

function getFileTypeIcon(filename: string, mimeType: string): React.ReactNode {
  if (isAudioFile(filename, mimeType)) return <Music className="w-5 h-5 text-violet-500" />;
  if (isVideoFile(filename, mimeType)) return <Film className="w-5 h-5 text-amber-500" />;
  if (isImageFile(mimeType)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  const ext = getFileExtension(filename);
  if (["pdf"].includes(ext)) return <FileText className="w-5 h-5 text-rose-500" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="w-5 h-5 text-indigo-500" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <Archive className="w-5 h-5 text-amber-600" />;
  return <FileText className="w-5 h-5 text-slate-500" />;
}

function AudioPreview({ fileUrl, duration: initialDuration }: { fileUrl: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(audioRef.current.currentTime);
  }, [duration]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3"
    >
      <audio
        ref={audioRef}
        src={fileUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center hover:bg-violet-200 dark:hover:bg-violet-900/40 transition-colors flex-shrink-0 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

let itemCounter = 0;
function generateId(): string {
  itemCounter++;
  return `ev_${Date.now()}_${itemCounter}`;
}



export function InteractionEvidence({ files, onFilesChange, onFilesSelected }: InteractionEvidenceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFileBase64 = useCallback((file: File): Promise<{ base64: string; duration?: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;

        if (file.type.startsWith("audio/")) {
          const audio = new Audio();
          audio.preload = "metadata";
          audio.src = base64;
          audio.onloadedmetadata = () => {
            const duration = audio.duration;
            URL.revokeObjectURL(audio.src);
            resolve({ base64, duration: isFinite(duration) ? duration : undefined });
          };
          audio.onerror = () => {
            resolve({ base64 });
          };
        } else {
          resolve({ base64 });
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const addFiles = useCallback(async (fileList: FileList) => {
    setErrorMessage(null);
    const newItems: EvidenceItem[] = [];
    const selectedFiles: Array<{ id: string; file: File }> = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!isSupportedFile(file.name, file.type)) {
        setErrorMessage(`"${file.name}" is not a supported file type. Supported: MP3, WAV, M4A, AAC, OGG, PDF, DOC/DOCX, XLS/XLSX, Images, Videos, ZIP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`"${file.name}" exceeds the 50 MB size limit.`);
        continue;
      }

      try {
        const { base64, duration } = await processFileBase64(file);
        const ext = getFileExtension(file.name);
        let mimeType = file.type;
        if (!mimeType || mimeType === "") {
          const mimeMap: Record<string, string> = {
            mp3: "audio/mpeg",
            wav: "audio/wav",
            m4a: "audio/mp4",
            aac: "audio/aac",
            ogg: "audio/ogg",
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            zip: "application/zip",
            mp4: "video/mp4",
            mov: "video/quicktime",
            avi: "video/x-msvideo",
            webm: "video/webm",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            svg: "image/svg+xml",
            webp: "image/webp",
          };
          mimeType = mimeMap[ext] || "application/octet-stream";
        }

        const category = guessCategoryFromFilename(file.name);
        const itemId = generateId();

        newItems.push({
          id: itemId,
          fileName: file.name,
          fileType: ext,
          fileUrl: base64,
          fileSize: file.size,
          category,
          mimeType,
          duration,
          isUploading: false,
          uploadProgress: 100,
        });
        selectedFiles.push({ id: itemId, file });
      } catch {
        setErrorMessage(`Failed to read "${file.name}".`);
      }
    }

    if (newItems.length > 0) {
      onFilesChange([...files, ...newItems]);
      onFilesSelected?.(selectedFiles);
    }
  }, [files, onFilesChange, onFilesSelected, processFileBase64]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (inputFiles && inputFiles.length > 0) {
      addFiles(inputFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  }, [files, onFilesChange]);

  const updateCategory = useCallback((id: string, category: string) => {
    onFilesChange(
      files.map((f) => (f.id === id ? { ...f, category } : f))
    );
  }, [files, onFilesChange]);

  const audioFiles = files.filter((f) => isAudioFile(f.fileName, f.mimeType));
  const otherFiles = files.filter((f) => !isAudioFile(f.fileName, f.mimeType));

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all",
          isDragging
            ? "border-violet-500 bg-violet-50/30 dark:bg-violet-950/10"
            : "border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50/30 dark:hover:bg-slate-900/10"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.m4a,.aac,.ogg,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp4,.mov,.avi,.webm,.zip"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Drag & drop evidence files here, or <span className="text-violet-600 dark:text-violet-400">browse</span>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            MP3, WAV, M4A, AAC, OGG, PDF, DOC/DOCX, XLS/XLSX, Images, Videos, ZIP (max 50 MB)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Audio Recordings Section */}
      {audioFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-violet-500" />
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Recordings ({audioFiles.length})
            </h4>
          </div>
          {audioFiles.map((file) => (
            <EvidenceRow
              key={file.id}
              file={file}
              onRemove={removeFile}
              onCategoryChange={updateCategory}
            />
          ))}
        </div>
      )}

      {/* Other Files Section */}
      {otherFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Attachments ({otherFiles.length})
            </h4>
          </div>
          {otherFiles.map((file) => (
            <EvidenceRow
              key={file.id}
              file={file}
              onRemove={removeFile}
              onCategoryChange={updateCategory}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !errorMessage && (
        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
          No interaction evidence uploaded yet.
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-right">
          {files.length} file{files.length !== 1 ? "s" : ""} attached
        </div>
      )}
    </div>
  );
}

interface EvidenceRowProps {
  file: EvidenceItem;
  onRemove: (id: string) => void;
  onCategoryChange: (id: string, category: string) => void;
}

function EvidenceRow({ file, onRemove, onCategoryChange }: EvidenceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isAudio = isAudioFile(file.fileName, file.mimeType);

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* File Info Row */}
      <div className="flex items-center justify-between p-3.5 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-150/10">
            {getFileTypeIcon(file.fileName, file.mimeType)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {file.fileName}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              <span>{formatFileSize(file.fileSize)}</span>
              {isAudio && file.duration && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>{formatDuration(file.duration)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Category Badge */}
          <span className={cn(
            "text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg hidden sm:inline-block",
            {
              "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400": file.category === "call-recording",
              "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400": file.category === "voice-note",
              "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400": file.category === "proposal",
              "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400": file.category === "contract",
              "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400": file.category === "email",
              "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400": file.category === "quote",
              "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400": file.category === "meeting-recording",
              "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400": file.category === "site-visit",
              "bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400": file.category === "other",
            }
          )}>
            {CATEGORIES.find((c) => c.value === file.category)?.label || file.category}
          </span>

          {/* Download */}
          <a
            href={file.fileUrl}
            download={file.fileName}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-350 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Audio Player */}
      {isAudio && (
        <div className="px-3.5 pb-3.5">
          <AudioPreview fileUrl={file.fileUrl} duration={file.duration} />
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-slate-100 dark:border-slate-700/30 pt-3 space-y-3">
          {/* Category Select */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Classify Evidence
            </label>
            <select
              value={file.category}
              onChange={(e) => onCategoryChange(file.id, e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="font-bold text-slate-400 dark:text-slate-500">Type</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{file.mimeType || file.fileType}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 dark:text-slate-500">Size</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formatFileSize(file.fileSize)}</p>
            </div>
            {file.duration && (
              <div>
                <span className="font-bold text-slate-400 dark:text-slate-500">Duration</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formatDuration(file.duration)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
