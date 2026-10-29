import { useEffect, useRef, useState } from "react";
import { Send, Lock, ClipboardPlus, Users } from "lucide-react";
import { useStore, canIssue, type Message } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstructionDialog } from "./InstructionDialog";
import { initials, time } from "./util";

export function Chat() {
  const { me, conversations, messages, users, send } = useStore();
  const mine = conversations.filter((c) => c.members.includes(me!.id));
  const [active, setActive] = useState(mine[0]?.id);
  const [text, setText] = useState("");
  const [source, setSource] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const conv = mine.find((c) => c.id === active) ?? mine[0];
  const list = messages.filter((m) => m.convId === conv?.id);
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? "Agent retiré";

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [list.length, conv?.id]);

  if (!conv) return <p className="p-10 text-muted-foreground">Vous n'êtes membre d'aucune conversation.</p>;

  return (
    <div className="flex h-full">
      <section className="hidden w-72 shrink-0 border-r lg:block" aria-label="Conversations">
        <h2 className="px-5 pb-3 pt-6 text-2xl font-semibold tracking-tight">Messages</h2>
        <ul className="px-2">
          {mine.map((c) => {
            const last = messages.filter((m) => m.convId === c.id).at(-1);
            return (
              <li key={c.id}>
                <button onClick={() => setActive(c.id)} className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${c.id === conv.id ? "bg-primary-soft" : "hover:bg-secondary"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    {last && <span className="text-xs text-muted-foreground">{time(last.at)}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{last?.text ?? "Aucun message"}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="glass flex items-center justify-between border-b px-6 py-4">
          <div>
            <select value={conv.id} onChange={(e) => setActive(e.target.value)} className="mb-1 bg-transparent text-base font-semibold lg:hidden" aria-label="Conversation">
              {mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <h3 className="hidden text-base font-semibold lg:block">{conv.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {conv.members.length} membres</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground"><Lock className="h-3 w-3" /> Accès restreint</span>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {list.map((m) => {
            const own = m.authorId === me!.id;
            return (
              <div key={m.id} className={`group flex gap-3 ${own ? "flex-row-reverse" : ""}`}>
                {!own && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{initials(name(m.authorId))}</div>}
                <div className={`max-w-[70%] ${own ? "items-end" : ""} flex flex-col`}>
                  {!own && <span className="mb-1 text-xs text-muted-foreground">{name(m.authorId)}</span>}
                  <div className={`rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${own ? "bg-primary text-primary-foreground" : "bg-bubble-in"}`}>{m.text}</div>
                  <div className={`mt-1 flex items-center gap-2 text-[11px] text-muted-foreground ${own ? "flex-row-reverse" : ""}`}>
                    {time(m.at)}
                    {canIssue(me) && (
                      <button onClick={() => setSource(m)} className="flex items-center gap-1 opacity-0 transition-opacity hover:text-primary focus:opacity-100 group-hover:opacity-100">
                        <ClipboardPlus className="h-3.5 w-3.5" /> Transformer en instruction
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(conv.id, text.trim()); setText(""); } }} className="flex gap-2 border-t px-6 py-4">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message" aria-label="Message" className="h-11 rounded-full bg-muted px-5" />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label="Envoyer" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </section>
      {source && <InstructionDialog source={source} convId={conv.id} onClose={() => setSource(null)} />}
    </div>
  );
}
