import React, { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";

const statusLabels = {
  pending: "Pending", running: "Running", in_progress: "In progress",
  completed: "Completed", success: "Success", failed: "Failed", error: "Error",
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const rawStatus = (toolCall.status || "").toLowerCase();
  let failed = ["failed", "error"].includes(rawStatus);
  const success = ["success", "completed"].includes(rawStatus);
  const label = statusLabels[rawStatus] || rawStatus || "Working";

  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw string */ }
  }
  if (parsedResults && typeof parsedResults === "object" && parsedResults.success === false) failed = true;

  let args = toolCall.arguments_string;
  try { args = JSON.parse(args); } catch { /* keep raw string */ }

  const projection = toolCall.display_projection;
  const hideDetails = projection && projection.hide_details && projection.details_redacted;
  if (hideDetails) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        {success ? (
          <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {projection.label || "Done"}</span>
        ) : failed ? (
          <span className="flex items-center gap-1 text-red-500"><Wrench className="h-3 w-3" /> {projection.error_label || "Failed"}</span>
        ) : (
          <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {projection.active_label || "Working"}…</span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left font-medium text-slate-600"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Wrench className="h-3.5 w-3.5" />
        <span className="capitalize">{(toolCall.name || "").replace(/_/g, " ")}</span>
        <span className={failed ? "text-red-500" : success ? "text-emerald-600" : "text-slate-400"}>
          {success && !failed ? "· success" : failed ? "· failed" : "· running"}
        </span>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600">
          <div>
            <span className="font-semibold">Args:</span>{" "}
            <span className="break-all">{typeof args === "string" ? args : JSON.stringify(args, null, 2)}</span>
          </div>
          <div>
            <span className="font-semibold">Result:</span>{" "}
            <span className="break-all">{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
        isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-900"
      }`}>
        {message.content && (
          isUser
            ? <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            : <ReactMarkdown className="prose prose-sm max-w-none text-sm">{message.content}</ReactMarkdown>
        )}
        {message.tool_calls?.map((toolCall, i) => <ToolCallDisplay key={i} toolCall={toolCall} />)}
      </div>
    </div>
  );
}