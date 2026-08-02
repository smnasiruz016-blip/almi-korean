// A lint for structured-output JSON schemas, written after one shipped broken.
//
// ── WHY THIS EXISTS ──
// The Writing grader's schema was rejected by the API on the first real call, with a 400:
//
//     output_config.format.schema: Invalid schema:
//       Enum value 'strong' does not match declared type '['string', 'null']'
//
// Schema validation happens BEFORE inference, so it failed identically every time — the
// feature was dead on arrival for every learner, not flaky.
//
// The offline proof passed 47/47 through all of it. It had to: it stubs the network, so the
// one component that judges the schema — Anthropic's validator — was the one component not
// present. That is the family's own lesson about a verifier proving the key rather than the
// world, and the honest response is not "test with the real API in CI" (that costs money on
// every run) but to encode the validator's RULES locally and check the schema against them.
//
// So this is the validator's documented contract, restated as code:
//   • no numeric or string constraints — the API rejects them outright
//   • no array form of `type` — `type: ["string", "null"]` is what broke
//   • every enum value must match the declared type
//   • every object must carry additionalProperties: false
//
// It cannot prove a schema is accepted. It can prove a schema does not contain any of the
// things already known to get one rejected, which is the difference between shipping this bug
// once and shipping it twice.

/** Constraints the structured-output validator rejects. Not a style preference — a 400. */
const BANNED_KEYWORDS = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
  "pattern",
] as const;

const TYPE_OF_JSON = (v: unknown): string =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" && Number.isInteger(v) ? "integer" : typeof v;

/** Every problem with `schema`, as human-readable strings. Empty means nothing KNOWN-bad. */
export function lintOutputSchema(schema: unknown, path = "$"): string[] {
  const problems: string[] = [];
  if (typeof schema !== "object" || schema === null) return problems;
  const s = schema as Record<string, unknown>;

  for (const k of BANNED_KEYWORDS) {
    if (k in s) problems.push(`${path}.${k} — the structured-output validator rejects "${k}"; enforce it in Zod after the reply instead`);
  }

  // THE ONE THAT BIT US. `type: ["string","null"]` is legal JSON Schema and an API 400.
  if (Array.isArray(s.type)) {
    problems.push(
      `${path}.type is an array (${JSON.stringify(s.type)}) — the validator rejects the union form. Use anyOf, or a single type with a sentinel enum value.`,
    );
  }

  // Each enum value must be an instance of the declared type. This is the exact assertion the
  // API made when it refused: "Enum value 'strong' does not match declared type [...]".
  //
  // The array form of `type` is checked too, and that is not redundant with the rule above:
  // the API reported THIS problem, not the array one, so a lint that stayed silent here would
  // fail to reproduce the actual 400 and would leave the next author guessing which of the two
  // mattered. Both are reported.
  if (Array.isArray(s.enum) && (typeof s.type === "string" || Array.isArray(s.type))) {
    const declared = (Array.isArray(s.type) ? s.type : [s.type]).map(String);
    for (const v of s.enum) {
      const actual = TYPE_OF_JSON(v);
      const ok = declared.includes(actual) || (declared.includes("number") && actual === "integer");
      if (!ok) {
        problems.push(
          `${path}.enum contains ${JSON.stringify(v)} (${actual}) but type is ${JSON.stringify(s.type)}`,
        );
      }
    }
  }

  if (s.type === "object") {
    if (s.additionalProperties !== false) {
      problems.push(`${path}.additionalProperties must be false — the validator requires it on every object`);
    }
    const props = s.properties;
    if (typeof props === "object" && props !== null) {
      for (const [k, v] of Object.entries(props as Record<string, unknown>)) {
        problems.push(...lintOutputSchema(v, `${path}.${k}`));
      }
      // A property the model is required to emit but that the schema never describes is a
      // 400 waiting to happen, and an easy one to introduce while renaming a field.
      if (Array.isArray(s.required)) {
        for (const r of s.required) {
          if (!(String(r) in (props as Record<string, unknown>))) {
            problems.push(`${path}.required names "${r}", which is not in properties`);
          }
        }
      }
    }
  }

  if (s.type === "array" && s.items) problems.push(...lintOutputSchema(s.items, `${path}[]`));
  for (const key of ["anyOf", "allOf", "oneOf"] as const) {
    if (Array.isArray(s[key])) {
      (s[key] as unknown[]).forEach((sub, i) => problems.push(...lintOutputSchema(sub, `${path}.${key}[${i}]`)));
    }
  }

  return problems;
}
