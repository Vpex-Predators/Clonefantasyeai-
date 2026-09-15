import React, { useRef, useState } from "react";
import { ImagePlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScreenshotUpload({ preview, onFileSelected, onReset }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (files && files[0] && files[0].type.startsWith("image/")) {
      onFileSelected(files[0]);
    }
  };

  if (preview) {
    return (
      <div className="relative rounded-lg border-2 border-slate-800 bg-slate-900 p-3">
        <img src={preview} alt="Screenshot preview" className="mx-auto max-h-80 rounded-md object-contain" />
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="outline" onClick={() => inputRef.current?.click()} className="border-slate-600 text-slate-100 hover:bg-slate-800">
            <RefreshCw className="mr-2 h-4 w-4" /> Replace screenshot
          </Button>
          <Button variant="outline" onClick={onReset} className="border-slate-600 text-slate-100 hover:bg-slate-800">
            Remove
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
        dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
        <ImagePlus className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-slate-900">Upload a screenshot</p>
        <p className="mt-1 text-sm text-slate-500">
          Drag & drop or click — lineup, waiver wire, or trade offer from your fantasy app
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}