import { test, expect } from "@playwright/test";
import { buildWhatsAppMessage, buildWhatsAppUrl, PUBLIC_BOOKING_ENABLED, isProtectedConversionPath } from "../src/lib/whatsapp";
import { skipHoldAccessStatus } from "../supabase/functions/calendar-confirm-booking/authorization";

test("public booking is suspended reversibly", () => {
  expect(PUBLIC_BOOKING_ENABLED).toBe(false);
});
test("new WhatsApp links use official international number and encode their message", () => {
  const context = { source: "home" as const, language: "pt" as const };
  const url = new URL(buildWhatsAppUrl(context));
  expect(url.pathname).toBe("/17329153430");
  expect(url.searchParams.get("text")).toBe(buildWhatsAppMessage(context));
  expect(url.search).toContain("%C3%A1");
});
test("SKU names take priority over service and category context", () => {
  const message = buildWhatsAppMessage({ source: "sku", language: "pt", category: "cabelo", serviceName: "Highlights", skuName: "Full Highlights", serviceId: "secret-id", skuId: "hidden-id" });
  expect(message).toContain("Highlights, na opção Full Highlights");
  expect(message).not.toContain("secret-id");
  expect(message).not.toContain("hidden-id");
});
test("service names take priority over category without invented translations", () => {
  expect(buildWhatsAppMessage({ source: "service", language: "en", category: "cabelo", serviceName: "Highlights" })).toContain("your Highlights service");
});
for (const category of ["cabelo", "sobrancelhas", "unhas"]) {
  test(`${category} category is contextualized in PT and EN`, () => {
    const pt = buildWhatsAppMessage({ source: "category", language: "pt", category });
    const en = buildWhatsAppMessage({ source: "category", language: "en", category });
    expect(pt).toContain(category === "cabelo" ? "cabelo" : category);
    expect(en).toContain(category === "cabelo" ? "hair" : category === "unhas" ? "nail" : "brow");
  });
}
for (const intent of ["availability", "price", "guidance"] as const) {
  test(`guided conversation respects ${intent} intent`, () => {
    const message = buildWhatsAppMessage({ source: "guided", language: "en", serviceName: "Highlights", intent });
    expect(message).toContain("Highlights");
    expect(message).toContain(intent === "availability" ? "check availability" : intent === "price" ? "pricing" : "personalized guidance");
  });
}
test("uncertain visitors receive guidance without a recommendation", () => {
  const message = buildWhatsAppMessage({ source: "guided", language: "pt", category: "unhas", intent: "price" });
  expect(message).toContain("ainda não tenho certeza");
  expect(message).toContain("orientação personalizada");
  expect(message).not.toContain("Gel Nails");
});
test("protected page recognition includes case and trailing slash", () => {
  expect(isProtectedConversionPath("/contact")).toBe(true);
  expect(isProtectedConversionPath("/Ane-Caroline/")).toBe(true);
  expect(isProtectedConversionPath("/services")).toBe(false);
});
test("unauthenticated manual hold bypass is rejected", () => {
  expect(skipHoldAccessStatus(true, null, [])).toBe(401);
});
test("authenticated non-staff hold bypass is rejected", () => {
  expect(skipHoldAccessStatus(true, "client-user", ["marketing"])).toBe(403);
});
test("owner and staff retain manual hold bypass", () => {
  expect(skipHoldAccessStatus(true, "owner-user", ["admin_owner"])).toBe(200);
  expect(skipHoldAccessStatus(true, "staff-user", ["staff"])).toBe(200);
});
test("ordinary hold-based access remains unchanged", () => {
  expect(skipHoldAccessStatus(false, null, [])).toBe(200);
});