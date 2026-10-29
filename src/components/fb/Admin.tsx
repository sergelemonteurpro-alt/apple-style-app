import { UserX, UserCheck, History, RotateCcw } from "lucide-react";
import { useStore, type Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { initials, date, time } from "./util";

const roles: Record<Role, string> = { admin: "Administrateur", chef: "Chef de service", agent: "Agent" };

export function Admin() {
  const { me, users, audit, setRole, revoke, reinstate, reset } = useStore();
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? "Système";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">Administration</h2>
        <p className="mt-1 text-sm text-muted-foreground">Agents enrôlés, rôles et révocation</p>

        <ul className="mt-8 divide-y rounded-2xl border bg-card">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${u.revoked ? "bg-secondary text-muted-foreground" : "bg-primary-soft text-accent-foreground"}`}>{initials(u.name)}</div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${u.revoked ? "text-muted-foreground line-through" : ""}`}>{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.title}{u.revoked && " · Révoqué"}</p>
              </div>
              <Select value={u.role} onValueChange={(r) => setRole(u.id, r as Role)} disabled={u.id === me!.id || u.revoked}>
                <SelectTrigger className="w-40" aria-label={`Rôle de ${u.name}`}><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(roles) as Role[]).map((r) => <SelectItem key={r} value={r}>{roles[r]}</SelectItem>)}</SelectContent>
              </Select>
              {u.id !== me!.id && (u.revoked ? (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => reinstate(u.id)}><UserCheck className="h-4 w-4" /> Réactiver</Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive"><UserX className="h-4 w-4" /> Révoquer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Révoquer {u.name} ?</AlertDialogTitle>
                      <AlertDialogDescription>Ses sessions seront fermées, la connexion refusée, et l'agent sera retiré de toutes les conversations et instructions.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => revoke(u.id)}>Révoquer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5 text-primary" /> Journal d'audit</h3>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" /> Réinitialiser la démo</Button>
        </div>
        <ul className="mt-3 divide-y rounded-2xl border bg-card text-sm">
          {audit.slice(0, 30).map((a, k) => (
            <li key={k} className="flex gap-4 px-4 py-3">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{date(a.at)} {time(a.at)}</span>
              <span className="flex-1">{a.action}</span>
              <span className="text-xs text-muted-foreground">{name(a.actorId)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
