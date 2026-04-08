'use client'

import Link from 'next/link'

export default function QuienesSomosPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .qs-root {
          min-height: 100vh;
          background: var(--color-parchment);
        }
        .qs-hero {
          background: var(--color-stone);
          color: var(--color-parchment);
          padding: 5rem 1.5rem 4rem;
          position: relative;
          overflow: hidden;
        }
        .qs-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 60% 50%, rgba(37,99,235,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .qs-hero-inner { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
        .qs-eyebrow {
          font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--color-accent); margin: 0 0 1rem; font-family: var(--font-body); font-weight: 600;
        }
        .qs-hero-title {
          font-family: var(--font-display); font-size: clamp(2.6rem, 6vw, 4.2rem);
          font-weight: 700; line-height: 1.05; letter-spacing: -0.03em;
          margin: 0 0 1.5rem; color: var(--color-parchment);
        }
        .qs-hero-title em { font-style: italic; color: rgba(240,244,248,0.6); }
        .qs-hero-lead {
          font-size: clamp(1.05rem, 2.2vw, 1.22rem); line-height: 1.7;
          color: rgba(240,244,248,0.78); max-width: 600px; margin: 0;
          font-family: var(--font-body); font-weight: 300;
        }
        .qs-divider {
          width: 100%; height: 4px;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 60%, transparent 100%);
        }
        .qs-content { max-width: 760px; margin: 0 auto; padding: 4rem 1.5rem 5rem; }
        .qs-block { margin-bottom: 2.5rem; padding-left: 1.25rem; border-left: 3px solid transparent; transition: border-color 0.3s; }
        .qs-block:hover { border-left-color: var(--color-primary); }
        .qs-block p { font-size: 1.08rem; line-height: 1.78; color: var(--color-stone); margin: 0; max-width: 100%; font-family: var(--font-body); font-weight: 400; }
        .qs-block p a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 3px; font-weight: 500; transition: color 0.15s; }
        .qs-block p a:hover { color: var(--color-primary-dark); }
        .qs-proyectos {
          display: flex; flex-direction: column; gap: 0.75rem;
          margin: 3rem 0; padding: 2rem;
          background: rgba(26,42,58,0.04); border-radius: 12px; border: 1px solid rgba(26,42,58,0.08);
        }
        .qs-proyectos-label { font-size: 1rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-dust); font-family: var(--font-body); font-weight: 600; margin: 0 0 0.5rem; }
        .qs-proyecto { display: flex; align-items: baseline; gap: 0.75rem; font-size: 1rem; color: var(--color-stone); font-family: var(--font-body); }
        .qs-proyecto-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; margin-top: 0.45rem; }
        .qs-proyecto a { color: var(--color-primary); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
        .qs-proyecto a:hover { color: var(--color-primary-dark); }
        .qs-cierre {
          margin-top: 3rem; padding: 2rem 2rem 2rem 1.75rem;
          background: var(--color-stone); color: var(--color-parchment);
          border-radius: 12px; position: relative; overflow: hidden;
        }
        .qs-cierre::before {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 160px; height: 160px; border-radius: 50%;
          background: rgba(37,99,235,0.15); pointer-events: none;
        }
        .qs-cierre-quote { font-family: var(--font-display); font-size: clamp(1.4rem, 3.5vw, 1.9rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 1.25rem; color: var(--color-parchment); position: relative; z-index: 1; }
        .qs-cierre-texto { font-size: 0.98rem; line-height: 1.7; color: rgba(240,244,248,0.75); max-width: 100%; margin: 0 0 1.5rem; font-family: var(--font-body); position: relative; z-index: 1; }
        .qs-cierre-texto a { color: rgba(240,244,248,0.9); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .qs-cierre-texto a:hover { color: white; }
        .qs-cierre-link { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.2rem; background: var(--color-primary); color: white; border-radius: 8px; font-size: 0.88rem; font-weight: 600; text-decoration: none; font-family: var(--font-body); transition: background 0.18s; position: relative; z-index: 1; }
        .qs-cierre-link:hover { background: var(--color-primary-dark); color: white; }
      `}} />

      <div className="qs-root">
        <section className="qs-hero">
          <div className="qs-hero-inner">
            <h1 className="qs-hero-title">Quiénes<br/><em>somos</em></h1>
            <p className="qs-hero-lead">
              Somos gcoop, una Cooperativa de desarrollo de Software Libre. Más allá de nuestros trabajos para empresas de distintos tipo, buscamos aportar a la sociedad desde nuestros conocimientos para construir un mundo mejor, solidario y democrático.
            </p>
          </div>
        </section>

        <div className="qs-divider" />

        <section className="qs-content">
          <div className="qs-block">
            <p>
              Como empresa cooperativa sabemos que la democracia es la piedra fundamental para toda construcción. Por eso desde hace muchos años buscamos distintas formas de aportar y articular con movimientos de derechos humanos y en particular para las conmemoraciones del 24 de Marzo.
            </p>
          </div>

          <div className="qs-proyectos">
            <p className="qs-proyectos-label">Nuestros proyectos relacionados</p>
            <div className="qs-proyecto">
              <span className="qs-proyecto-dot"/>
              <span>En plena pandemia hicimos la{' '}
                <a href="https://facttic.org.ar/2020/03/22/el-24-de-marzo-hacemos-la-marcha-virtual/" target="_blank" rel="noopener noreferrer">marcha virtual</a>
              </span>
            </div>
            <div className="qs-proyecto">
              <span className="qs-proyecto-dot"/>
              <span>Luego construimos el portal{' '}
                <a href="https://memoriasi.ar/" target="_blank" rel="noopener noreferrer">memoriasi.ar</a>
              </span>
            </div>
            <div className="qs-proyecto">
              <span className="qs-proyecto-dot"/>
              <span><strong>Recorremos Memoria</strong> — un sitio en construcción para invitar a salir a la calle, recorrer baldosas, conocer las historias de cada una, marcar la visita y llevarse un recuerdo interactivo.</span>
            </div>
            <div className="qs-proyecto">
              <span className="qs-proyecto-dot"/>
              <span>Trabajamos en conjunto con <strong>malefico3d</strong> para generar la experiencia de Realidad Aumentada en 3D que acompaña cada baldosa.</span>
            </div>
          </div>

          <div className="qs-block">
            <p>Si tenés dudas de cómo funciona, mirá la{' '}<Link href="/como-funciona">página de ¿Como funciona?</Link>.</p>
          </div>

          <div className="qs-cierre">
            <p className="qs-cierre-quote">Memoria, Verdad y Justicia</p>
            <p className="qs-cierre-texto">
              Les socies de gcoop, tal como dicen nuestros{' '}
              <a href="https://www.gcoop.coop/acuerdos-gcoop" target="_blank" rel="noopener noreferrer">Acuerdos de trabajo</a>
              , decimos Memoria, Verdad y Justicia y les invitamos a recorrer la memoria día a día para construir una sociedad cada vez más democrática.
            </p>
            <Link href="/mapa" className="qs-cierre-link">Empezar a recorrer →</Link>
          </div>
        </section>
      </div>
    </>
  )
}
