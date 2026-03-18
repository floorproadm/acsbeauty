import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, User, Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import acsLogo from "@/assets/acs-logo.png";

type Mode = "login" | "register";

// Clientes usam telefone como identificador
// O email fake garante que nunca conflita com admins (que usam email real)
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `client_${digits}@acsbeauty.app`;
}

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 11);
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const isPt = lang === "pt";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verifica se é admin — se for, redireciona para admin auth
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();
        navigate(roleRow ? "/admin/auth" : "/portal");
      }
    });
    if (searchParams.get("mode") === "register") setMode("register");
  }, [navigate, searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Bloqueia admin de usar este auth
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (roleRow) {
        await supabase.auth.signOut();
        toast({
          title: isPt ? "Acesso não permitido aqui" : "Access not allowed here",
          description: isPt ? "Administradores usam /admin/auth" : "Admins sign in at /admin/auth",
          variant: "destructive",
        });
        return;
      }

      toast({ title: isPt ? "Bem-vinda! 👋" : "Welcome! 👋" });
      navigate("/portal");
    } catch {
      toast({
        title: isPt ? "Telefone ou senha incorretos" : "Incorrect phone or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !regPhone || !regPassword || !regConfirm) {
      return toast({ title: isPt ? "Preencha todos os campos obrigatórios" : "Fill in all required fields", variant: "destructive" });
    }
    if (regPassword !== regConfirm) {
      return toast({ title: isPt ? "Senhas não coincidem" : "Passwords don't match", variant: "destructive" });
    }
    if (regPassword.length < 6) {
      return toast({ title: isPt ? "Senha mínima: 6 caracteres" : "Minimum 6 characters", variant: "destructive" });
    }
    if (!acceptedTerms) {
      return toast({ title: isPt ? "Aceite os termos para continuar" : "Accept terms to continue", variant: "destructive" });
    }

    setLoading(true);
    try {
      const email = phoneToEmail(regPhone);
      const fullName = `${firstName} ${lastName}`.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: regPassword,
        options: {
          data: { full_name: fullName, phone: regPhone, birth_date: birthDate || null },
        },
      });
      if (error) throw error;

      // Registra na tabela clients (CRM da Ane) — sem inserir em user_roles
      if (data.user) {
        await supabase.from("clients").insert({
          name: fullName,
          phone: regPhone,
          birthday: birthDate || null,
        });
      }

      toast({ title: isPt ? "Conta criada! 🎉" : "Account created! 🎉", description: isPt ? "Bem-vinda à ACS Beauty." : "Welcome to ACS Beauty." });
      navigate("/");
    } catch (err: any) {
      const alreadyExists = err.message?.includes("already registered") || err.message?.includes("already exists");
      toast({
        title: alreadyExists
          ? (isPt ? "Telefone já cadastrado" : "Phone already registered")
          : (isPt ? "Erro ao criar conta" : "Error creating account"),
        description: alreadyExists ? (isPt ? "Tente fazer login." : "Try signing in.") : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full h-12 border border-border rounded-2xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold transition";

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-background rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {mode === "register" && (
                  <button onClick={() => setMode("login")} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <img src={acsLogo} alt="ACS Beauty" className="h-10 w-auto" />
              </div>
              <div className="flex items-center border border-border rounded-full px-1 py-1 gap-0.5">
                {(["pt", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, x: mode === "register" ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {mode === "login" ? (isPt ? "Bem-vinda de volta" : "Welcome back") : (isPt ? "Criar sua conta" : "Create your account")}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {mode === "login" ? (isPt ? "Entre para acessar sua conta" : "Sign in to access your account") : (isPt ? "Junte-se à ACS Beauty" : "Join ACS Beauty")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onSubmit={handleLogin} className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Telefone" : "Phone"}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-3 h-12 border border-border rounded-2xl bg-muted/30 text-sm shrink-0">🇺🇸 <span className="text-muted-foreground text-xs">+1</span></div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="tel" placeholder="(201) 555-0123" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={`${inputClass} pl-10 pr-4`} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Senha" : "Password"}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1.5">
                      <button type="button" className="text-xs text-rose-gold hover:underline">{isPt ? "Esqueci a senha" : "Forgot password?"}</button>
                    </div>
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full h-[52px] mt-2 rounded-2xl bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider disabled:opacity-60">
                    {loading ? (isPt ? "Entrando..." : "Signing in...") : (isPt ? "Entrar" : "Sign in")}
                  </motion.button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">{isPt ? "ou" : "or"}</span></div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    {isPt ? "Não tem conta? " : "Don't have an account? "}
                    <button type="button" onClick={() => setMode("register")} className="text-rose-gold font-medium hover:underline">{isPt ? "Criar conta" : "Create account"}</button>
                  </p>
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onSubmit={handleRegister} className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Nome" : "First name"}</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder={isPt ? "Seu nome" : "First name"} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${inputClass} pl-10 pr-3`} required />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Sobrenome" : "Last name"}</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder={isPt ? "Sobrenome" : "Last name"} value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${inputClass} pl-10 pr-3`} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Telefone" : "Phone"}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-3 h-12 border border-border rounded-2xl bg-muted/30 text-sm shrink-0">🇺🇸 <span className="text-muted-foreground text-xs">+1</span></div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="tel" placeholder="(201) 555-0123" value={regPhone} onChange={(e) => setRegPhone(formatPhone(e.target.value))} className={`${inputClass} pl-10 pr-4`} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Data de nascimento (opcional)" : "Birth Date (Optional)"}</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${inputClass} pl-10 pr-4`} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Senha" : "Password"}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showRegPass ? "text" : "password"} placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
                      <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{isPt ? "Confirmar senha" : "Confirm password"}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-primary" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {isPt ? "Aceito os " : "I accept the "}
                      <button type="button" className="text-rose-gold underline underline-offset-2">{isPt ? "termos de uso e política de privacidade" : "terms of use and privacy policy"}</button>
                    </span>
                  </label>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full h-[52px] rounded-2xl bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider disabled:opacity-60">
                    {loading ? (isPt ? "Criando conta..." : "Creating account...") : (isPt ? "Criar conta" : "Create account")}
                  </motion.button>

                  <p className="text-center text-sm text-muted-foreground">
                    {isPt ? "Já tem conta? " : "Already have an account? "}
                    <button type="button" onClick={() => setMode("login")} className="text-rose-gold font-medium hover:underline">{isPt ? "Entrar" : "Sign in"}</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
