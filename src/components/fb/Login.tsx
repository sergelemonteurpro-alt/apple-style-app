import { useState } from "react";
import { ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { useStore, DEMO_OTP } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Login() {
  const { users, login } = useStore();
  const [userId, setUserId] = useState("u2");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      const u = users.find((x) => x.id === userId);
      if (!u || u.password !== password) return setError("Identifiants incorrects.");
      if (u.revoked) return setError("Ce compte a été révoqué. Contactez l'administrateur.");
      return setStep(2);
    }
    const err = login(userId, password, otp.trim());
    if (err) setError(err);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">FasoBrief</h1>
          <p className="mt-1 text-sm text-muted-foreground">Messagerie des agents de l'administration</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="user">Agent enrôlé</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger id="user"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} — {u.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Mot de passe</Label>
                <Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp" className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Code de vérification</Label>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" className="text-center text-lg tracking-[0.4em]" autoFocus required />
              <p className="text-xs text-muted-foreground">Second facteur. Code de démonstration : <span className="font-medium text-foreground">{DEMO_OTP}</span></p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full rounded-xl">
            <KeyRound className="h-4 w-4" /> {step === 1 ? "Continuer" : "Se connecter"}
          </Button>
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:text-foreground">Retour</button>
          )}
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">Comptes fictifs de démonstration — mot de passe : demo2026</p>
      </div>
    </main>
  );
}
