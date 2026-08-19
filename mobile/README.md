# BloodLink Mobile

The BloodLink mobile application is an Expo Router client for the existing BloodLink Express API. Sprint 1 contains the native project foundation and a health-check screen only; authentication, dashboards, maps, notifications, and admin workflows remain future work.

## Development

```bash
npm install
npm run start
```

Run `npm run android` or `npm run ios` for a native target. For a physical device, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the computer's LAN address, for example `http://192.168.1.10:5000/api`.

## Validation

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

The app uses the website's BloodLink red/slate design tokens, rounded card surfaces, concise typography hierarchy, and system light/dark appearance. Native system sans fonts are used until the Expo Router dependency graph can support a pinned Inter font package without peer conflicts.

## Structure

- `app/`: Expo Router screens and navigation layout
- `src/components/`: small reusable native components
- `src/config/`: validated public runtime configuration
- `src/services/`: centralized typed API access
- `src/theme/`: colors, spacing, and appearance-aware theme selection
- `src/types/`: API and environment types