import { useState } from "react";
import { MessagesSquare, ClipboardCheck, Users, LogOut, ShieldCheck, ScrollText } from "lucide-react";
import { useStore } from "@/lib/store";
import { Chat } from "./Chat";
import { Instructions } from "./Instructions";
import { Admin } from "./Admin";
import { initials } from "./util";

type Tab = "messages" | "instructions" | "admin";

export function Shell() {
  const { me, logout, instructions } = useStore();
  const [tab, setTab] = useState<Tab>("messages");
  const pending = instructions.filter((i) => !i.closed && i.recipients[me!.id] === "en_attente").length;

  const items = [
    { id: "messages" as const, label: "Messages", icon: MessagesSquare },
    { id: "instructions" as const, label: "Instructions", icon: ClipboardCheck, badge: pending },
    ...(me!.role === "admin" ? [{ id: "admin" as const, label: "Administration", icon: Users }] : []),
  ];

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <aside className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-3 md:w-64 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:p-4">
        <div className="flex items-center gap-2 md:mb-8 md:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight">FasoBrief</span>
        </div>
        <nav className="flex gap-1 md:flex-col" aria-label="Navigation principale">
          {items.map((it) => (
            <button key={it.id} onClick={() => setTab(it.id)} aria-current={tab === it.id ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === it.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <it.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">{it.label}</span>
              {!!it.badge && <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{it.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="hidden md:mt-auto md:block">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-accent-foreground">{initials(me!.name)}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{me!.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{me!.role}</p>
            </div>
            <button onClick={logout} aria-label="Se déconnecter" className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground"><ScrollText className="h-3 w-3" /> Prototype — données fictives</p>
        </div>
        <button onClick={logout} aria-label="Se déconnecter" className="text-muted-foreground md:hidden"><LogOut className="h-5 w-5" /></button>
      </aside>
      <main className="min-h-0 flex-1">
        {tab === "messages" && <Chat />}
        {tab === "instructions" && <Instructions />}
        {tab === "admin" && <Admin />}
      </main>
    </div>
  );
}
