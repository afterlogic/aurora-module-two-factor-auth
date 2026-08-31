# TwoFactorAuth mobile — unit tests

Plain-Node Vitest units for the `vue-mobile` glue code (no Quasar / DOM).
Mirrors the `ContactsMobileWebclient/vue-mobile` setup: `src/*` imports are
aliased to stubs in `test/unit/stubs/` via `vitest.config.mjs`.

```bash
cd modules/TwoFactorAuth/vue-mobile
npm install      # first time only (deps are not vendored)
npm run test:unit
```

Covered:

- `settings.js` — parsing of the `TwoFactorAuth` appData section.
- `two-factor-web-api.js` — each wrapper maps to the right backend `Module`/`Method`.
- `test/e2e/helpers/totp.js` — RFC 6238 code generation (Appendix B vectors).
