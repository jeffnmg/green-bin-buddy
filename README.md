# Sistema de Clasificación Inteligente de Residuos con Gamificación

## Descripción General

Aplicación web progresiva (PWA) desarrollada con React, TypeScript y Supabase que utiliza inteligencia artificial para clasificar residuos mediante análisis de imágenes. El sistema integra mecánicas de gamificación para incentivar el reciclaje responsable, incluyendo sistema de puntos, niveles, logros y ranking competitivo.

## Arquitectura del Sistema

### Stack Tecnológico

#### Frontend
- *Framework*: React 18.3.1 con TypeScript 5.8.3
- *Build Tool*: Vite 5.4.19
- *Routing*: React Router DOM 6.30.1
- *State Management*: React Context API + Hooks
- *UI Framework*: Shadcn/ui con Radix UI primitives
- *Styling*: Tailwind CSS 3.4.17
- *Animaciones*: CSS custom animations + Tailwind animate
- *Formularios*: React Hook Form 7.61.1 con Zod validation
- *Gráficos*: Recharts 2.15.4
- *Notificaciones*: Sonner 1.7.4

#### Backend
- *Base de Datos*: Supabase PostgreSQL 13.0.5
- *Autenticación*: Supabase Auth con JWT
- *Storage*: Supabase Storage para imágenes
- *Realtime*: PostgreSQL Realtime subscriptions
- *Edge Functions*: Deno runtime con TypeScript

#### APIs Externas
- *Clasificación de Imágenes*: Cloud Run API (Google Cloud Platform)
  - Endpoint: https://reciclaje-api-64666058644.us-central1.run.app
  - Método: POST multipart/form-data
- *Chat AI*: Groq API con Llama 3.1-8B-Instant
  - Integrado vía Supabase Edge Functions

### Estructura de Directorios


/
├── src/
│   ├── components/           # Componentes React reutilizables
│   │   ├── ui/              # Componentes base de Shadcn
│   │   ├── AchievementBadge.tsx
│   │   ├── ChatWidget.tsx
│   │   ├── Header.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── LevelUpCelebration.tsx
│   │   ├── OnboardingTour.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ResultCard.tsx
│   │   ├── ScanHistory.tsx
│   │   └── UserStatsCard.tsx
│   ├── contexts/            # Context providers
│   │   └── AuthContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useGamification.ts
│   │   ├── useOnboarding.ts
│   │   └── use-toast.ts
│   ├── integrations/        # Integraciones externas
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/                 # Utilidades y helpers
│   │   ├── levelSystem.ts
│   │   └── utils.ts
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Index.tsx
│   │   ├── Auth.tsx
│   │   ├── Profile.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Achievements.tsx
│   │   └── NotFound.tsx
│   └── App.tsx
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── chat/
│   │       └── index.ts
│   └── migrations/          # Database migrations
└── public/


## Modelo de Datos

### Esquema de Base de Datos

#### Tabla: users
sql
- id: UUID (PK)
- auth_user_id: UUID (FK -> auth.users)
- username: TEXT UNIQUE
- email: TEXT UNIQUE
- phone_number: TEXT UNIQUE NULLABLE
- puntos: INTEGER DEFAULT 0
- objetos_escaneados: INTEGER DEFAULT 0
- racha_actual: INTEGER DEFAULT 0
- racha_maxima: INTEGER DEFAULT 0
- ultimo_escaneo: TIMESTAMPTZ NULLABLE
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ


#### Tabla: scans
sql
- id: UUID (PK)
- user_id: UUID (FK -> users)
- objeto_detectado: TEXT
- objeto_detectado_espanol: TEXT NULLABLE
- tipo_residuo: TEXT NULLABLE
- caneca: TEXT NULLABLE
- reciclable: BOOLEAN DEFAULT false
- confianza: DECIMAL(5,2) NULLABLE
- puntos_ganados: INTEGER DEFAULT 10
- origen: ENUM('web', 'whatsapp')
- imagen_url: TEXT NULLABLE
- created_at: TIMESTAMPTZ


#### Tabla: achievements
sql
- id: UUID (PK)
- nombre: TEXT
- descripcion: TEXT
- tipo: ENUM('puntos', 'escaneos', 'racha')
- umbral: INTEGER
- icono: TEXT DEFAULT '🏆'
- activo: BOOLEAN DEFAULT true
- created_at: TIMESTAMPTZ


#### Tabla: user_achievements
sql
- id: UUID (PK)
- user_id: UUID (FK -> users)
- achievement_id: UUID (FK -> achievements)
- unlocked_at: TIMESTAMPTZ
- UNIQUE(user_id, achievement_id)


### Row Level Security (RLS)

Todas las tablas implementan políticas RLS para garantizar la seguridad de datos:

- *users*: Los usuarios solo pueden ver y modificar su propio perfil
- *scans*: Los usuarios solo pueden ver e insertar sus propios escaneos
- *achievements*: Lectura pública para logros activos
- *user_achievements*: Los usuarios solo pueden ver y desbloquear sus propios logros

### Vista: leaderboard_users

Vista materializada optimizada para el ranking, exponiendo solo datos públicos necesarios:
sql
SELECT id, username, puntos, objetos_escaneados, racha_actual, racha_maxima
FROM users


## Sistema de Gamificación

### Sistema de Niveles

El sistema implementa 4 tiers progresivos basados en puntos acumulados:

| Tier | Rango de Nivel | Título | Color | Emoji |
|------|----------------|--------|-------|-------|
| Novato | 1-5 | Reciclador Novato | Verde claro (#42c765) | 🌱 |
| Intermedio | 6-10 | Eco-Guerrero | Verde oscuro (#1a8849) | 🌿 |
| Avanzado | 11-20 | Guardián Verde | Dorado (#f5a623) | 🏆 |
| Maestro | 21+ | Maestro del Reciclaje | Platino (#a0aec0) | 👑 |

*Fórmula de nivel*: nivel = floor(puntos / 100) + 1

*Progreso al siguiente nivel*: progreso = (puntos % 100)

### Sistema de Puntos

- *Escaneo básico*: 10 puntos por clasificación exitosa
- *Logros desbloqueados*: Variable según el logro
- *Bonificación onboarding*: 5 puntos al completar tutorial

### Sistema de Rachas

- *Racha*: Días consecutivos con al menos un escaneo
- *Reseteo*: La racha se reinicia a 1 si no hay escaneos en 24 horas
- *Persistencia*: Se mantiene racha_actual y racha_maxima
- *Verificación*: Basada en ultimo_escaneo timestamp

### Logros Predefinidos

#### Por Escaneos
- Primer Paso (1 escaneo) - 🌱
- Explorador Verde (10 escaneos) - 🔍
- Clasificador Experto (50 escaneos) - 🎯
- Maestro del Reciclaje (100 escaneos) - 🏆

#### Por Racha
- Racha de 3 días - 🔥
- Racha de 7 días - ⚡
- Racha de 30 días - 💎

#### Por Puntos
- 100 Puntos - ⭐
- 500 Puntos - 🌟
- 1000 Puntos - ✨

## Flujo de Clasificación de Residuos

### 1. Captura de Imagen
typescript
// ImageUploader.tsx
- Drag & drop interface
- File input con capture="environment" para móviles
- Validación de formato (JPG, PNG)
- Preview inmediato


### 2. Envío a API de Clasificación
typescript
const classifyImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(
    "https://reciclaje-api-64666058644.us-central1.run.app/clasificar/",
    { method: "POST", body: formData }
  );
  
  const result = await response.json();
  // result contiene clasificación completa
}


### 3. Procesamiento de Respuesta

La API retorna un objeto ClassificationResult:

typescript
interface ClassificationResult {
  tipo?: string;                      // Tipo de residuo
  caneca?: string;                    // Contenedor asignado
  categoria?: string;                 // Categoría general
  consejo?: string;                   // Consejo de disposición
  confianza?: number;                 // Confianza de la IA (0-100)
  reciclable?: boolean;              // ¿Es reciclable?
  objeto_detectado?: string;         // Objeto en inglés
  objeto_detectado_espanol?: string; // Objeto traducido
  nivel_confianza?: "alta" | "media" | "baja";
  emoji_confianza?: string;
  sugerencia_foto?: string;          // Sugerencia si confianza baja
  dato_curioso?: string;
  impacto_ambiental?: string;
  ejemplos?: string[];
}


### 4. Registro en Sistema de Gamificación

typescript
// useGamification.ts
const registerScan = async (scanData: ScanData) => {
  // 1. Insertar registro en tabla scans
  // 2. Actualizar estadísticas del usuario
  // 3. Verificar y actualizar racha
  // 4. Verificar logros desbloqueables
  // 5. Retornar puntos ganados y logros nuevos
}


### 5. Feedback Visual

- Animación de puntos (+10 pts)
- Modal de subida de nivel si aplica
- Badges de logros desbloqueados
- Actualización de estadísticas en tiempo real

## Sistema de Autenticación

### Flujo de Registro

1. Usuario completa formulario con email, password, username (y opcionalmente teléfono)
2. Supabase Auth crea cuenta en auth.users
3. Trigger handle_new_user() crea registro automático en public.users
4. Usuario es redirigido a página principal con sesión activa

### Flujo de Login

1. Usuario ingresa credenciales
2. Supabase Auth valida y retorna JWT
3. JWT se almacena en localStorage con auto-refresh
4. Context AuthProvider gestiona estado global de autenticación

### Protección de Rutas

typescript
<ProtectedRoute>
  <Index />
</ProtectedRoute>


Componente ProtectedRoute verifica autenticación y redirige a /auth si no hay sesión válida.

## Chat AI Asistente

### Arquitectura


Cliente → Supabase Edge Function → Groq API → Respuesta


### Edge Function: chat

*Ubicación*: supabase/functions/chat/index.ts

*Funcionalidad*:
1. Valida JWT del usuario
2. Obtiene contexto del usuario desde base de datos:
   - Puntos actuales
   - Objetos escaneados
   - Racha actual
   - Últimos 3 escaneos
3. Construye prompt contextualizado para Groq
4. Retorna respuesta personalizada del modelo Llama 3.1-8B-Instant

*Seguridad*:
- verify_jwt = true en config.toml
- Requiere header Authorization: Bearer <token>
- Service role key para queries internas

### Integración Cliente

typescript
// ChatWidget.tsx
const sendMessageToAI = async (message: string) => {
  const { data } = await supabase.functions.invoke("chat", {
    body: { message }
  });
  return data.response;
}


### Características del Chat

- Widget flotante con estado persistente
- Preguntas frecuentes predefinidas:
  - Dónde reciclar residuos
  - Progreso hacia siguiente nivel
  - Logros faltantes
  - Funcionamiento de rachas
- Respuestas contextualizadas basadas en historial del usuario
- Scroll automático y manejo de estados de carga

## Ranking y Leaderboard

### Implementación

*Vista SQL*: leaderboard_users
sql
SELECT id, username, puntos, objetos_escaneados, racha_actual, racha_maxima
FROM users


*Function*: get_leaderboard()
- Security definer function
- Retorna top usuarios ordenados por métrica seleccionada
- Expone solo datos públicos (sin email, phone)

### Características

1. *Múltiples categorías*:
   - Ranking por puntos
   - Ranking por escaneos totales
   - Ranking por racha máxima

2. *Actualización en tiempo real*:
typescript
useEffect(() => {
  const channel = supabase
    .channel("leaderboard-changes")
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "users"
    }, () => fetchLeaderboard())
    .subscribe();
}, []);


3. *Anonimización de usernames*:
typescript
const anonymizeUsername = (username: string): string => {
  if (username.length <= 4) return `${username.charAt(0)}***`;
  return `${username.substring(0, 2)}****${username.substring(username.length - 2)}`;
}


4. *Posición del usuario*:
- Muestra posición actual del usuario autenticado
- Calcula distancia al top 10
- Mensajes motivacionales personalizados

## Sistema de Historial

### Componente: ScanHistory

*Funcionalidades*:

1. *Filtrado avanzado*:
   - Por tipo de residuo
   - Por contenedor asignado
   - Por reciclabilidad
   - Por nivel de confianza (alta/media/baja)
   - Por origen (web/WhatsApp)
   - Por rango de fechas

2. *Ordenamiento*:
   - Más reciente
   - Mayor confianza
   - Más puntos ganados

3. *Estadísticas*:
   - Total de objetos en vista filtrada
   - Suma de puntos
   - Tipo más común

4. *Exportación*:
   - Descarga CSV con todos los datos históricos
   - Formato: fecha, objeto, tipo, caneca, reciclable, confianza, puntos, origen

### Implementación de Filtros

typescript
const filteredScans = useMemo(() => {
  return scans.filter(scan => {
    const matchesSearch = searchQuery === "" || 
      scan.objeto_detectado_espanol.toLowerCase().includes(searchQuery);
    const matchesType = filterType === "all" || scan.tipo_residuo === filterType;
    const matchesCaneca = filterCaneca === "all" || scan.caneca === filterCaneca;
    // ... más filtros
    return matchesSearch && matchesType && matchesCaneca;
  });
}, [scans, searchQuery, filterType, filterCaneca]);


## Onboarding y Tutorial

### Sistema de Onboarding

*Hook*: useOnboarding()

*Almacenamiento*: localStorage con key única por usuario
typescript
const ONBOARDING_KEY = `ecoscan_onboarding_completed_${userId}`;


*Tour interactivo* (4 pasos):

1. *Sube una foto*: Explicación del uploader
2. *Te decimos qué es*: Muestra de resultado de clasificación
3. *Gana puntos y logros*: Introducción al sistema de gamificación
4. *Mantén tu racha*: Explicación de rachas diarias

*Recompensa*:
- 5 puntos de bonificación
- Desbloqueo automático del logro "Primer Paso"

### Implementación

typescript
const completeOnboarding = async () => {
  localStorage.setItem(ONBOARDING_KEY, "true");
  
  // Otorgar 5 puntos bonus
  await supabase.from("users")
    .update({ puntos: userRecord.puntos + 5 })
    .eq("id", userId);
  
  // Desbloquear logro "Primer Paso"
  const achievement = await getAchievement("Primer Paso");
  await unlockAchievement(userId, achievement.id);
}


## Optimizaciones y Performance

### 1. React Optimizations

typescript
// Memoización de componentes pesados
const MemoizedResultCard = React.memo(ResultCard);

// useMemo para cálculos costosos
const filteredData = useMemo(() => 
  data.filter(heavyComputation), 
  [data, dependencies]
);

// useCallback para funciones en props
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);


### 2. Database Indexing

sql
-- Índices automáticos en:
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);


### 3. Query Optimization

typescript
// Limitar resultados
.limit(50)

// Selección específica de columnas
.select('id, username, puntos')

// Ordenamiento en base de datos
.order('created_at', { ascending: false })

// Single query en lugar de múltiples
.maybeSingle()


### 4. Lazy Loading

typescript
// Componentes cargados dinámicamente
const ChatWidget = lazy(() => import('@/components/ChatWidget'));


### 5. Image Optimization

typescript
// Preview con Object URL (no base64)
const preview = URL.createObjectURL(file);

// Cleanup para evitar memory leaks
useEffect(() => {
  return () => URL.revokeObjectURL(preview);
}, [preview]);


## Variables de Entorno

env
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]

# Edge Functions (server-side)
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
GROQ_API_KEY=[groq-api-key]


## Instalación y Despliegue

### Requisitos Previos

- Node.js 18+ con npm
- Cuenta de Supabase
- Cuenta de Groq (para chat AI)
- API de clasificación desplegada

### Instalación Local

bash
# Clonar repositorio
git clone [repository-url]
cd [project-name]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales

# Ejecutar migraciones de Supabase
npx supabase db push

# Desplegar Edge Functions
npx supabase functions deploy chat

# Iniciar servidor de desarrollo
npm run dev


### Build de Producción

bash
# Generar build optimizado
npm run build

# Preview del build
npm run preview


### Despliegue

*Lovable/Vercel*:
bash
# Deploy automático via Git push
git push origin main


*Netlify*:
bash
npm run build
# Upload dist/ folder


*Docker*:
dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]


## Testing

### Unit Tests (recomendado)

bash
npm install -D vitest @testing-library/react


typescript
// Example test
import { render, screen } from '@testing-library/react';
import { ResultCard } from '@/components/ResultCard';

describe('ResultCard', () => {
  it('renders classification result', () => {
    const result = {
      tipo: 'Plástico',
      caneca: '♻️ Caneca Blanca',
      reciclable: true
    };
    render(<ResultCard result={result} onReset={() => {}} />);
    expect(screen.getByText('Plástico')).toBeInTheDocument();
  });
});


### E2E Tests (recomendado)

bash
npm install -D @playwright/test


typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('user can classify waste', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.click('text=Iniciar Sesión');
  // ... complete flow
});


## Monitoreo y Logs

### Supabase Dashboard

- Métricas de autenticación
- Logs de Edge Functions
- Query performance
- Storage usage

### Error Tracking

typescript
// useGamification.ts
try {
  await registerScan(data);
} catch (error) {
  console.error('Error registering scan:', error);
  toast.error('Error al guardar el escaneo');
  // Enviar a servicio de error tracking (ej: Sentry)
}


## Seguridad

### Implementaciones de Seguridad

1. *Row Level Security (RLS)*: Todas las tablas protegidas
2. *JWT Verification*: Edge Functions con verify_jwt = true
3. *CORS Headers*: Configurados en Edge Functions
4. *Input Validation*: Zod schemas en formularios
5. *SQL Injection Prevention*: Uso de prepared statements vía Supabase client
6. *XSS Protection*: React's built-in escaping + DOMPurify donde sea necesario
7. *CSRF Protection*: JWT tokens en headers

### Mejores Prácticas

- No exponer service role key en frontend
- Validar datos en cliente Y servidor
- Sanitizar inputs de usuario
- Limitar rate de requests
- Implementar captcha en formularios críticos (opcional)

## Roadmap y Mejoras Futuras

### Funcionalidades Planificadas

1. *Integración WhatsApp*
   - Bot para clasificación vía mensaje
   - Sistema de origen whatsapp en scans

2. *Geolocalización*
   - Mapa de puntos de reciclaje cercanos
   - Integración con Google Maps API

3. *Gamificación Avanzada*
   - Desafíos semanales
   - Competencias por equipos
   - Marketplace de recompensas

4. *Análisis Avanzado*
   - Dashboard de estadísticas
   - Gráficos de impacto ambiental
   - Comparativas temporales

5. *Social Features*
   - Compartir logros en redes sociales
   - Sistema de referidos
   - Grupos y comunidades

### Mejoras Técnicas

- Implementar Service Workers para PWA completa
- Caché de imágenes clasificadas
- Modo offline con queue de sincronización
- Migración a React Server Components
- Implementar GraphQL en lugar de REST
- Testing automatizado completo

## Contribución

### Guías de Contribución

1. Fork del repositorio
2. Crear branch feature: git checkout -b feature/nueva-funcionalidad
3. Commit cambios: git commit -m 'Añadir nueva funcionalidad'
4. Push al branch: git push origin feature/nueva-funcionalidad
5. Crear Pull Request

### Estándares de Código

- TypeScript strict mode
- ESLint configuration seguida
- Prettier para formateo
- Convenciones de nombrado:
  - Components: PascalCase
  - Hooks: camelCase con prefijo use
  - Utilities: camelCase
  - Constants: UPPER_SNAKE_CASE

## Licencia

Este proyecto es de código cerrado. Todos los derechos reservados.

## Contacto y Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

*Versión*: 1.0.0  
*Última actualización*: Diciembre 2024  
*Desarrollado con*: React + TypeScript + Supabase
