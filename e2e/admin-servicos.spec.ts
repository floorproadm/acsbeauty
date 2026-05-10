import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

/**
 * E2E: Admin → Serviços tab
 *
 * Note: O painel admin usa tabs internas (não rotas REST). O acesso à aba
 * "Serviços" se dá clicando no item da sidebar a partir de /admin.
 * Caso o usuário não esteja autenticado, a rota redireciona para /admin/auth
 * e o teste é encerrado de forma graciosa (skip), pois sem sessão não há tab.
 */
test.describe("Admin → Serviços", () => {
  test("renderiza a aba Serviços e expande/recolhe sem quebrar", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });

    if (page.url().includes("/admin/auth")) {
      test.skip(true, "Sessão de admin necessária para validar a aba Serviços.");
      return;
    }

    // 1. Sidebar item "Serviços"
    const servicosLink = page.getByRole("button", { name: /^Serviços$/ });
    await expect(servicosLink).toBeVisible({ timeout: 10_000 });
    await servicosLink.click();

    // 2. Cabeçalho da aba
    await expect(page.getByRole("heading", { name: "Serviços", level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar serviços/i)).toBeVisible();

    // 3. Pelo menos uma categoria collapsible visível
    const categoryTrigger = page.locator("button", { hasText: /Cabelo|Sobrancelhas|Unhas/ }).first();
    await expect(categoryTrigger).toBeVisible({ timeout: 10_000 });

    // 4. Recolher e expandir a categoria — não pode lançar erros
    await categoryTrigger.click();
    await page.waitForTimeout(300);
    await categoryTrigger.click();
    await page.waitForTimeout(300);

    // 5. Sem erros de runtime nem warnings de DOM nesting fatais
    const fatal = consoleErrors.filter(
      (e) =>
        !e.includes("postMessage") &&
        !e.includes("404 Error") &&
        !e.toLowerCase().includes("favicon")
    );
    expect(fatal, `Erros no console:\n${fatal.join("\n")}`).toEqual([]);

    // 6. Sem overflow horizontal na página
    const metrics = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(metrics.scrollW).toBeLessThanOrEqual(metrics.clientW + 1);
  });
});
