import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { initialRecoveryDestination, ADMIN_RECOVERY_PATH, recoveryDestination } from "@/lib/adminRecovery";
import { supabase } from "@/integrations/supabase/client";

export default function AdminRecoveryRedirect() {
  const navigate = useNavigate();
  const callbackHandled = useRef(false);

  useEffect(() => {
    const destination = initialRecoveryDestination ?? recoveryDestination(window.location.hash, window.location.pathname);
    if (destination && !callbackHandled.current) {
      callbackHandled.current = true;
      navigate(`${destination}${window.location.search}${window.location.hash}`, { replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== ADMIN_RECOVERY_PATH) {
        navigate(ADMIN_RECOVERY_PATH, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}