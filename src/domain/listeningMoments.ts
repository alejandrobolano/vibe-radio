export type ListeningMomentSlug = 'trabajar' | 'relajarse' | 'entrenar' | 'conducir' | 'dormir' | 'fiesta'

export type ListeningMoment = {
  slug: ListeningMomentSlug
  name: string
  eyebrow: string
  shortDescription: string
  description: string
  query: string
  searchLabel: string
  timerMinutes: number | null
}

export const listeningMoments: readonly ListeningMoment[] = [
  { slug: 'trabajar', name: 'Radio para trabajar', eyebrow: 'CONCENTRACIÓN', shortDescription: 'Ritmos suaves para mantener el foco sin perder energía.', description: 'Descubre emisoras de lofi, jazz suave y música instrumental para acompañar tus sesiones de trabajo o estudio.', query: 'lofi', searchLabel: 'música para trabajar', timerMinutes: 50 },
  { slug: 'relajarse', name: 'Radio para relajarse', eyebrow: 'CALMA', shortDescription: 'Un dial tranquilo para bajar el ritmo y respirar.', description: 'Escucha emisoras de chillout, lounge y sonidos tranquilos seleccionadas para descansar y desconectar del ruido diario.', query: 'chillout', searchLabel: 'música para relajarse', timerMinutes: 30 },
  { slug: 'entrenar', name: 'Radio para entrenar', eyebrow: 'ENERGÍA', shortDescription: 'Música intensa para sostener el ritmo de cada serie.', description: 'Sintoniza emisoras de dance, electrónica y grandes éxitos para mantener la motivación durante tu entrenamiento.', query: 'dance', searchLabel: 'música para entrenar', timerMinutes: 45 },
  { slug: 'conducir', name: 'Radio para conducir', eyebrow: 'EN RUTA', shortDescription: 'Canciones conocidas para convertir el trayecto en parte del plan.', description: 'Encuentra emisoras de pop y grandes éxitos para viajes, desplazamientos diarios y rutas largas por carretera.', query: 'hits', searchLabel: 'música para conducir', timerMinutes: null },
  { slug: 'dormir', name: 'Radio para dormir', eyebrow: 'DESCANSO', shortDescription: 'Paisajes sonoros serenos para cerrar el día.', description: 'Explora emisoras de ambient y música relajante para crear una atmósfera tranquila antes de dormir.', query: 'ambient', searchLabel: 'música para dormir', timerMinutes: 30 },
  { slug: 'fiesta', name: 'Radio para fiestas', eyebrow: 'FIESTA', shortDescription: 'Un impulso de ritmo para reuniones y noches especiales.', description: 'Descubre emisoras de música latina, dance y fiesta para compartir buenos momentos y animar cualquier celebración.', query: 'party', searchLabel: 'música para fiestas', timerMinutes: null },
] as const

export function getListeningMoment(slug: string): ListeningMoment | null {
  return listeningMoments.find(moment => moment.slug === slug) ?? null
}
