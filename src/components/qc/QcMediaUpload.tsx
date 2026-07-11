import { useCallback, useEffect, useState } from 'react'
import { ImagePlus, Trash2, Video } from 'lucide-react'

export interface MediaItem {
  id: string
  file: File
  url: string
}

interface QcMediaUploadProps {
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
}

export function QcMediaUpload({ items, onChange }: QcMediaUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const next = [...items]
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
        next.push({ id: `${Date.now()}-${file.name}`, file, url: URL.createObjectURL(file) })
      }
      onChange(next)
    },
    [items, onChange],
  )

  useEffect(
    () => () => {
      for (const item of items) URL.revokeObjectURL(item.url)
    },
    [items],
  )

  function remove(id: string) {
    const target = items.find((i) => i.id === id)
    if (target) URL.revokeObjectURL(target.url)
    onChange(items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40'
        }`}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <ImagePlus className="mb-2 h-8 w-8 text-brand-600" />
        <span className="font-medium text-slate-800 dark:text-slate-100">
          Click or drag photos &amp; videos here
        </span>
        <span className="mt-1 text-xs text-slate-500">No limit — JPG, PNG, HEIC, MP4, MOV, WEBM</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      <p className="text-sm text-slate-500">
        {items.length === 0 ? 'No files selected' : `${items.length} file${items.length === 1 ? '' : 's'} selected`}
      </p>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-red-600 p-1 text-white"
                onClick={() => remove(item.id)}
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {item.file.type.startsWith('video/') ? (
                <div className="flex h-28 items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Video className="h-8 w-8 text-slate-400" />
                </div>
              ) : (
                <img src={item.url} alt="" className="h-28 w-full object-cover" />
              )}
              <p className="truncate px-2 py-1 text-[10px] text-slate-500">{item.file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
