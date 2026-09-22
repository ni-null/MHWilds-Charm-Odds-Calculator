# MHWilds Charm Odds Calculator — AI Maintenance Guide

This file is the repository-level instruction source for coding agents. Read it before changing application code.

## Project shape

- Stack: React 19, Vite, React Router, Tailwind CSS, Radix UI, Zustand, and `react-i18next`.
- Entry point: `src/main.jsx`; application routes and shared page shell are in `src/App.jsx`.
- Pages live in `src/pages/<Feature>/index.jsx`. Keep page-specific UI in that feature's `components/` directory.
- Shared visual components belong in `src/components/`; reusable domain logic belongs in `src/lib/`; global state belongs in `src/store/`.
- Static game data is in `src/data/`. Treat it as source data: do not duplicate or translate it directly in components.
- `docs/` is the deployed Vite output. Do not manually edit generated assets or include changed asset hashes unless the task explicitly includes a deployment build.

## Page and component boundaries

- A page component owns routing-level composition, page-local state, and coordination between feature components.
- Extract a component when a UI section has its own rendering rules, interactions, or can be reused. Keep it adjacent to its page unless it is genuinely shared.
- Put data conversion, export/import serialization, probability calculations, and similar pure domain logic in `src/lib/`, not JSX files.
- Keep Zustand stores focused on user-facing, cross-page state. Do not create a second store for data that `i18next` already owns, such as the active language.
- Pass narrow props (`charm`, `onSelect`, `languageCode`) rather than whole stores or unrelated page state.
- Prefer pure helpers and derived `useMemo` values over synchronizing duplicate state with `useEffect`.
- Do not make unrelated cleanup changes while fixing a feature. Preserve existing user changes in a dirty worktree.

## Code style and UI conventions

- Follow the existing JavaScript/JSX style: double-quoted imports and strings in source files, functional React components, Tailwind utility classes, and existing Radix UI wrappers in `src/components/ui/`.
- Use `@/` imports for shared UI where the surrounding file does; use relative imports for nearby feature and domain modules.
- Reuse existing UI primitives (`Button`, `Dialog`, `Select`, `Checkbox`, etc.) instead of rebuilding equivalent controls.
- Keep accessibility text translated: visible labels, `aria-label`, image `alt`, and screen-reader-only labels must not be hard-coded in one language.
- Handle expected malformed game data defensively at the data boundary, not by scattering broad `try/catch` blocks through render code.

## Internationalization (required)

### Source of truth

- `src/i18n/languages.js` is the only language registry. It defines each internal code, BCP 47 `locale`, native selector label, aliases, and translation resource.
- `src/i18n/resources.js` derives i18next resources from that registry.
- `src/i18n/index.js` resolves persisted and browser language values through `resolveLanguageCode` and uses `DEFAULT_LANGUAGE` as fallback.
- Locale JSON files are in `src/i18n/locales/`. Their key schema must stay identical across all supported languages.

### Adding a language

1. Add the locale JSON file with the complete English key schema.
2. Add exactly one entry to `SUPPORTED_LANGUAGES`, including `code`, valid BCP 47 `locale`, `nativeName`, browser/persisted `aliases`, and `translation` import.
3. Do not add language-specific `if`/`switch` branches to components, exports, or selectors.
4. Run `npm run check:i18n` and `npm run test:i18n`.

The registry automatically supplies the language selector, i18next resource map, wiki-db translation lookup, browser-language resolution, and `Intl` locale. A new language should normally require no edits outside its JSON file and this single registry entry.

### Rendering translated values

- Use `const { t, i18n } = useTranslation()` in UI components.
- Translate normal UI copy with stable JSON keys, for example `t("navigation.openMenu")`.
- For a source-data skill name, use `translateSkillName(t, skillName)` from `src/i18n/formatters.js`; it falls back to the original game-data name if a translation is absent.
- For `"Skill Lv.N"` values, use `formatSkillLabel(t, skillKey)`. Never hard-code `"Lv."` in rendered labels.
- For user-visible numbers and dates, use `formatNumber(value, languageCode, options)` and `formatDate(value, languageCode, options)`, with `languageCode = i18n.resolvedLanguage || i18n.language`.
- When a non-translatable fallback is needed, prefer i18next `defaultValue`, e.g. `t("key", { defaultValue: "English fallback" })`, rather than `t("key") || "..."`.
- Never pass internal codes such as `zhTW` directly to `Intl`; pass them through the formatter helpers or `getIntlLocale`.

## Verification

Run checks proportionally to the change. For any i18n, shared UI, export, or data-flow change, run:

```bash
npm run lint
npm run check:i18n
npm run test:i18n
```

- `check:i18n` validates registry consistency, locale-key parity, and all skill translations.
- `test:i18n` covers language resolution, `Intl` formatting, skill fallback, and wiki-db exports.
- Run `npm run build` once before handoff when source/build configuration changes. It regenerates `docs/`; do not leave incidental generated asset-hash changes in a source-focused commit.
- Also inspect `git diff --check` and review the final diff for accidental generated files or unrelated edits.

## Change workflow for agents

1. Inspect the target page, its feature components, relevant store/lib code, and translation keys before editing.
2. Make the smallest cohesive change in the correct layer.
3. Update every locale and relevant tests in the same change when adding a translation key or language.
4. Run the required verification commands; report failures honestly instead of masking them.
5. Keep commit scope focused. A suitable message for this category is `refactor(i18n): centralize language handling`.
