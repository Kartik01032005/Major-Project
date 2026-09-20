# BloodLink Codebase Cleanup Report

## Scope and approach

The repository was audited before cleanup. Existing working-tree changes were preserved; no reset, broad rewrite, commit, or push was performed. Removal decisions were based on import, route, package, configuration, and documentation references. The canceled PWA, Web Push/VAPID, and Capacitor implementation was removed while the normal BloodLink web application and Socket.IO in-app notification pipeline were retained.

## Files and directories removed

The following confirmed canceled artifacts were removed:

- `client/app/manifest.ts`
- `client/public/sw.js`
- `client/app/offline/`
- `client/components/pwa/`
- `client/hooks/usePWAInstall.ts`
- `client/hooks/usePushNotifications.ts`
- `client/public/icons/` (PWA-only icons)
- `client/capacitor.config.ts`
- `client/android/` (abandoned Capacitor wrapper)
- `server/src/models/PushSubscription.ts`
- `server/src/services/pushService.ts`
- `server/src/types/push.ts`
- `server/src/__tests__/push.test.ts`

This represents 13 named source/configuration/test files plus the PWA icon and Capacitor directories. No active BloodLink route, model, service, or test was intentionally removed.

## Files modified

Cleanup-specific modifications were made to:

- `client/app/layout.tsx`: removed manifest metadata, PWA Apple metadata, service-worker registration, offline indicator, and install prompt mounts.
- `client/components/layout/Navbar.tsx`: removed the mobile install-app action and its hook import.
- `client/components/dashboard/user/NotificationsPanel.tsx`: removed Web Push subscription controls while retaining normal notification display and read actions.
- `client/i18n/*.ts` and `client/i18n/types.ts`: removed five PWA push translation keys from all supported locales and the shared type contract.
- `client/package.json` and `client/package-lock.json`: removed the three Capacitor packages.
- `server/src/controllers/notificationController.ts`: retained notification retrieval and read handlers; removed VAPID, subscribe, unsubscribe, and push-status handlers.
- `server/src/routes/notificationRoutes.ts`: retained the two active in-app notification routes and removed four Web Push routes.
- `server/src/services/notificationQueue.ts`: retained MongoDB notification creation and Socket.IO emission; removed only Web Push dispatch.
- `server/package.json` and `server/package-lock.json`: removed `web-push` and `@types/web-push`.
- `server/.env.example`: removed `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
- `docs/Tasks.md`: removed the obsolete PWA implementation section and canceled PWA/mobile/push future-enhancement entries.

Other modified files already present in the working tree were preserved and were not part of this cleanup decision.

## Dependencies and environment variables

Five canceled-feature dependencies were removed: three Capacitor packages, `web-push`, and `@types/web-push`. Lockfiles were refreshed without broad dependency upgrades. Three Web Push/VAPID environment variables were removed from the example configuration. Secret values were never printed or exposed.

## Routes and active notification behavior

The removed routes were `GET /api/notifications/vapid-key`, `POST /api/notifications/subscribe`, `POST /api/notifications/unsubscribe`, and `GET /api/notifications/push-status`. The active `GET /api/notifications` and `PUT /api/notifications/read/:id` routes remain. Socket.IO notifications remain emitted by `notificationQueue.ts`.

## Validation

| Check | Result |
|---|---|
| Client TypeScript (`npx tsc --noEmit`) | Passed |
| Client ESLint (`npm run lint`) | Passed |
| Client production build (`npm run build`) | Passed; all listed application routes compiled |
| Client tests (`npm test -- --passWithNoTests`) | Passed: 7 suites, 52 tests |
| Server TypeScript build (`npm run build`) | Passed |
| Server tests (`npm test -- --passWithNoTests`) | Passed: 7 suites, 88 tests |
| Final canceled-feature reference checks | No remaining tracked PWA/Web Push/Capacitor references |
| Removed-artifact checks | All targeted paths absent |
| Lockfile canceled dependency/VAPID checks | No remaining entries |

The package installation output reported existing audit findings in the client and server dependency trees. No `npm audit fix` or dependency upgrade was run because that would exceed the cleanup scope.

## Active functionality preserved

The cleanup intentionally preserved the homepage, authentication, password reset, dashboards, emergency requests, donor workflows, inventory, hospitals and nearby facilities, OpenStreetMap/Leaflet and geolocation code, Socket.IO, in-app notifications, chatbot, multilingual support, MongoDB/Mongoose, Express, Next.js, TypeScript, responsive web UI, and security/authentication code. Build and test validation passed; full manual end-to-end browser verification was not performed in this cleanup pass.

## Safety confirmations

- No external resources were downloaded.
- No secrets were exposed.
- No active BloodLink functionality was intentionally removed.
- No `git reset --hard`, broad clean, commit, force push, or push was performed.
- Existing unrelated working-tree changes remain present for the owner’s review.

## Remaining manual review

The repository still contains pre-existing modified files and an untracked geolocation test shown by Git status. Those changes were not discarded because they may represent active user work. They should be reviewed separately before the next commit. The remaining npm audit findings should likewise be handled as a separate security-maintenance task rather than folded into this cleanup.
