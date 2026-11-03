import { test, expect } from "@playwright/test";
test("deferred map and posting routes load and navigation stays usable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#home");
  await expect(page.locator(".leaflet-container").first()).toBeVisible();
  await page.goto("/#post");
  await expect(
    page.getByRole("heading", { name: "Post property", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What would you like to list?" }),
  ).toBeVisible();
  await page.goto("/#agents");
  await expect(
    page.getByRole("heading", { name: "Find your local expert" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find your local expert" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test("all authored keyframes and transitions use compositor properties", async ({
  page,
}) => {
  await page.goto("/#agents");
  const violations = await page.evaluate(() => {
    const allowed = new Set([
      "transform",
      "translate",
      "scale",
      "rotate",
      "opacity",
    ]);
    const errors = [];
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          for (const frame of rule.cssRules)
            for (const property of Array.from(frame.style))
              if (!allowed.has(property))
                errors.push(rule.name + ": " + property);
        } else if (rule.style?.transition && rule.style.transition !== "none") {
          // CSSOM leaves longhands empty when a shorthand contains var().
          const properties = rule.style.transitionProperty
            ? rule.style.transitionProperty.split(",").map((x) => x.trim())
            : rule.style.transition
                .replace(/(?:var|cubic-bezier|steps)\([^)]*\)/g, "easing")
                .split(",")
                .map((x) => x.trim().split(/\s+/)[0]);
          for (const property of properties)
            if (!allowed.has(property) && property !== "none")
              errors.push(rule.selectorText + ": " + property);
        } else if (rule.cssRules) walk(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      if (sheet.href && !sheet.href.startsWith(location.origin)) continue;
      try {
        walk(sheet.cssRules);
      } catch (error) {
        errors.push(String(error));
      }
    }
    return errors;
  });
  expect(violations).toEqual([]);
});

test("property saves update immediately and persist across a reload", async ({
  page,
}) => {
  await page.goto("/#home");
  const save = page.locator(".property-card .save-button").first();
  await expect(save).toBeVisible();
  const label = await save.getAttribute("aria-label");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("centometer-saved") || "[]").length,
      ),
    )
    .toBeGreaterThan(0);
  await page.reload();
  const saved = page.getByRole("button", {
    name: label.replace(/^Save /, "Unsave "),
    exact: true,
  });
  // Home can show the same listing in discovery and the complete list.
  // Every instance must reflect the same persisted save state.
  await expect(saved.first()).toHaveAttribute("aria-pressed", "true");
  for (const button of await saved.all()) {
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  await saved.first().click();
  const unsaved = page.getByRole("button", { name: label, exact: true });
  await expect(saved).toHaveCount(0);
  await expect(unsaved.first()).toHaveAttribute("aria-pressed", "false");
  for (const button of await unsaved.all()) {
    await expect(button).toHaveAttribute("aria-pressed", "false");
  }
});
