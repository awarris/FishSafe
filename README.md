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

- wind speed at 10 m.

**Marine API**

Used for:

- significant wave height.

The integration is implemented in:

```text
src/services/open-meteo-service.ts
```

The service converts the external API responses into FishSafe's internal forecast model and merges Weather and Marine values by hourly timestamp.


### Units used by FishSafe

FishSafe explicitly requests `wind_speed_unit=kmh` from Open-Meteo Weather, so `wind_speed_10m` is consumed in **km/h**.

Open-Meteo Marine documents `wave_height` in **metres**, so FishSafe consumes that value directly in metres.

The integration logs the units returned in `hourly_units` and warns when an unexpected unit is received.

### 3.3 Offline behavior

Once a trip is prepared, the complete normalized forecast is saved locally with AsyncStorage.

```text
src/storage/forecast-storage.ts
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

FishSafe now uses a simple conservative classification grid based on **two variables only**:

- wind speed in **km/h**;
- significant wave height in **metres**.

There is **no weighted score**.

Wind and waves are classified independently, and the application always keeps the **highest level**.

```text
Wind level ─┐
            ├─> highest level ─> final FishSafe risk
Wave level ─┘
```

### Risk grid

| Level | Wind | Wave height | Recommendation |
|---|---|---|---|
| 1 — Low | `< 20 km/h` | `< 1.0 m` | Favorable conditions |
| 2 — Moderate | `>= 20 and < 39 km/h` | `>= 1.0 and < 1.5 m` | Stay alert and keep informed |
| 3 — High | `>= 39 and <= 61 km/h` | `>= 1.5 and <= 2.5 m` | Departure not recommended; use caution if already at sea |
| 4 — Danger | `> 61 km/h` | `> 2.5 m` | Return recommended / do not depart |

Boundary values are explicit to avoid overlapping ranges. For example:

```text
wind = 30 km/h  -> level 2
waves = 1.8 m   -> level 3

final level     -> level 3
```

The implementation is isolated under:

```text
src/risk/
├── calculate-risk.ts
└── risk-config.ts
```

The vessel type and planned duration remain part of trip preparation, but they **do not currently change the risk level**. Duration is used to determine how much forecast data should be downloaded for the trip window.
---


## Jury demonstration mode

When the configured **test area at sea** is used, the active-trip screen exposes a clearly labelled jury-demo panel. It never silently replaces real Open-Meteo data.

- **Real forecast** — keeps the downloaded Open-Meteo forecast.
- **Degradation** — controlled sequence: level 1 → level 2 → level 3 → level 3 → level 4.
- **Danger** — starts directly with level-4 conditions.

This separation makes the product demonstrable regardless of the weather on presentation day while preserving the real-data workflow.

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

## Branding assets

FishSafe uses one approved visual identity across the application.

```text
assets/images/
├── fishsafe-logo.png
├── fishsafe-icon.png
├── fishsafe-android-foreground.png
├── fishsafe-favicon.png
└── fishsafe-splash.png
```

- `fishsafe-logo.png` is used inside the application UI.
- `fishsafe-icon.png` is the main application icon.
- `fishsafe-android-foreground.png` is used by Android adaptive icons.
- `fishsafe-favicon.png` is used by the web build.
- `fishsafe-splash.png` contains the FishSafe logo, application name, and tagline for the native startup screen.

The source code should reference these centralized assets instead of duplicating branding files.

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
- conservative wind-and-wave risk classification;
- pre-departure analysis;
- active-trip simulation;
- structured logs;
- French and English UI;
- light and dark themes.

The current risk grid is implemented as the team-provided domain rule. Further field validation and safety review should still be completed before operational deployment.
