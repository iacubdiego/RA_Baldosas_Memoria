'use client'

/**
 * EscuelaAnimada
 * ───────────────────────────────────────────────────────────────────────
 * Animación de entrada para la home de /recorridos/escuela.
 * Coreografía (una sola vez, sin loop):
 *   1. La escuela baja suavemente desde arriba y se asienta.
 *   2. Los dos pañuelos aparecen a izquierda y derecha (fade + escala).
 *   3. Un grupo de estudiantes aparece frente a la puerta y se desplaza
 *      hacia abajo, dividiéndose: la mitad va hacia el pañuelo izquierdo,
 *      la mitad hacia el derecho.
 *
 * Tono: sobrio y contemplativo. Movimientos lentos, paleta del proyecto.
 * Todo en SVG a medida + CSS. Sin dependencias.
 *
 * El pañuelo usa /images/logo_flores_fondo_azul.png (ya con fondo transparente).
 */

const PANUELO = '/images/logo_flores_fondo_azul.png'

// Posiciones finales de los estudiantes tras dividirse en dos grupos.
// (relativas al viewBox 0 0 800 600). Dos racimos compactos a cada lado.
// scale varía levemente para dar sensación de profundidad (filas).
const ESTUDIANTES = [
  // ── Grupo izquierdo → hacia el pañuelo (centro X≈90) ──
  { id: 'e1',  startX: 388, endX: 110, endY: 475, delay: 2.20, scale: 0.92, color: 'var(--color-dust, #4a6b7c)' },
  { id: 'e2',  startX: 398, endX: 140, endY: 477, delay: 2.30, scale: 1.00, color: 'var(--color-concrete, #2d4a5e)' },
  { id: 'e3',  startX: 392, endX:  80, endY: 479, delay: 2.40, scale: 1.05, color: 'var(--color-stone, #1a2a3a)' },
  { id: 'e4',  startX: 405, endX: 165, endY: 480, delay: 2.50, scale: 1.08, color: 'var(--color-dust, #4a6b7c)' },
  { id: 'e5',  startX: 384, endX: 120, endY: 481, delay: 2.60, scale: 1.12, color: 'var(--color-stone, #1a2a3a)' },
  { id: 'e6',  startX: 400, endX:  55, endY: 480, delay: 2.70, scale: 1.10, color: 'var(--color-concrete, #2d4a5e)' },
  // ── Grupo derecho → hacia el pañuelo (centro X≈710) ──
  { id: 'e7',  startX: 412, endX: 690, endY: 475, delay: 2.25, scale: 0.92, color: 'var(--color-concrete, #2d4a5e)' },
  { id: 'e8',  startX: 402, endX: 660, endY: 477, delay: 2.35, scale: 1.00, color: 'var(--color-dust, #4a6b7c)' },
  { id: 'e9',  startX: 408, endX: 720, endY: 479, delay: 2.45, scale: 1.05, color: 'var(--color-stone, #1a2a3a)' },
  { id: 'e10', startX: 395, endX: 635, endY: 480, delay: 2.55, scale: 1.08, color: 'var(--color-concrete, #2d4a5e)' },
  { id: 'e11', startX: 416, endX: 680, endY: 481, delay: 2.65, scale: 1.12, color: 'var(--color-stone, #1a2a3a)' },
  { id: 'e12', startX: 400, endX: 745, endY: 480, delay: 2.75, scale: 1.10, color: 'var(--color-dust, #4a6b7c)' },
]

export default function EscuelaAnimada() {
  return (
    <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Suelo: fade-in inicial ── */
        @keyframes suelo-aparece {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .ea-suelo {
          animation: suelo-aparece 1.2s ease-out 0.1s both;
        }

        /* ── Escuela: baja desde arriba y se asienta ── */
        @keyframes escuela-baja {
          0%   { opacity: 0; transform: translateY(-90px); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0); }
        }
        .ea-escuela {
          animation: escuela-baja 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        /* ── Pañuelos: fade + escala suave ── */
        @keyframes panuelo-aparece {
          0%   { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ea-panuelo {
          animation: panuelo-aparece 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ea-panuelo-izq { animation-delay: 1.5s; }
        .ea-panuelo-der { animation-delay: 1.7s; }

        /* ── Pañuelos: leve ondeo perpetuo (sutil, contemplativo) ── */
        @keyframes panuelo-ondea {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-5px) rotate(1deg); }
        }
        .ea-panuelo-inner {
          animation: panuelo-ondea 5.5s ease-in-out 2.8s infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        /* ── Estudiantes: cada uno tiene su propio keyframe mover-{id} ── */

        @media (prefers-reduced-motion: reduce) {
          .ea-escuela, .ea-panuelo, .ea-panuelo-inner, .ea-est, .ea-suelo {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      ` }} />

      <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          {/* Sombra sutil para dar profundidad sin recargar */}
          <filter id="ea-sombra" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1a2a3a" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ── CALLE Y VEREDA (debajo de la escuela y los pañuelos) ── */}
        <g className="ea-suelo">
          {/* Vereda gris claro */}
          <rect x="0" y="480" width="800" height="42" fill="#d4d8dc" />
          {/* Borde inferior de la vereda (cordón) */}
          <line x1="0" y1="522" x2="800" y2="522" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1.5" opacity="0.4" />
          {/* Líneas verticales sutiles que sugieren baldosas de vereda */}
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="0.6" opacity="0.18">
            <line x1="100" y1="480" x2="100" y2="522" />
            <line x1="200" y1="480" x2="200" y2="522" />
            <line x1="300" y1="480" x2="300" y2="522" />
            <line x1="500" y1="480" x2="500" y2="522" />
            <line x1="600" y1="480" x2="600" y2="522" />
            <line x1="700" y1="480" x2="700" y2="522" />
          </g>
          {/* Calle de asfalto */}
          <rect x="0" y="522" width="800" height="78" fill="#5a6770" />
          {/* Línea blanca discontinua del centro de la calle */}
          <g stroke="#f0f4f8" strokeWidth="3" strokeDasharray="28 22" opacity="0.85">
            <line x1="0" y1="565" x2="800" y2="565" />
          </g>
        </g>

        {/* ── PAÑUELOS (a los lados, detrás de los estudiantes) ── */}
        <g className="ea-panuelo ea-panuelo-izq">
          <g className="ea-panuelo-inner">
            <image href={PANUELO} x="15" y="320" width="150" height="150" preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>
        <g className="ea-panuelo ea-panuelo-der">
          <g className="ea-panuelo-inner">
            <image href={PANUELO} x="635" y="320" width="150" height="150" preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>

        {/* ── ESCUELA ── */}
        <g className="ea-escuela" filter="url(#ea-sombra)">
          {/* Alas laterales (un nivel, más bajas que el cuerpo central) */}
          {/* Ala izquierda */}
          <rect x="180" y="320" width="100" height="160" rx="5" fill="var(--color-parchment, #f0f4f8)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" />
          <path d="M 165 320 L 230 280 L 295 320 Z" fill="var(--color-concrete, #2d4a5e)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" strokeLinejoin="round" />
          {/* Ventanas del ala izquierda */}
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="200" y="345" width="28" height="36" rx="2" />
            <rect x="234" y="345" width="28" height="36" rx="2" />
          </g>
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" opacity="0.6">
            <line x1="214" y1="345" x2="214" y2="381" /><line x1="200" y1="363" x2="228" y2="363" />
            <line x1="248" y1="345" x2="248" y2="381" /><line x1="234" y1="363" x2="262" y2="363" />
          </g>
          {/* Ventanas inferiores del ala izquierda */}
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="200" y="410" width="28" height="36" rx="2" />
            <rect x="234" y="410" width="28" height="36" rx="2" />
          </g>
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" opacity="0.6">
            <line x1="214" y1="410" x2="214" y2="446" /><line x1="200" y1="428" x2="228" y2="428" />
            <line x1="248" y1="410" x2="248" y2="446" /><line x1="234" y1="428" x2="262" y2="428" />
          </g>

          {/* Ala derecha (espejada) */}
          <rect x="520" y="320" width="100" height="160" rx="5" fill="var(--color-parchment, #f0f4f8)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" />
          <path d="M 505 320 L 570 280 L 635 320 Z" fill="var(--color-concrete, #2d4a5e)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" strokeLinejoin="round" />
          {/* Ventanas del ala derecha */}
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="540" y="345" width="28" height="36" rx="2" />
            <rect x="574" y="345" width="28" height="36" rx="2" />
          </g>
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" opacity="0.6">
            <line x1="554" y1="345" x2="554" y2="381" /><line x1="540" y1="363" x2="568" y2="363" />
            <line x1="588" y1="345" x2="588" y2="381" /><line x1="574" y1="363" x2="602" y2="363" />
          </g>
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="540" y="410" width="28" height="36" rx="2" />
            <rect x="574" y="410" width="28" height="36" rx="2" />
          </g>
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" opacity="0.6">
            <line x1="554" y1="410" x2="554" y2="446" /><line x1="540" y1="428" x2="568" y2="428" />
            <line x1="588" y1="410" x2="588" y2="446" /><line x1="574" y1="428" x2="602" y2="428" />
          </g>

          {/* Cuerpo del edificio (central, por encima de las alas) */}
          <rect x="270" y="250" width="260" height="230" rx="6" fill="var(--color-parchment, #f0f4f8)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" />

          {/* Techo */}
          <path d="M 250 250 L 400 175 L 550 250 Z" fill="var(--color-concrete, #2d4a5e)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="3" strokeLinejoin="round" />

          {/* Reloj institucional en el frontón */}
          <circle cx="400" cy="225" r="12" fill="var(--color-parchment, #f0f4f8)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" />
          <line x1="400" y1="225" x2="400" y2="219" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="400" y1="225" x2="404" y2="227" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Puerta central */}
          <rect x="368" y="380" width="64" height="100" rx="3" fill="var(--color-concrete, #2d4a5e)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2.5" />
          <line x1="400" y1="380" x2="400" y2="480" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1.5" />
          <circle cx="392" cy="432" r="2.5" fill="var(--color-primary, #2563eb)" />
          <circle cx="408" cy="432" r="2.5" fill="var(--color-primary, #2563eb)" />

          {/* Escalón */}
          <rect x="358" y="480" width="84" height="10" rx="2" fill="var(--color-dust, #4a6b7c)" />

          {/* Ventanas — fila superior */}
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="300" y="280" width="36" height="44" rx="2" />
            <rect x="464" y="280" width="36" height="44" rx="2" />
          </g>
          {/* Ventanas — fila inferior */}
          <g fill="var(--color-accent, #0ea5e9)" stroke="var(--color-stone, #1a2a3a)" strokeWidth="2" opacity="0.92">
            <rect x="300" y="400" width="36" height="44" rx="2" />
            <rect x="464" y="400" width="36" height="44" rx="2" />
          </g>
          {/* Cruces de ventanas */}
          <g stroke="var(--color-stone, #1a2a3a)" strokeWidth="1.2" opacity="0.6">
            <line x1="318" y1="280" x2="318" y2="324" /><line x1="300" y1="302" x2="336" y2="302" />
            <line x1="482" y1="280" x2="482" y2="324" /><line x1="464" y1="302" x2="500" y2="302" />
            <line x1="318" y1="400" x2="318" y2="444" /><line x1="300" y1="422" x2="336" y2="422" />
            <line x1="482" y1="400" x2="482" y2="444" /><line x1="464" y1="422" x2="500" y2="422" />
          </g>

          {/* Mástil único centrado con bandera argentina (3 franjas horizontales) */}
          <line x1="400" y1="175" x2="400" y2="135" stroke="var(--color-dust, #4a6b7c)" strokeWidth="2.5" strokeLinecap="round" />
          {/* La bandera va a la izquierda del mástil (como si ondeara) */}
          <g>
            {/* Franja celeste superior */}
            <rect x="358" y="140" width="42" height="9" fill="#75AADB" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" />
            {/* Franja blanca central */}
            <rect x="358" y="149" width="42" height="9" fill="#ffffff" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" />
            {/* Franja celeste inferior */}
            <rect x="358" y="158" width="42" height="9" fill="#75AADB" stroke="var(--color-stone, #1a2a3a)" strokeWidth="1" />
            {/* Sol de Mayo simplificado: círculo amarillo pequeño en la franja blanca */}
            <circle cx="379" cy="153.5" r="3" fill="#F6B40E" stroke="var(--color-stone, #1a2a3a)" strokeWidth="0.7" />
          </g>
        </g>

        {/* ── ESTUDIANTES (siluetas detalladas) ── */}
        {ESTUDIANTES.map(e => (
          <g
            key={e.id}
            className="ea-est"
            style={{
              animation: `mover-${e.id} 1.9s cubic-bezier(0.4, 0, 0.2, 1) ${e.delay}s both`,
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes mover-${e.id} {
                0%   { opacity: 0; transform: translate(${e.startX - 400}px, 0px); }
                18%  { opacity: 1; transform: translate(${e.startX - 400}px, 0px); }
                100% { opacity: 1; transform: translate(${e.endX - 400}px, ${e.endY - 440}px); }
              }
            ` }} />
            {/* Figura base en (400, 440), escalada según profundidad */}
            <g transform={`translate(400 440) scale(${e.scale})`}>
              <g fill={e.color}>
                {/* Piernas */}
                <path d="M -5 16 L -6 30 Q -6 33 -3 33 Q -1 33 -1 30 L 0 18 Z" />
                <path d="M 5 16 L 6 30 Q 6 33 3 33 Q 1 33 1 30 L 0 18 Z" />
                {/* Torso con hombros (trapecio redondeado) */}
                <path d="M -8 -2
                         Q -9 -8 -5 -10
                         L 5 -10
                         Q 9 -8 8 -2
                         L 7 16
                         Q 7 18 4 18
                         L -4 18
                         Q -7 18 -7 16
                         Z" />
                {/* Brazos insinuados a los lados del torso */}
                <path d="M -8 -7 Q -12 -4 -11 6 Q -11 9 -9 9 Q -7 9 -7 6 L -6 -3 Z" />
                <path d="M 8 -7 Q 12 -4 11 6 Q 11 9 9 9 Q 7 9 7 6 L 6 -3 Z" />
                {/* Cuello */}
                <rect x="-2.5" y="-15" width="5" height="7" rx="2" />
                {/* Cabeza */}
                <circle cx="0" cy="-20" r="7.5" />
              </g>
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
