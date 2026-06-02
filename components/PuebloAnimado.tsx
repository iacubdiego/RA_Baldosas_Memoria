'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * PuebloAnimado
 * ────────────────────────────────────────────────────────────────────
 * Hero animado para la home: 5 edificios (casa, edificio de departamentos,
 * escuela con bandera argentina, otro edificio, una casa más amplia) y 14
 * personas que salen por la vereda, se acercan a los pañuelos en los
 * extremos, hacen una pausa frente a ellos y siguen caminando hasta salir.
 *
 * Coreografía (una sola vez, sin loop):
 *   0.1s  · suelo aparece (fade)
 *   0.2s  · casa baja
 *   0.4s  · edificio 1 baja
 *   0.6s  · escuela baja
 *   0.8s  · edificio 2 baja
 *   1.0s  · edificio 3 baja
 *   1.2s  · pañuelos aparecen (escala)
 *   1.6s  · empiezan a salir las personas (escalonadas hasta 2.8s)
 *   ~4s   · personas llegan a los pañuelos y hacen pausa
 *   ~6s   · personas siguen caminando y salen del cuadro
 *
 * El componente usa IntersectionObserver: la animación dispara solo cuando
 * el bloque entra al viewport (>30% visible), así no se pierde si el
 * usuario hace scroll después de unos segundos en la home.
 */
export default function PuebloAnimado() {
  const ref = useRef<HTMLDivElement>(null)
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    if (!ref.current || activo) return
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivo(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [activo])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        background: 'transparent',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .pa-svg { display: block; width: 100%; height: auto; }
        @keyframes pa-ed-baja {
          0%   { opacity: 0; transform: translateY(-80px); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pa-suelo-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pa-panuelo-aparece {
          0%   { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pa-panuelo-ondea {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes pa-aparece-p { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 1; } }

        .pa-activo .pa-ed { animation: pa-ed-baja 1.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .pa-activo .pa-ed1 { animation-delay: 0.2s; }
        .pa-activo .pa-ed2 { animation-delay: 0.4s; }
        .pa-activo .pa-ed3 { animation-delay: 0.6s; }
        .pa-activo .pa-ed4 { animation-delay: 0.8s; }
        .pa-activo .pa-ed5 { animation-delay: 1.0s; }

        .pa-activo .pa-suelo { animation: pa-suelo-fade 1s ease-out 0.1s both; }
        .pa-suelo { opacity: 0; }

        .pa-activo .pa-panuelo {
          animation: pa-panuelo-aparece 1s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-box: fill-box;
          transform-origin: center;
        }
        .pa-panuelo { opacity: 0; }
        .pa-activo .pa-pa-izq { animation-delay: 1.2s; }
        .pa-activo .pa-pa-der { animation-delay: 1.4s; }

        .pa-activo .pa-panuelo-inner {
          animation: pa-panuelo-ondea 5.5s ease-in-out 2.5s infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .pa-persona { opacity: 0; }

        @keyframes pa-p1{0%{transform:translate(200px,365px)}18%{transform:translate(120px,393px)}22%,30%{transform:translate(50px,393px)}100%{transform:translate(-30px,393px)}}
        @keyframes pa-p2{0%{transform:translate(195px,365px)}20%{transform:translate(140px,398px)}24%,32%{transform:translate(90px,398px)}100%{transform:translate(-40px,398px)}}
        @keyframes pa-p3{0%{transform:translate(195px,365px)}22%{transform:translate(150px,403px)}26%,34%{transform:translate(70px,403px)}100%{transform:translate(-30px,403px)}}
        @keyframes pa-p4{0%{transform:translate(358px,360px)}22%{transform:translate(230px,393px)}26%,34%{transform:translate(105px,393px)}100%{transform:translate(-30px,393px)}}
        @keyframes pa-p5{0%{transform:translate(358px,360px)}24%{transform:translate(250px,398px)}28%,36%{transform:translate(50px,398px)}100%{transform:translate(-40px,398px)}}
        @keyframes pa-p6{0%{transform:translate(358px,360px)}26%{transform:translate(270px,403px)}30%,38%{transform:translate(90px,403px)}100%{transform:translate(-30px,403px)}}
        @keyframes pa-p7{0%{transform:translate(525px,360px)}25%{transform:translate(380px,393px)}29%,37%{transform:translate(105px,393px)}100%{transform:translate(-30px,393px)}}
        @keyframes pa-p8{0%{transform:translate(525px,360px)}27%{transform:translate(420px,398px)}31%,39%{transform:translate(50px,398px)}100%{transform:translate(-40px,398px)}}
        @keyframes pa-p9{0%{transform:translate(525px,360px)}25%{transform:translate(620px,393px)}29%,37%{transform:translate(905px,393px)}100%{transform:translate(1030px,393px)}}
        @keyframes pa-p10{0%{transform:translate(525px,360px)}27%{transform:translate(660px,398px)}31%,39%{transform:translate(945px,398px)}100%{transform:translate(1030px,398px)}}
        @keyframes pa-p11{0%{transform:translate(698px,365px)}23%{transform:translate(800px,393px)}27%,35%{transform:translate(890px,393px)}100%{transform:translate(1030px,393px)}}
        @keyframes pa-p12{0%{transform:translate(698px,365px)}21%{transform:translate(820px,398px)}25%,33%{transform:translate(925px,398px)}100%{transform:translate(1030px,398px)}}
        @keyframes pa-p13{0%{transform:translate(856px,360px)}22%{transform:translate(890px,393px)}26%,34%{transform:translate(905px,393px)}100%{transform:translate(1030px,393px)}}
        @keyframes pa-p14{0%{transform:translate(856px,360px)}24%{transform:translate(910px,398px)}28%,36%{transform:translate(960px,398px)}100%{transform:translate(1030px,398px)}}

        .pa-activo .pa-p1{animation:pa-aparece-p 1.5s ease-out 1.6s both, pa-p1 16s cubic-bezier(0.4,0,0.2,1) 1.6s both}
        .pa-activo .pa-p2{animation:pa-aparece-p 1.5s ease-out 1.9s both, pa-p2 16s cubic-bezier(0.4,0,0.2,1) 1.9s both}
        .pa-activo .pa-p3{animation:pa-aparece-p 1.5s ease-out 2.2s both, pa-p3 16s cubic-bezier(0.4,0,0.2,1) 2.2s both}
        .pa-activo .pa-p4{animation:pa-aparece-p 1.5s ease-out 2.0s both, pa-p4 16s cubic-bezier(0.4,0,0.2,1) 2.0s both}
        .pa-activo .pa-p5{animation:pa-aparece-p 1.5s ease-out 2.3s both, pa-p5 16s cubic-bezier(0.4,0,0.2,1) 2.3s both}
        .pa-activo .pa-p6{animation:pa-aparece-p 1.5s ease-out 2.6s both, pa-p6 16s cubic-bezier(0.4,0,0.2,1) 2.6s both}
        .pa-activo .pa-p7{animation:pa-aparece-p 1.5s ease-out 1.8s both, pa-p7 16s cubic-bezier(0.4,0,0.2,1) 1.8s both}
        .pa-activo .pa-p8{animation:pa-aparece-p 1.5s ease-out 2.5s both, pa-p8 16s cubic-bezier(0.4,0,0.2,1) 2.5s both}
        .pa-activo .pa-p9{animation:pa-aparece-p 1.5s ease-out 2.1s both, pa-p9 16s cubic-bezier(0.4,0,0.2,1) 2.1s both}
        .pa-activo .pa-p10{animation:pa-aparece-p 1.5s ease-out 2.4s both, pa-p10 16s cubic-bezier(0.4,0,0.2,1) 2.4s both}
        .pa-activo .pa-p11{animation:pa-aparece-p 1.5s ease-out 2.7s both, pa-p11 16s cubic-bezier(0.4,0,0.2,1) 2.7s both}
        .pa-activo .pa-p12{animation:pa-aparece-p 1.5s ease-out 2.2s both, pa-p12 16s cubic-bezier(0.4,0,0.2,1) 2.2s both}
        .pa-activo .pa-p13{animation:pa-aparece-p 1.5s ease-out 2.8s both, pa-p13 16s cubic-bezier(0.4,0,0.2,1) 2.8s both}
        .pa-activo .pa-p14{animation:pa-aparece-p 1.5s ease-out 2.5s both, pa-p14 16s cubic-bezier(0.4,0,0.2,1) 2.5s both}

        @media (prefers-reduced-motion: reduce) {
          .pa-activo .pa-ed, .pa-activo .pa-suelo, .pa-activo .pa-panuelo,
          .pa-activo .pa-panuelo-inner,
          .pa-activo .pa-p1, .pa-activo .pa-p2, .pa-activo .pa-p3, .pa-activo .pa-p4,
          .pa-activo .pa-p5, .pa-activo .pa-p6, .pa-activo .pa-p7, .pa-activo .pa-p8,
          .pa-activo .pa-p9, .pa-activo .pa-p10, .pa-activo .pa-p11, .pa-activo .pa-p12,
          .pa-activo .pa-p13, .pa-activo .pa-p14 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      ` }} />

      <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className={`pa-svg ${activo ? 'pa-activo' : ''}`}>

        {/* ── SUELO: vereda + asfalto ── */}
        <g className="pa-suelo">
          <rect x="0" y="380" width="1000" height="35" fill="#d4d8dc" />
          <line x1="0" y1="415" x2="1000" y2="415" stroke="#1a2a3a" strokeWidth="1.5" opacity="0.4" />
          <g stroke="#1a2a3a" strokeWidth="0.6" opacity="0.18">
            <line x1="80" y1="380" x2="80" y2="415" />
            <line x1="160" y1="380" x2="160" y2="415" />
            <line x1="240" y1="380" x2="240" y2="415" />
            <line x1="320" y1="380" x2="320" y2="415" />
            <line x1="400" y1="380" x2="400" y2="415" />
            <line x1="480" y1="380" x2="480" y2="415" />
            <line x1="560" y1="380" x2="560" y2="415" />
            <line x1="640" y1="380" x2="640" y2="415" />
            <line x1="720" y1="380" x2="720" y2="415" />
            <line x1="800" y1="380" x2="800" y2="415" />
            <line x1="880" y1="380" x2="880" y2="415" />
            <line x1="960" y1="380" x2="960" y2="415" />
          </g>
          <rect x="0" y="415" width="1000" height="85" fill="#5a6770" />
          <g stroke="#f0f4f8" strokeWidth="3" strokeDasharray="32 24" opacity="0.85">
            <line x1="0" y1="460" x2="1000" y2="460" />
          </g>
        </g>

        {/* ── PAÑUELOS a los costados ── */}
        <g className="pa-panuelo pa-pa-izq">
          <g className="pa-panuelo-inner" transform="translate(45 280)">
            <circle cx="0" cy="0" r="48" fill="#2563eb" opacity="0.18" />
            <circle cx="0" cy="0" r="36" fill="#2563eb" opacity="0.32" />
            <path d="M -30 -8 L -28 -22 L 30 -22 L 32 -8 L 28 12 L -28 12 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <path d="M -30 12 L -35 32 L -20 22 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <path d="M 30 12 L 35 32 L 20 22 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <g fill="#ec4899"><circle cx="14" cy="-8" r="4" /><circle cx="18" cy="-13" r="3" /></g>
            <g fill="#fbbf24"><circle cx="8" cy="-15" r="3.5" /><circle cx="22" cy="-6" r="3" /></g>
            <g fill="#22c55e"><path d="M 5 -18 L 8 -22 L 11 -18 Z" /></g>
          </g>
        </g>

        <g className="pa-panuelo pa-pa-der">
          <g className="pa-panuelo-inner" transform="translate(955 280)">
            <circle cx="0" cy="0" r="48" fill="#2563eb" opacity="0.18" />
            <circle cx="0" cy="0" r="36" fill="#2563eb" opacity="0.32" />
            <path d="M -30 -8 L -28 -22 L 30 -22 L 32 -8 L 28 12 L -28 12 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <path d="M -30 12 L -35 32 L -20 22 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <path d="M 30 12 L 35 32 L 20 22 Z" fill="#ffffff" stroke="#1a2a3a" strokeWidth="2" />
            <g fill="#ec4899"><circle cx="14" cy="-8" r="4" /><circle cx="18" cy="-13" r="3" /></g>
            <g fill="#fbbf24"><circle cx="8" cy="-15" r="3.5" /><circle cx="22" cy="-6" r="3" /></g>
            <g fill="#22c55e"><path d="M 5 -18 L 8 -22 L 11 -18 Z" /></g>
          </g>
        </g>

        {/* ── EDIFICIO 1: CASA ── */}
        <g className="pa-ed pa-ed1">
          <rect x="120" y="280" width="140" height="100" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="2.5" />
          <path d="M 105 280 L 190 220 L 275 280 Z" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="180" y="320" width="26" height="60" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2" />
          <circle cx="200" cy="352" r="1.8" fill="#2563eb" />
          <rect x="130" y="305" width="28" height="26" fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.8" opacity="0.92" />
          <line x1="144" y1="305" x2="144" y2="331" stroke="#1a2a3a" strokeWidth="0.8" opacity="0.6" />
          <line x1="130" y1="318" x2="158" y2="318" stroke="#1a2a3a" strokeWidth="0.8" opacity="0.6" />
          <rect x="225" y="305" width="28" height="26" fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.8" opacity="0.92" />
          <line x1="239" y1="305" x2="239" y2="331" stroke="#1a2a3a" strokeWidth="0.8" opacity="0.6" />
          <line x1="225" y1="318" x2="253" y2="318" stroke="#1a2a3a" strokeWidth="0.8" opacity="0.6" />
          <rect x="188" y="377" width="10" height="3" fill="#4a6b7c" />
        </g>

        {/* ── EDIFICIO 2: DEPARTAMENTOS ── */}
        <g className="pa-ed pa-ed2">
          <rect x="295" y="190" width="120" height="190" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="2.5" />
          <rect x="295" y="190" width="120" height="12" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2.5" />
          <g fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.5" opacity="0.92">
            <rect x="307" y="212" width="22" height="24" /><rect x="338" y="212" width="22" height="24" /><rect x="378" y="212" width="22" height="24" />
            <rect x="307" y="246" width="22" height="24" /><rect x="338" y="246" width="22" height="24" /><rect x="378" y="246" width="22" height="24" />
            <rect x="307" y="280" width="22" height="24" /><rect x="338" y="280" width="22" height="24" /><rect x="378" y="280" width="22" height="24" />
          </g>
          <rect x="346" y="320" width="24" height="60" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2" />
          <line x1="358" y1="320" x2="358" y2="380" stroke="#1a2a3a" strokeWidth="0.8" />
          <circle cx="354" cy="352" r="1.6" fill="#2563eb" />
          <rect x="338" y="377" width="14" height="3" fill="#4a6b7c" />
        </g>

        {/* ── EDIFICIO 3: ESCUELA con bandera argentina ── */}
        <g className="pa-ed pa-ed3">
          <rect x="445" y="190" width="160" height="190" rx="4" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="2.5" />
          <path d="M 430 190 L 525 140 L 620 190 Z" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="525" y1="140" x2="525" y2="112" stroke="#4a6b7c" strokeWidth="2" strokeLinecap="round" />
          <rect x="497" y="115" width="28" height="6" fill="#75AADB" stroke="#1a2a3a" strokeWidth="0.7" />
          <rect x="497" y="121" width="28" height="6" fill="#ffffff" stroke="#1a2a3a" strokeWidth="0.7" />
          <rect x="497" y="127" width="28" height="6" fill="#75AADB" stroke="#1a2a3a" strokeWidth="0.7" />
          <circle cx="511" cy="124" r="2" fill="#F6B40E" stroke="#1a2a3a" strokeWidth="0.5" />
          <circle cx="525" cy="178" r="7" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="1.5" />
          <line x1="525" y1="178" x2="525" y2="174" stroke="#1a2a3a" strokeWidth="1" />
          <line x1="525" y1="178" x2="528" y2="179.5" stroke="#1a2a3a" strokeWidth="1" />
          <rect x="508" y="320" width="34" height="60" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2" />
          <line x1="525" y1="320" x2="525" y2="380" stroke="#1a2a3a" strokeWidth="1" />
          <circle cx="521" cy="352" r="1.6" fill="#2563eb" />
          <circle cx="529" cy="352" r="1.6" fill="#2563eb" />
          <g fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.5" opacity="0.92">
            <rect x="460" y="210" width="24" height="28" /><rect x="490" y="210" width="24" height="28" />
            <rect x="538" y="210" width="24" height="28" /><rect x="568" y="210" width="24" height="28" />
            <rect x="460" y="280" width="24" height="28" /><rect x="490" y="280" width="24" height="28" />
            <rect x="538" y="280" width="24" height="28" /><rect x="568" y="280" width="24" height="28" />
          </g>
        </g>

        {/* ── EDIFICIO 4: DEPARTAMENTOS ALTOS ── */}
        <g className="pa-ed pa-ed4">
          <rect x="635" y="160" width="125" height="220" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="2.5" />
          <rect x="635" y="160" width="125" height="14" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2.5" />
          <g fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.5" opacity="0.92">
            <rect x="650" y="185" width="22" height="26" /><rect x="680" y="185" width="22" height="26" /><rect x="722" y="185" width="22" height="26" />
            <rect x="650" y="221" width="22" height="26" /><rect x="680" y="221" width="22" height="26" /><rect x="722" y="221" width="22" height="26" />
            <rect x="650" y="257" width="22" height="26" /><rect x="680" y="257" width="22" height="26" /><rect x="722" y="257" width="22" height="26" />
            <rect x="650" y="293" width="22" height="26" /><rect x="680" y="293" width="22" height="26" /><rect x="722" y="293" width="22" height="26" />
          </g>
          <rect x="685" y="335" width="26" height="45" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2" />
          <line x1="698" y1="335" x2="698" y2="380" stroke="#1a2a3a" strokeWidth="0.8" />
        </g>

        {/* ── EDIFICIO 5: DEPARTAMENTOS ── */}
        <g className="pa-ed pa-ed5">
          <rect x="785" y="200" width="135" height="180" fill="#f0f4f8" stroke="#1a2a3a" strokeWidth="2.5" />
          <rect x="785" y="200" width="135" height="13" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2.5" />
          <g fill="#0ea5e9" stroke="#1a2a3a" strokeWidth="1.5" opacity="0.92">
            <rect x="798" y="225" width="22" height="24" /><rect x="828" y="225" width="22" height="24" /><rect x="884" y="225" width="22" height="24" />
            <rect x="798" y="258" width="22" height="24" /><rect x="828" y="258" width="22" height="24" /><rect x="884" y="258" width="22" height="24" />
            <rect x="798" y="291" width="22" height="24" /><rect x="828" y="291" width="22" height="24" /><rect x="884" y="291" width="22" height="24" />
          </g>
          <rect x="843" y="330" width="26" height="50" fill="#2d4a5e" stroke="#1a2a3a" strokeWidth="2" />
          <line x1="856" y1="330" x2="856" y2="380" stroke="#1a2a3a" strokeWidth="0.8" />
          <rect x="836" y="377" width="14" height="3" fill="#4a6b7c" />
        </g>

        {/* ── PERSONAS (14 siluetas) ── */}
        <Persona cls="pa-p1" big color="#4a6b7c" />
        <Persona cls="pa-p2" big color="#2d4a5e" />
        <Persona cls="pa-p3" color="#1a2a3a" />
        <Persona cls="pa-p4" big color="#4a6b7c" />
        <Persona cls="pa-p5" big color="#2d4a5e" />
        <Persona cls="pa-p6" color="#1a2a3a" />
        <Persona cls="pa-p7" big color="#4a6b7c" />
        <Persona cls="pa-p8" color="#2d4a5e" />
        <Persona cls="pa-p9" big color="#1a2a3a" />
        <Persona cls="pa-p10" color="#4a6b7c" />
        <Persona cls="pa-p11" big color="#2d4a5e" />
        <Persona cls="pa-p12" color="#1a2a3a" />
        <Persona cls="pa-p13" big color="#4a6b7c" />
        <Persona cls="pa-p14" color="#2d4a5e" />
      </svg>
    </div>
  )
}

/**
 * Silueta de persona. `big` = adulto (~32px alto), si no → niñe (~26px alto).
 */
function Persona({ cls, color, big }: { cls: string; color: string; big?: boolean }) {
  if (big) {
    return (
      <g className={`pa-persona ${cls}`}>
        <g fill={color}>
          <rect x="-4" y="14" width="3" height="14" rx="1" />
          <rect x="1" y="14" width="3" height="14" rx="1" />
          <path d="M -7 -2 Q -8 -8 -4 -10 L 4 -10 Q 8 -8 7 -2 L 6 14 L -6 14 Z" />
          <path d="M -7 -7 Q -11 -3 -10 5 L -8 5 L -6 -2 Z" />
          <path d="M 7 -7 Q 11 -3 10 5 L 8 5 L 6 -2 Z" />
          <rect x="-2" y="-14" width="4" height="6" rx="2" />
          <circle cx="0" cy="-18" r="6.5" />
        </g>
      </g>
    )
  }
  return (
    <g className={`pa-persona ${cls}`}>
      <g fill={color}>
        <rect x="-3" y="11" width="3" height="12" rx="1" />
        <rect x="0" y="11" width="3" height="12" rx="1" />
        <path d="M -6 -1 Q -7 -6 -4 -8 L 4 -8 Q 7 -6 6 -1 L 5 11 L -5 11 Z" />
        <path d="M -6 -5 Q -9 -2 -8 4 L -7 4 L -5 -1 Z" />
        <path d="M 6 -5 Q 9 -2 8 4 L 7 4 L 5 -1 Z" />
        <rect x="-1.5" y="-12" width="3" height="5" rx="1.5" />
        <circle cx="0" cy="-15" r="5.5" />
      </g>
    </g>
  )
}
