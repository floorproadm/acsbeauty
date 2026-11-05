import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const { t } = useLanguage();
  const ready = status === "ready";
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.has("error")) {
      setStatus("invalid");
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    const timeout = window.setTimeout(() => {
      if (active) setStatus((current) => current === "checking" ? "invalid" : current);
    }, 10000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (active) setStatus("ready");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setStatus(session ? "ready" : "invalid");
    }).catch(() => {
      if (active) setStatus("invalid");
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    if (password.length < 8) {
      toast({ title: t("admin.reset.short"), description: t("admin.reset.minimum"), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: t("admin.reset.mismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: t("admin.reset.success"), description: t("admin.reset.success_description") });
      await supabase.auth.signOut();
      navigate("/admin/auth");
    } catch (err: any) {
      toast({ title: t("admin.reset.error"), description: err?.message ?? t("admin.reset.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl shadow-soft border border-border">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold">{t("admin.reset.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(`admin.reset.${status}`)}
            </p>
          </div>

          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("admin.reset.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t(showPassword ? "admin.reset.hide" : "admin.reset.show")}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">{t("admin.reset.confirm")}</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.reset.save")}
              </Button>
            </form>
          )}

          {status === "invalid" && (
            <Button variant="outline" className="w-full" onClick={() => navigate("/admin/auth")}>{t("admin.reset.login")}</Button>
          )}

          {status === "checking" && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-rose-gold" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
