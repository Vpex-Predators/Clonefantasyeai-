import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageBubble from "@/components/analyst/MessageBubble";
import AppNavBar from "@/components/AppNavBar";

const FALLBACK_SUGGESTIONS = [
  "Which of my starters should I shop for a trade right now?",
  "Who on the waiver wire best fixes my weakest position?",
  "Which bench player should I start over my lowest-projected starter?",
];

export default function Analyst() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const bottomRef = useRef(null);

  // Fresh, team-tailored questions (re-fetched whenever the chat is reset).
  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await base44.functions.invoke("getAnalystSuggestions", {});
      setSuggestions(res.data?.questions?.length ? res.data.questions : FALLBACK_SUGGESTIONS);
    } catch {
      setSuggestions(FALLBACK_SUGGESTIONS);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const conversations = await base44.agents.listConversations({ agent_name: "trade_analyst" });
        if (!cancelled && Array.isArray(conversations) && conversations.length > 0) {
          setConversation(conversations[0]);
          setMessages(conversations[0].messages || []);
        }
      } catch { /* start a fresh conversation on first message */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages);
    });
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput("");
    setThinking(true);
    try {
      let convo = conversation;
      if (!convo) {
        convo = await base44.agents.createConversation({
          agent_name: "trade_analyst",
          metadata: { name: "Trade & Roster Analysis" },
        });
        setConversation(convo);
      }
      await base44.agents.addMessage(convo, { role: "user", content });
      base44.analytics.track({
        eventName: "analyst_query_sent",
        properties: { length: content.length, content_length: content.length },
      });
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Something went wrong sending that message: ${err.message || "unknown error"}`,
      }]);
    } finally {
      setThinking(false);
    }
  };

  // Clear chat and re-tailor the suggested questions to the current roster.
  const handleNewChat = async () => {
    if (thinking) return;
    try {
      const convo = await base44.agents.createConversation({
        agent_name: "trade_analyst",
        metadata: { name: "Trade & Roster Analysis" },
      });
      setConversation(convo);
    } catch { /* next message will create a fresh conversation */ }
    setMessages([]);
    loadSuggestions();
  };

  const waitingForReply =
    thinking || (messages.length > 0 && messages[messages.length - 1].role === "user");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500">
            <Calculator className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h1 className="font-heading font-semibold leading-tight">Trade Analyst</h1>
            <p className="text-xs text-slate-500">Long-term value of trades, waivers, and roster calls</p>
          </div>
          <button
            onClick={handleNewChat}
            disabled={thinking}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            New chat
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 pt-6">
        <div className="flex flex-1 flex-col gap-4">
          {messages.length === 0 && !waitingForReply && (
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-500">
                Ask about a trade, waiver add, or bench decision — you'll get rest-of-season projections,
                value gaps, and a clear recommendation.
              </p>
              {loadingSuggestions ? (
                <p className="text-center text-xs text-slate-400">Tailoring suggestions to your team…</p>
              ) : suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm hover:border-slate-400"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
          {waitingForReply && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Crunching the numbers…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="sticky bottom-20 mt-6 flex gap-2 bg-slate-50 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Trade my Pacheco for their Kupp?"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
          />
          <Button type="submit" disabled={!input.trim() || thinking} className="bg-slate-900 hover:bg-slate-800">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
      <AppNavBar />
    </div>
  );
}