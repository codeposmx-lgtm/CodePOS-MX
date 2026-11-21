import { useEffect, useState } from 'react';
import './navbar.css';

export function Brand({ homeHref = "#inicio" }) {
  return <a className="brand" href={homeHref} aria-label="CodePOS MX, inicio"><img className="brand-logo" src="/logo-code-nav.webp" alt="" width="562" height="120" decoding="async"/></a>;
}

const navServices = [
  { icon: '01', title: 'POS y ventas', detail: 'Ventas, inventario y cuentas', href: 'pos.html' },
  { icon: '02', title: 'Tarjetas NFC y QR', detail: 'Comparte tu negocio con un toque', href: 'nfc.html' },
  { icon: '03', title: 'Páginas web', detail: 'Tu negocio, presente en internet', href: '#servicio-paginas-web' },
  { icon: '04', title: 'Menús digitales', detail: 'Consulta fácil desde un QR', href: '#servicio-menus-digitales-con-qr' },
  { icon: '05', title: 'Sistemas a medida', detail: 'Herramientas para tu operación', href: '#servicio-sistemas-personalizados' },
];

// Secciones de la portada que tienen enlace en la navegación, en orden de aparición.
const homeSections = ['inicio', 'historia', 'servicios', 'contacto'];

// Marca en la navegación la sección que se está viendo al hacer scroll.
// `sections` va en orden de aparición; null desactiva el seguimiento.
function useActiveSection(sections) {
  const [active, setActive] = useState('');
  const key = sections ? sections.join(',') : '';
  useEffect(() => {
    if (!sections) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const readingLine = window.innerHeight * 0.35;
      let current = '';
      for (const id of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= readingLine) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? sections[sections.length - 1] : current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [key]);
  return active;
}

/**
 * Barra de navegación compartida por todas las páginas.
 * - Sin `links`: navegación de la portada (con menú de Servicios). `homePath` = "" en la portada, "/" en otras páginas.
 * - Con `links` ([{ id, label }]): enlaces propios de la página, que también se marcan al hacer scroll.
 *   `spySections` puede añadir secciones sin enlace (p. ej. "contacto") para dejar de marcar al llegar a ellas.
 * - `cta`: { href, label, icon } del botón de la derecha.
 * - `menuFromTablet`: muestra el menú desplegable desde 900px (en vez de 700px)
 *   cuando los enlaces son largos y no caben en tablet.
 */
export function Navbar({ homePath = "", links, spySections, cta, menuFromTablet = false }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const sections = links ? (spySections || links.map(link => link.id)) : (homePath === '' ? homeSections : null);
  const activeSection = useActiveSection(sections);
  const current = (section) => activeSection === section ? { 'aria-current': 'location' } : {};
  const sectionHref = (section) => `${homePath}#${section}`;
  const close = () => { setOpen(false); setServicesOpen(false); };
  const toggleServices = () => {
    if (window.matchMedia('(min-width: 701px)').matches) setServicesOpen(true);
    else setServicesOpen(value => !value);
  };
  const button = cta || { href: sectionHref('contacto'), label: 'Hablemos', icon: '↗' };

  return <div className={`nav-wrap${menuFromTablet ? ' nav-wrap--menu-tablet' : ''}`}>
    <div className="container">
      <nav aria-label="Navegación principal">
        <Brand homeHref={sectionHref('inicio')}/>
        <div className={`nav-links${open ? ' open' : ''}`} id="navLinks">
          {links ? links.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={close} {...current(id)}>{label}</a>) : <>
            <a href={sectionHref('inicio')} onClick={close} {...current('inicio')}>Inicio</a>
            <a href={sectionHref('historia')} onClick={close} {...current('historia')}>Nuestra historia</a>
            <div className="nav-service-menu"
              onPointerEnter={(event) => { if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 701px)').matches) setServicesOpen(true); }}
              onPointerLeave={(event) => { if (event.pointerType === 'mouse') setServicesOpen(false); }}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setServicesOpen(false); }}>
              <button className="nav-service-trigger" type="button" aria-expanded={servicesOpen} aria-controls="navServiceDropdown" onClick={toggleServices} {...current('servicios')}>
                Servicios
              </button>
              <div className={`nav-service-dropdown${servicesOpen ? ' open' : ''}`} id="navServiceDropdown">
                <div className="nav-service-dropdown-heading"><span>CODEPOS MX · SOLUCIONES</span><strong>¿Qué quieres mejorar?</strong></div>
                <div className="nav-service-grid">
                  {navServices.map(({ icon, title, detail, href }) => <a className="nav-service-item" key={title} href={`${homePath}${href}`} onClick={close}>
                    <span className="nav-service-number">{icon}</span>
                    <span><strong>{title}</strong><small>{detail}</small></span>
                  </a>)}
                </div>
                <a className="nav-service-all" href={sectionHref('servicios')} onClick={close}>Ver todos los servicios <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <a href={sectionHref('contacto')} onClick={close} {...current('contacto')}>Contacto</a>
          </>}
        </div>
        <a className="nav-cta" href={button.href}>{button.label} <span aria-hidden="true">{button.icon}</span></a>
        <button className="menu-toggle" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
      </nav>
    </div>
  </div>;
}
