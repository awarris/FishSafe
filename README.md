# FishSafe

FishSafe is a mobile preventive safety assistant for small-scale fishers.

It helps a fisher prepare a trip, understand expected marine conditions, keep the downloaded forecast available offline, and monitor how the estimated risk evolves during the trip.

> **Safety notice:** FishSafe is a decision-support prototype. It does not replace official marine forecasts, maritime authorities, navigation equipment, emergency services, or professional safety procedures.

---

## 1. Product purpose

Small-scale fishers may operate with limited connectivity and without an easy way to translate raw weather and marine data into a simple preventive view of the trip.

FishSafe focuses on one question:

> **Are the expected conditions becoming more risky for this planned trip?**

The application does not try to replace meteorological services. It consumes forecast data, simplifies it, stores it locally, and passes it through a dedicated risk model.

---

## 2. User flow

The current proof of concept follows this flow:

```text
Home
  ↓
Prepare trip
  ├─ GPS location or demo location
  ├─ expected duration
  └─ vessel type
  ↓
Download forecast
  ├─ Open-Meteo Weather API
  └─ Open-Meteo Marine API
  ↓
Normalize + merge hourly data
  ↓
Store prepared trip locally
  ↓
Pre-departure conditions
  ├─ wind
  ├─ gusts
  ├─ waves
  ├─ swell
  └─ estimated risk
  ↓
Start trip
  ↓
Offline preventive monitoring
  ↓
Risk reevaluation as forecast conditions evolve
```

For the hackathon demonstration, the active-trip screen includes a **Simulate next hour** action. It advances through the already downloaded hourly forecast so the jury can see the risk engine react without waiting in real time.

---

## 3. How the application works

### 3.1 Trip preparation

The user provides only the information needed by the current model:

- current GPS position;
- planned duration;
- vessel type.

A predefined demo location is also available for development and presentation when an emulator cannot provide a reliable GPS position.

### 3.2 Forecast retrieval

FishSafe calls two Open-Meteo services in parallel.

**Weather API**

Used for:

- wind speed at 10 m;
- wind gusts at 10 m;
- wind direction at 10 m.

**Marine API**

Used for:

- wave height;
- wave period;
- wave direction;
- swell height;
- swell period;
- swell direction.

The integration is implemented in:

```text
src/services/openMeteo.service.ts
```

The service converts the external API responses into FishSafe's internal forecast model and merges Weather and Marine values by hourly timestamp.

### 3.3 Offline behavior

Once a trip is prepared, the complete normalized forecast is saved locally with AsyncStorage.

```text
src/storage/forecast.storage.ts
```

The active trip does not need to call Open-Meteo every time the risk is reevaluated. It can use the forecast downloaded before departure.

This is the current offline strategy:

```text
Internet before departure
        ↓
Download forecast
        ↓
Normalize data
        ↓
Save locally
        ↓
No Internet at sea
        ↓
Read stored forecast
        ↓
Continue risk evaluation
```

### 3.4 Risk engine

Risk logic is deliberately separated from screens, API calls, and storage.

```text
src/risk/
├── calculateRisk.ts
└── risk.config.ts
```

The engine receives:

- one normalized hourly forecast point;
- vessel type;
- planned trip duration.

It returns:

- numeric score;
- risk level;
- factors contributing to the result.

Current levels are:

```text
low
moderate
high
critical
```

### Important risk-model status

The thresholds currently stored in `risk.config.ts` are **demonstration values**.

They are not official maritime safety thresholds.

The production-oriented design is intentional: once the team validates a credible risk model, the thresholds and formula can be replaced without rewriting the API integration, storage, navigation, localization, or presentation layers.

---

## 4. Architecture

FishSafe uses a small layered architecture.

```text
UI / Routes
    ↓
Hooks and reusable components
    ↓
Application services
    ↓
Normalized domain types
    ↓
Storage and risk engine
    ↓
External data provider
```

### Source structure

```text
src/
├── app/          # Expo Router routes and screen composition
├── components/   # Reusable presentation components
├── config/       # Central application configuration
├── hooks/        # Reusable application hooks
├── i18n/         # Internationalization bootstrap and translations
├── providers/    # Global application providers
├── risk/         # Risk configuration and scoring engine
├── services/     # External service integrations
├── storage/      # Local persistence
├── types/        # Language-neutral domain contracts
├── utils/        # Cross-cutting utilities
└── theme.ts      # Light and dark theme tokens
```

### Separation of responsibilities

| Layer | Responsibility |
|---|---|
| `app/` | User flow, route composition, screen state |
| `components/` | Small reusable UI elements |
| `services/` | Network communication and external API normalization |
| `storage/` | Device persistence |
| `risk/` | Risk calculation only |
| `types/` | Shared domain contracts |
| `i18n/` | User-facing language resources |
| `providers/` | Global state such as appearance |
| `utils/` | Shared technical utilities such as logging |

---

## 5. Internationalization

The interface supports:

- French — default;
- English.

Translations are stored in:

```text
src/i18n/locales/fr.json
src/i18n/locales/en.json
```

User-facing text should not be hard-coded inside domain or service code.

The selected language is stored locally and restored on the next application launch.

---

## 6. Appearance

FishSafe supports:

- light mode;
- dark mode;
- system appearance on first use.

If the user explicitly switches between light and dark mode, that preference is stored locally.

Theme implementation:

```text
src/theme.ts
src/providers/theme-provider.tsx
src/hooks/use-app-theme.ts
```

---

## 7. Technical logging

FishSafe uses a single structured logger instead of scattered `console.log` calls.

```text
src/utils/logger.ts
```

Log format:

```text
[FishSafe][timestamp][level][module][step] message payload
```

Examples of logged stages:

```text
GPS permission
GPS lookup
Weather API request
Marine API request
Forecast merge
Local storage write
Local storage read
Risk calculation
Trip start
Demo time progression
Preventive alert
Trip end
```

These logs are intended to make testing and debugging traceable from start to finish.

---

## 8. Tech stack

- React Native
- Expo
- Expo Router
- TypeScript
- `expo-location`
- AsyncStorage
- i18next
- react-i18next
- Open-Meteo Weather API
- Open-Meteo Marine API

No Open-Meteo API key is currently required by this integration.

---

## 9. Local setup

### Requirements

Install:

- Node.js;
- npm;
- Android Studio or an Android device;
- Expo Go for the fastest development workflow.

### Install dependencies

```bash
npm install
```

If required by the project state:

```bash
npx expo install expo-location
npx expo install @react-native-async-storage/async-storage
npm install i18next react-i18next
```

### Start the application

```bash
npx expo start
```

Clear Metro cache when needed:

```bash
npx expo start -c
```

Then open the project with Expo Go or the Android emulator.

---

## 10. Recommended test scenario

Use this scenario when validating a fresh installation:

1. Open FishSafe.
2. Confirm French is the default language.
3. Switch to English and back to French.
4. Switch between light and dark mode.
5. Open **Prepare trip**.
6. Use GPS or select the demo location.
7. Select `4 h`.
8. Select a motorized canoe.
9. Tap **Analyze conditions**.
10. Verify both Open-Meteo requests return successfully in the terminal logs.
11. Verify the pre-departure conditions screen displays forecast values.
12. Start the trip.
13. Disable Internet connectivity.
14. Confirm the active-trip screen still reads the stored forecast.
15. Use **Simulate next hour** and verify risk recalculation logs.
16. End the trip.

---

## 11. Development conventions

The project follows these rules:

- source code is written in professional English;
- file names use `kebab-case`;
- React components use `PascalCase`;
- variables and functions use `camelCase`;
- types use `PascalCase`;
- comments explain intent, constraints, or non-obvious decisions;
- comments should not restate self-explanatory code;
- user-facing strings go through i18n;
- domain types remain language-neutral;
- network code stays inside services;
- persistence stays inside storage modules;
- risk logic stays outside UI code;
- temporary or demo behavior must be explicitly identified;
- unused dependencies, dead files, duplicate logic, and debug-only code should not be committed.

### Commenting policy

FishSafe does **not** aim to comment every line.

Professional comments are used for:

- file responsibilities;
- public or important functions;
- architectural boundaries;
- safety-sensitive assumptions;
- temporary hackathon behavior;
- non-obvious implementation decisions.

Readable code should explain the simple parts by itself.

---

## 12. Current prototype limitations

The current proof of concept still has known limits:

- GPS behavior can vary in Android emulators;
- risk thresholds are not yet scientifically validated;
- the active-trip demo advances through stored forecast hours manually;
- no emergency-service integration is included;
- no background GPS tracking is currently implemented;
- no account or cloud backend is required for the current MVP.

These limits are deliberate and keep the hackathon prototype focused on the core preventive workflow.

---

## 13. Deployment direction

For hackathon delivery, the target is an Android installable build generated with Expo / EAS.

Typical next steps:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

A preview Android profile can then be used to generate an installable APK for demonstrations.

Production publishing is a separate step and is not required to validate the MVP.

---

## 14. Project status

Current functional scope:

- trip preparation;
- GPS integration;
- demo location;
- Open-Meteo Weather integration;
- Open-Meteo Marine integration;
- normalized forecast model;
- offline forecast persistence;
- demo risk scoring;
- pre-departure analysis;
- active-trip simulation;
- structured logs;
- French and English UI;
- light and dark themes.

The next major domain milestone is the replacement of the demonstration risk model with a validated maritime risk model.
