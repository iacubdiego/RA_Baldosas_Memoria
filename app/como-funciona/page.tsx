'use client'

import Link from 'next/link'

const PASOS = [
  {
    numero: '01',
    titulo: 'Elegí la baldosa',
    descripcion: 'Fijate en el mapa y elegí una baldosa. Podés ver cómo llegar o elegir otra baldosa.',
    imagen: '/images/como_ir.jpg',
    alt: 'Mapa con baldosas y opción de cómo ir',
  },
  {
    numero: '02',
    titulo: 'Conocé la historia detrás de la baldosa',
    descripcion: 'En el detalle vas a poder conocer la historia de la o las personas de esa baldosa.',
    imagen: '/images/detalle_baldosa.jpg',
    alt: 'Vista de detalle de una baldosa con información histórica',
  },
  {
    numero: '03',
    titulo: 'Escaneá y visitá',
    descripcion: 'Cuando estás cerca (menos de 50 metros) te permite escanear la baldosa. Al escanearla se agrega una nueva visita y ves la escena interactiva que podés guardar de recuerdo.',
    imagen: '/images/escena.jpg',
    alt: 'Escena interactiva AR sobre una baldosa',
  },
]

export default function ComoFuncionaPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cf-root {
          min-height: 100vh;
          background: var(--color-parchment);
        }

        /* ── Hero ── */
        .cf-hero {
          background: var(--color-stone);
          color: var(--color-parchment);
          padding: 5rem 1.5rem 4rem;
          position: relative;
          overflow: hidden;
        }
        .cf-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 80% at 20% 60%, rgba(14,165,233,0.15) 0%, transparent 65%);
          pointer-events: none;
        }
        .cf-hero-inner {
          max-width: 760px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .cf-eyebrow {
          font-size: 1rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin: 0 0 1rem;
          font-family: var(--font-body);
          font-weight: 600;
        }
        .cf-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.6rem, 6vw, 4.2rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0 0 1.5rem;
          color: var(--color-parchment);
        }
        .cf-hero-title em {
          font-style: italic;
          color: rgba(240,244,248,0.55);
        }
        .cf-hero-lead {
          font-size: clamp(1.05rem, 2.2vw, 1.2rem);
          line-height: 1.72;
          color: rgba(240,244,248,0.75);
          max-width: 580px;
          margin: 0;
          font-family: var(--font-body);
          font-weight: 300;
        }

        /* ── Línea divisoria ── */
        .cf-divider {
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 50%, transparent 100%);
        }

        /* ── Pasos ── */
        .cf-pasos {
          max-width: 820px;
          margin: 0 auto;
          padding: 2rem 1.5rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .cf-paso {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          padding: 3.5rem 0;
          border-bottom: 1px solid rgba(26,42,58,0.08);
        }
        .cf-paso:last-child {
          border-bottom: none;
        }

        /* Alternar imagen izq/der */
        .cf-paso:nth-child(even) .cf-paso-img-wrap {
          order: -1;
        }

        .cf-paso-texto {}
        .cf-paso-numero {
          font-family: var(--font-display);
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1;
          color: var(--color-stone);
          margin: 0 0 -0.5rem;
          letter-spacing: -0.04em;
        }
        .cf-paso-titulo {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 3vw, 1.9rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-stone);
          margin: 0 0 1rem;
          line-height: 1.15;
        }
        .cf-paso-desc {
          font-size: 1.05rem;
          line-height: 1.72;
          color: rgba(26,42,58,0.72);
          margin: 0;
          max-width: 100%;
          font-family: var(--font-body);
          font-weight: 400;
        }

        .cf-paso-img-wrap {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(26,42,58,0.16);
          aspect-ratio: 9/16;
          max-height: 520px;
        }
        .cf-paso-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          display: block;
          transition: transform 0.5s cubic-bezier(0.25,1,0.5,1);
        }
        .cf-paso-img-wrap:hover .cf-paso-img {
          transform: scale(1.03);
        }

        /* ── CTA final ── */
        .cf-cta {
          background: var(--color-stone);
          padding: 4rem 1.5rem;
          text-align: center;
        }
        .cf-cta-titulo {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 700;
          color: var(--color-parchment);
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
        }
        .cf-cta-sub {
          color: rgba(240,244,248,0.6);
          font-size: 1rem;
          margin: 0 0 2rem;
          font-family: var(--font-body);
        }
        .cf-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: var(--color-primary);
          color: white;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          font-family: var(--font-body);
          transition: background 0.18s, transform 0.18s;
        }
        .cf-cta-btn:hover {
          background: var(--color-primary-dark);
          color: white;
          transform: translateY(-2px);
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .cf-paso {
            grid-template-columns: 1fr;
            gap: 1.75rem;
            padding: 2.5rem 0;
          }
          .cf-paso:nth-child(even) .cf-paso-img-wrap {
            order: 0;
          }
          .cf-paso-img-wrap {
            aspect-ratio: 9/14;
            max-height: 380px;
          }
          .cf-paso-numero {
            font-size: 3rem;
          }
        }
      `}} />

      <div className="cf-root">

        {/* Hero */}
        <section className="cf-hero">
          <div className="cf-hero-inner">
            <p className="cf-eyebrow">Recorremos Memoria</p>
            <h1 className="cf-hero-title">
              ¿Cómo<br/><em>funciona?</em>
            </h1>
            <p className="cf-hero-lead">
              Recorremos Memoria te invita a recorrer la ciudad buscando baldosas por la memoria, con una propuesta interactiva detrás de cada una.
            </p>
          </div>
        </section>

        <div className="cf-divider" />

        {/* Pasos */}
        <section className="cf-pasos">
          {PASOS.map((paso) => (
            <div className="cf-paso" key={paso.numero}>
              <div className="cf-paso-texto">
                <p className="cf-paso-numero">{paso.numero}</p>
                <h2 className="cf-paso-titulo">{paso.titulo}</h2>
                <p className="cf-paso-desc">{paso.descripcion}</p>
              </div>
              <div className="cf-paso-img-wrap">
                <img
                  src={paso.imagen}
                  alt={paso.alt}
                  className="cf-paso-img"
                />
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="cf-cta">
          <h2 className="cf-cta-titulo">¿Listo para recorrer?</h2>
          <p className="cf-cta-sub">Abrí el mapa y empezá a descubrir las baldosas cerca tuyo.</p>
          <Link href="/mapa" className="cf-cta-btn">
            Abrir el mapa →
          </Link>
        </section>

      </div>
    </>
  )
}
