# Mock Services Overview

Este documento describe la capa de servicios simulados que alimenta el
frontend mientras esperamos las credenciales reales de Supabase, Azure
Speech/TTS y GPT.

## Objetivo

- Permitir desarrollar pantallas y lógica sin dependencias externas.
- Centralizar los contratos de datos que luego serán reemplazados por
  llamadas reales.
- Facilitar pruebas rápidas sin conectar dispositivos a internet.

## Ubicación de los servicios

```
src/services/
├── audio.ts
├── dashboard.ts
├── practice.ts
├── preferences.ts
└── progress.ts
```

Todos los módulos re-exportan sus funciones desde `src/services/index.ts`
para importar de forma unificada.

## Detalle de cada servicio

### Dashboard (`dashboard.ts`)

- `fetchDashboard()` → `IDashboardData`
- `fetchDailyGoals()` → `IDailyGoal[]`
- `fetchLessonRecommendations()` → `ILessonRecommendation[]`
- `fetchQuickActions()` → `IQuickAction[]`

Utiliza los mocks definidos en `src/constants/mocks.ts` para mantener
consistencia con el dominio de la app (pronunciación, lecciones,
acciones rápidas).

### Práctica (`practice.ts`)

- `fetchPracticeSession()` → `IPracticeSessionData`
- `fetchPracticeHistory()` → `IPracticeHistoryItem[]`
- `subscribePracticeFeedback(listener)` → permite “escuchar” feedback
  incremental (mock) usando un `EventEmitter`.
- `emitMockFeedback(hint)` → emite un nuevo hint artificial (útil para
  pruebas en la UI).

Esta capa imita el flujo esperado cuando conectemos el backend con
Azure Speech + GPT (streaming de feedback).

### Progreso (`progress.ts`)

- `fetchProgressOverview()` → `IProgressOverviewData`
- `fetchWeeklyScores()` → `IWeeklyScore[]`
- `fetchFocusAreas()` → `IFocusArea[]`
- `fetchMilestones()` → `IMilestone[]`

Los datos representan gráficas semanales, focos de mejora y milestones
de motivación.

### Preferencias (`preferences.ts`)

- `fetchPreferences()` → `IUserPreferences`
- `updatePreferencesService(partial)` → actualiza el mock y devuelve el
  nuevo estado.

Sirve como reemplazo temporal de Supabase Auth/DB hasta tener las
credenciales.

### Audio (`audio.ts`)

- `createRecordingHandle()` → objeto con métodos `start()`, `stop()`,
  `reset()` que envuelven `expo-av`. Se utiliza mediante el hook
  `usePracticeAudio`.

## Hooks relacionados

En `src/hooks/usePracticeAudio.ts` encapsulamos el manejo del estado de
grabación (mock) reutilizable dentro de la app. Se expone desde
`src/hooks/index.ts`.

## Reemplazo futuro

1. Sustituir cada `fetch*` por la llamada real a Supabase/Azure/GPT,
   conservando las mismas interfaces TypeScript para evitar cambios en
   el resto del código.
2. Cambiar los emisores mock de `practice.ts` por un canal WebSocket o
   SSE que provenga del backend.
3. Reemplazar `preferences.ts` por un servicio que actualice la tabla
   correspondiente en Supabase.

Mientras tanto, esta capa permite desarrollar y probar todas las
pantallas y flujos del frontend sin bloquearse por la falta de
credenciales.

