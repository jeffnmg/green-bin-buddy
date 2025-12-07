-- Crear enums para origen de escaneo y tipo de logro
CREATE TYPE public.scan_origin AS ENUM ('web', 'whatsapp');
CREATE TYPE public.achievement_type AS ENUM ('puntos', 'escaneos', 'racha');

-- 1. Tabla users (perfiles de gamificación)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT UNIQUE,
  puntos INTEGER NOT NULL DEFAULT 0,
  objetos_escaneados INTEGER NOT NULL DEFAULT 0,
  racha_actual INTEGER NOT NULL DEFAULT 0,
  racha_maxima INTEGER NOT NULL DEFAULT 0,
  ultimo_escaneo TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla scans (historial de escaneos)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  objeto_detectado TEXT NOT NULL,
  objeto_detectado_espanol TEXT,
  tipo_residuo TEXT,
  caneca TEXT,
  reciclable BOOLEAN NOT NULL DEFAULT false,
  confianza DECIMAL(5,2),
  puntos_ganados INTEGER NOT NULL DEFAULT 10,
  origen scan_origin NOT NULL DEFAULT 'web',
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla achievements (logros configurables)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo achievement_type NOT NULL,
  umbral INTEGER NOT NULL,
  icono TEXT NOT NULL DEFAULT '🏆',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla user_achievements (logros desbloqueados)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Políticas RLS para scans
CREATE POLICY "Users can view their own scans"
  ON public.scans FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own scans"
  ON public.scans FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Políticas RLS para achievements (público para lectura)
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements FOR SELECT
  USING (activo = true);

-- Políticas RLS para user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can unlock their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos logros iniciales
INSERT INTO public.achievements (nombre, descripcion, tipo, umbral, icono) VALUES
  ('Primer Paso', 'Realiza tu primer escaneo', 'escaneos', 1, '🌱'),
  ('Explorador Verde', 'Escanea 10 objetos', 'escaneos', 10, '🔍'),
  ('Clasificador Experto', 'Escanea 50 objetos', 'escaneos', 50, '🎯'),
  ('Maestro del Reciclaje', 'Escanea 100 objetos', 'escaneos', 100, '🏆'),
  ('Racha de 3 días', 'Mantén una racha de 3 días', 'racha', 3, '🔥'),
  ('Racha de 7 días', 'Mantén una racha de 7 días', 'racha', 7, '⚡'),
  ('Racha de 30 días', 'Mantén una racha de 30 días', 'racha', 30, '💎'),
  ('100 Puntos', 'Acumula 100 puntos', 'puntos', 100, '⭐'),
  ('500 Puntos', 'Acumula 500 puntos', 'puntos', 500, '🌟'),
  ('1000 Puntos', 'Acumula 1000 puntos', 'puntos', 1000, '✨');