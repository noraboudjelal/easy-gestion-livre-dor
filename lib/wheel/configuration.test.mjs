import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOTS, normalizeWheelSlug, wheelBusinessInput } from "./configuration.mjs";

test("merchant names generate stable accented-name slugs and trim the eight labels", () => {
  assert.equal(normalizeWheelSlug("  Café Étoile ! "), "cafe-etoile");
  assert.deepEqual(wheelBusinessInput({ name: " Coiffeur XYZ ", lots: DEFAULT_LOTS.map((lot) => ` ${lot} `) }),
    { name: "Coiffeur XYZ", slug: "coiffeur-xyz", lots: DEFAULT_LOTS });
});

test("refuse missing, extra, non-string, blank and oversized lots", () => {
  for (const lots of [DEFAULT_LOTS.slice(1), [...DEFAULT_LOTS, "Autre"], [null, ...DEFAULT_LOTS.slice(1)], ["  \t", ...DEFAULT_LOTS.slice(1)], ["x".repeat(61), ...DEFAULT_LOTS.slice(1)]]) {
    assert.throws(() => wheelBusinessInput({ name: "Commerce", lots }), /8 lots/);
  }
});

test("refuse invalid merchant names and identifiers", () => {
  for (const name of [" ", 123, "x".repeat(101)]) assert.throws(() => wheelBusinessInput({ name, lots: DEFAULT_LOTS }), /nom/);
  for (const slug of ["!", "x".repeat(81), { value: "shop" }]) assert.throws(() => wheelBusinessInput({ name: "Shop", slug, lots: DEFAULT_LOTS }));
});
