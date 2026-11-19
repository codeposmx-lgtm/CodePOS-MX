import { DemoPOS, Footer, Navbar, WHATSAPP_NUMBER } from './App.jsx';
import CookieNotice from './CookieNotice.jsx';
import useRevealOnScroll from './useRevealOnScroll.js';

const posBenefits = [
  ['▣', 'Ventas', 'Agiliza cada cobro y consulta el total de la venta.'],
  ['▦', 'Inventario', 'Ubica existencias bajas antes de que falte producto.'],
  ['◎', 'Cuentas', 'Da seguimiento a saldos y pagos pendientes.'],
  ['▤', 'Reportes', 'Revisa la actividad de tu negocio en un mismo lugar.'],
];

function PosPreview() {
  return <div className="pos-service-visual" aria-label="Vista previa ilustrativa del sistema CodePOS">
    <div className="pos-preview-glow"/>
    <div className="pos-preview-window">
      <div className="pos-preview-top"><span className="pos-preview-mark">CP</span><span><strong>CodePOS</strong><small>RESUMEN DEL NEGOCIO</small></span><span className="pos-preview-state"><i/> Caja abierta</span></div>
      <div className="pos-preview-title"><span>Ventas de hoy</span><strong>$6,840 <small>MXN</small></strong><em>↑ 12.8% <span>vs. periodo anterior</span></em></div>
      <div className="pos-preview-bars" aria-hidden="true">{[42, 61, 48, 73, 58, 88, 69].map((height, index) => <i key={index} style={{height: `${height}%`}}/>)}</div>
      <div className="pos-preview-bottom"><span><i className="preview-blue"/> Inventario organizado</span><span><i className="preview-green"/> Operación al día</span></div>
    </div>
    <div className="pos-preview-float pos-preview-inventory"><span>▦</span><span><strong>Inventario</strong><small>Control de existencias</small></span><b>↗</b></div>
    <div className="pos-preview-float pos-preview-accounts"><span>◎</span><span><strong>Cuentas claras</strong><small>Seguimiento sencillo</small></span></div>
  </div>;
}

export default function PosPage() {
  useRevealOnScroll();
  return <>
    <Navbar homePath="/"/>
    <main>
      <section className="pos-service-hero">
        <div className="container pos-service-hero-grid">
          <div className="pos-service-copy">
            <span className="pos-service-kicker"><i/> SISTEMAS DE PUNTO DE VENTA · CODEPOS MX</span>
            <h1>Vende con orden.<br/><em>Crece con control.</em></h1>
            <p>Organiza las ventas, el inventario y las cuentas de tu negocio en una experiencia clara y fácil de usar.</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#demo">Explora la demo <span aria-hidden="true">↓</span></a>
              <a className="btn btn-secondary" href="/#contacto">Hablemos de tu negocio</a>
            </div>
            <div className="pos-service-note"><span>✓</span> Ejemplo interactivo con datos ficticios. Es una prueba, no el sistema terminado.</div>
            <div className="pos-service-note pos-license-note"><span>✓</span> Compra única · Licencia permanente · Sin mensualidad</div>
          </div>
          <PosPreview/>
        </div>
      </section>

      <section className="pos-capabilities section-soft" aria-label="Funciones del punto de venta">
        <div className="container pos-capabilities-grid">
          {posBenefits.map(([icon, title, description]) => <article className="pos-capability" key={title}><span>{icon}</span><div><strong>{title}</strong><small>{description}</small></div></article>)}
        </div>
      </section>

      <DemoPOS/>

      <section className="pos-contact-cta">
        <div className="container"><div><span>UN SISTEMA A TU MEDIDA</span><h2>Tu operación es única.<br/>Tu POS también puede serlo.</h2><p>Cuéntanos cómo trabaja tu negocio y exploremos qué solución te ayudaría más.</p></div><a className="btn btn-primary" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero información sobre el sistema POS de CodePOS MX.')}`} target="_blank" rel="noopener noreferrer">Cotiza por WhatsApp <span aria-hidden="true">↗</span></a></div>
      </section>
    </main>
    <Footer homePath="/"/>
    <CookieNotice/>
  </>;
}
