# Frontend Overview & Charts

## Arquitectura de pantallas principales

- **Onboarding (4 pasos)** – recoge objetivos, intereses y preferencias
  del estudiante antes de mostrar el login.
- **Auth (Login / Register)** – flujos simplificados con componentes
  reutilizables (`BrandBackground`, `BrandActionButton`).
- **App principal** – navegada desde el drawer (`Dashboard`,
  `PracticeSession`, `ProgressOverview`, `SettingsScreen`, `Profile`).

El `RootStack` decide si mostrar Onboarding, Auth o Main según el
estado global (`useData`).

## Componente de tema y UI centralizada

- `BrandBackground` – degradado general + glows.
- `BrandActionButton`, `BrandSurface`, `BrandSectionHeader`,
  `BrandChip`, `BrandProgressBar`.
- `BrandLineChart` – gráfico de línea/área basado en `react-native-svg`
  que usamos en `ProgressOverview`.

Todos los componentes están listados/exportados en
`src/components/index.tsx`.

## Datos mock y servicios

- Definidos en `src/constants/mocks.ts` con el nuevo dominio
  (pronunciación).
- Interfaces actualizadas en `src/constants/types/index.ts`.
- Capa de servicios mock (`src/services/*`) + documentación en
  `docs/mock-services.md`.
- `useData` carga los mocks y los expone con setters tipados.

## Gráficos

- `BrandLineChart` genera una curva con área degradada para mostrar la
  serie semanal (`ProgressOverview`).
- `BrandProgressBar` se usa en dashboard, práctica, progreso y perfil
  para representar porcentajes.
- El diseño es escalable para integrar librerías externas (ej. charts)
  cuando se necesite algo más avanzado.

## Flujo de práctica y audio

- Hook `usePracticeAudio` (mock) encapsula grabación con `expo-av`.
- `PracticeSession` combina grabación, feedback incremental (event
  emitter) y progreso dinámico.
- Preparado para conectar el backend real (Azure Speech + GPT) vía
  streaming.

## Próximas Integraciones

- Reemplazar servicios mock con implementaciones reales (Supabase,
  Azure, GPT).
- Añadir avatar 3D + lip sync, gráficos avanzados, y documentación de
  contratos API finales.

