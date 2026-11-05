import { test, expect } from "@playwright/test";
import { recoveryDestination } from "../src/lib/adminRecovery";

test("recovery landing on Home opens the existing reset page", () => {
  expect(recoveryDestination("#type=recovery&access_token=test", "/")).toBe("/admin/reset-password");
  expect(recoveryDestination("#type=recovery", "/admin/reset-password")).toBeNull();
});

test("ordinary sign-in and public navigation are not redirected", () => {
  expect(recoveryDestination("#type=signup", "/")).toBeNull();
  expect(recoveryDestination("", "/contact")).toBeNull();
});

test("expired callbacks landing on Home lead to recovery instead of Home", () => {
  expect(recoveryDestination("#error=access_denied&error_code=otp_expired", "/")).toBe("/admin/reset-password");
  expect(recoveryDestination("#error_code=otp_expired", "/contact")).toBeNull();
});