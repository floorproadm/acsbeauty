import type { AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppUrl, PUBLIC_BOOKING_ENABLED, type WhatsAppContext } from "@/lib/whatsapp";

type Context = Omit<WhatsAppContext, "language">;

// Use only existing non-personal columns. The link opens even when analytics fail.
export function trackWhatsAppClick(context: Context): void {
  try {
    let sessionId = sessionStorage.getItem("wa_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("wa_session_id", sessionId);
    }
    const params = new URLSearchParams(window.location.search);
    void supabase.from("whatsapp_clicks").insert({
      page_path: window.location.pathname,
      session_id: sessionId,
      service_interest: context.source === "guided" ? null : context.serviceName || context.category || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    }).then(() => {}, () => {});
  } catch { /* Analytics must never prevent navigation. */ }
}

export function WhatsAppLink({ context, bookingHref = "/book", onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { context: Context; bookingHref?: string }) {
  const { language } = useLanguage();
  if (PUBLIC_BOOKING_ENABLED && context.source !== "guided") {
    return <Link {...props} to={bookingHref} onClick={onClick} />;
  }
  return <a {...props} href={buildWhatsAppUrl({ ...context, language })} target="_blank" rel="noopener noreferrer" onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) trackWhatsAppClick(context);
  }} />;
}

export function WhatsAppCTA({ context, children, ...props }: ButtonProps & { context: Context }) {
  return <Button {...props} asChild><WhatsAppLink context={context}>{children}</WhatsAppLink></Button>;
}

export function ProtectedCommercialLink({ bookingHref, source, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { bookingHref: string; source: "header" | "home" }) {
  const { pathname } = useLocation();
  // Explicitly preserve existing shared behavior on frozen pages.
  const protectedPath = ["/contact", "/ane-caroline"].includes(pathname.toLowerCase().replace(/\/$/, ""));
  return protectedPath
    ? <Link {...props} to={bookingHref} />
    : <WhatsAppLink {...props} context={{ source }} bookingHref={bookingHref} />;
}