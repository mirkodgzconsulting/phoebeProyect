# Supabase Setup

1. Crea una cuenta en [supabase.com](https://supabase.com) y genera un proyecto nuevo.
2. Obtén las claves desde **Settings → API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo para el backend).
3. En el proyecto Expo crea un archivo `.env` con:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

   > **Importante:** la `service_role_key` nunca debe guardarse en la app móvil. Úsala solo en el backend (por ejemplo, en `.env.local` del servidor Express).

4. Ejecuta `npx expo start` (o `npm run start`) para que Expo cargue las variables públicas.
5. Si aún no existen, crea las tablas con el script proporcionado en la conversación (`profiles`, `practice_sessions`, etc.) y habilita Row Level Security.

### Script inicial sugerido

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  level text default 'beginner',
  has_premium boolean default false,
  trial_started_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  target_sentence text,
  feedback jsonb,
  score numeric,
  audio_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.practice_sessions enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "Users manage their profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users view their sessions"
  on public.practice_sessions for select using (auth.uid() = user_id);

create policy "Users insert their sessions"
  on public.practice_sessions for insert with check (auth.uid() = user_id);
```

