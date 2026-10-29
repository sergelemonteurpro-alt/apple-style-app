import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "chef" | "agent";
export type User = { id: string; name: string; title: string; role: Role; password: string; revoked: boolean };
export type Message = { id: string; convId: string; authorId: string; text: string; at: number };
export type Conversation = { id: string; name: string; members: string[] };
export type AckStatus = "en_attente" | "recu" | "lu";
export type Instruction = {
  id: string; title: string; body: string; sourceMessageId?: string; convId?: string;
  authorId: string; recipients: Record<string, AckStatus>; deadline?: string; createdAt: number; closed: boolean;
};
export type AuditEntry = { at: number; actorId: string; action: string };

type State = {
  users: User[]; conversations: Conversation[]; messages: Message[];
  instructions: Instruction[]; audit: AuditEntry[]; sessionUserId: string | null;
};

/** Fictitious demo accounts only — never real people. */
export const DEMO_OTP = "226000";
const seed = (): State => {
  const now = Date.now();
  return {
    users: [
      { id: "u1", name: "Awa Compaoré", title: "Administratrice système", role: "admin", password: "demo2026", revoked: false },
      { id: "u2", name: "Issa Ouédraogo", title: "Directeur de cabinet", role: "chef", password: "demo2026", revoked: false },
      { id: "u3", name: "Mariam Sawadogo", title: "Chargée d'études", role: "agent", password: "demo2026", revoked: false },
      { id: "u4", name: "Paul Kaboré", title: "Agent de liaison", role: "agent", password: "demo2026", revoked: false },
    ],
    conversations: [
      { id: "c1", name: "Cabinet — Coordination", members: ["u1", "u2", "u3", "u4"] },
      { id: "c2", name: "Cellule études", members: ["u2", "u3"] },
    ],
    messages: [
      { id: "m1", convId: "c1", authorId: "u2", text: "Bonjour à tous. Réunion de coordination lundi à 9h, salle B.", at: now - 3600e3 * 5 },
      { id: "m2", convId: "c1", authorId: "u3", text: "Bien noté.", at: now - 3600e3 * 4 },
      { id: "m3", convId: "c1", authorId: "u2", text: "Merci de transmettre vos rapports d'activité mensuels avant vendredi 17h.", at: now - 3600e3 * 2 },
      { id: "m4", convId: "c2", authorId: "u2", text: "Mariam, peux-tu préparer la synthèse du dossier numérique ?", at: now - 3600e3 },
    ],
    instructions: [],
    audit: [{ at: now, actorId: "u1", action: "Initialisation de l'espace de démonstration" }],
    sessionUserId: null,
  };
};

const KEY = "fasobrief-state-v1";
const uid = () => Math.random().toString(36).slice(2, 10);

type Api = State & {
  ready: boolean;
  me: User | null;
  login: (userId: string, password: string, otp: string) => string | null;
  logout: () => void;
  send: (convId: string, text: string) => void;
  createInstruction: (i: Omit<Instruction, "id" | "authorId" | "createdAt" | "closed" | "recipients"> & { recipientIds: string[] }) => void;
  acknowledge: (id: string, status: AckStatus) => void;
  closeInstruction: (id: string) => void;
  setRole: (userId: string, role: Role) => void;
  revoke: (userId: string) => void;
  reinstate: (userId: string) => void;
  reset: () => void;
};

const Ctx = createContext<Api | null>(null);

export function canIssue(u: User | null) {
  return !!u && !u.revoked && (u.role === "chef" || u.role === "admin");
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready]);

  const me = s.users.find((u) => u.id === s.sessionUserId && !u.revoked) ?? null;
  const log = (st: State, action: string): AuditEntry[] => [{ at: Date.now(), actorId: st.sessionUserId ?? "-", action }, ...st.audit].slice(0, 200);

  const api: Api = {
    ...s, ready, me,
    login(userId, password, otp) {
      const u = s.users.find((x) => x.id === userId);
      if (!u || u.password !== password) return "Identifiants incorrects.";
      if (u.revoked) return "Ce compte a été révoqué. Contactez l'administrateur.";
      if (otp !== DEMO_OTP) return "Code de vérification invalide.";
      setS((st) => ({ ...st, sessionUserId: userId, audit: [{ at: Date.now(), actorId: userId, action: "Connexion (2 facteurs)" }, ...st.audit] }));
      return null;
    },
    logout() { setS((st) => ({ ...st, sessionUserId: null })); },
    send(convId, text) {
      if (!me) return;
      const conv = s.conversations.find((c) => c.id === convId);
      if (!conv?.members.includes(me.id)) return;
      setS((st) => ({ ...st, messages: [...st.messages, { id: uid(), convId, authorId: me.id, text, at: Date.now() }] }));
    },
    createInstruction({ recipientIds, ...rest }) {
      if (!canIssue(me)) return;
      const valid = recipientIds.filter((id) => s.users.find((u) => u.id === id && !u.revoked));
      setS((st) => ({
        ...st,
        instructions: [{ ...rest, id: uid(), authorId: me!.id, createdAt: Date.now(), closed: false,
          recipients: Object.fromEntries(valid.map((id) => [id, "en_attente" as AckStatus])) }, ...st.instructions],
        audit: log(st, `Instruction émise : « ${rest.title} »`),
      }));
    },
    acknowledge(id, status) {
      if (!me) return;
      setS((st) => ({ ...st, instructions: st.instructions.map((i) =>
        i.id === id && me.id in i.recipients && !i.closed ? { ...i, recipients: { ...i.recipients, [me.id]: status } } : i),
        audit: log(st, `Accusé « ${status === "lu" ? "pris connaissance" : "reçu"} »`) }));
    },
    closeInstruction(id) {
      setS((st) => ({ ...st, instructions: st.instructions.map((i) => i.id === id && i.authorId === me?.id ? { ...i, closed: true } : i),
        audit: log(st, "Instruction clôturée") }));
    },
    setRole(userId, role) {
      if (me?.role !== "admin") return;
      setS((st) => ({ ...st, users: st.users.map((u) => (u.id === userId ? { ...u, role } : u)), audit: log(st, `Rôle modifié : ${role}`) }));
    },
    revoke(userId) {
      if (me?.role !== "admin" || userId === me.id) return;
      const name = s.users.find((u) => u.id === userId)?.name;
      setS((st) => ({
        ...st,
        users: st.users.map((u) => (u.id === userId ? { ...u, revoked: true } : u)),
        conversations: st.conversations.map((c) => ({ ...c, members: c.members.filter((m) => m !== userId) })),
        instructions: st.instructions.map((i) => { const r = { ...i.recipients }; delete r[userId]; return { ...i, recipients: r }; }),
        audit: log(st, `Révocation de ${name} : sessions fermées, retrait de toutes les conversations`),
      }));
    },
    reinstate(userId) {
      if (me?.role !== "admin") return;
      setS((st) => ({ ...st, users: st.users.map((u) => (u.id === userId ? { ...u, revoked: false } : u)),
        audit: log(st, "Réactivation d'un compte (réintégration manuelle aux conversations requise)") }));
    },
    reset() { const n = seed(); setS(n); },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
