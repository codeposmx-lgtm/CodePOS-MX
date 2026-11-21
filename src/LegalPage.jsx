import { Footer, Navbar, WHATSAPP_NUMBER } from './App.jsx';
import CookieNotice from './CookieNotice.jsx';
import { ANALYTICS_ENABLED } from './analytics.js';
import './legal.css';

const updated = ANALYTICS_ENABLED ? '19 de noviembre de 2026' : '18 de noviembre de 2026';

function LegalSection({ id, title, children }) {
  return <section className="legal-section" id={id}><h2>{title}</h2>{children}</section>;
}

export default function LegalPage() {
  return <>
    <Navbar homePath="/"/>
    <main className="legal-main">
      <header className="legal-hero">
        <div className="container">
          <span className="section-kicker">CODEPOS MX · INFORMACIÓN LEGAL</span>
          <h1>Privacidad, cookies<br/>y condiciones de uso.</h1>
          <p>Información clara sobre el sitio, los datos que nos compartes y el uso de la demo.</p>
          <small>Última actualización: {updated}</small>
        </div>
      </header>
      <div className="container legal-layout">
        <nav className="legal-toc" aria-label="Secciones legales">
          <a href="#privacidad">Aviso de privacidad</a>
          <a href="#cookies">Política de cookies</a>
          <a href="#terminos">Términos y condiciones</a>
        </nav>

        <div className="legal-content">
          <LegalSection id="privacidad" title="Aviso de privacidad">
            <p><strong>Responsable.</strong> CodePOS MX es un emprendimiento digital que opera en línea desde Cuautla, Morelos, México. No contamos con un local de atención al público. Para solicitudes de privacidad puedes escribir a <a href="mailto:codeposmx@gmail.com">codeposmx@gmail.com</a> o mandar un mensaje por WhatsApp al <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">+52 1 55 7423 2439</a>.</p>
            <h3>Qué datos podemos recibir</h3>
            <p>Si usas el formulario de la página NFC, puedes incluir tu nombre, nombre del negocio, el servicio que te interesa y los detalles que escribas. El formulario prepara un correo en tu aplicación; CodePOS MX no recibe esos datos a través de un servidor del sitio. Solo los recibiremos si decides enviar el correo. También puedes contactarnos por WhatsApp o correo y compartir voluntariamente tus datos de contacto y los detalles de tu consulta.</p>
            <p>La demo del punto de venta usa datos ficticios y mantiene los cambios de la sesión en la memoria del navegador. No envía ni guarda las ventas de prueba en un servidor.</p>
            <h3>Finalidades</h3>
            <p>Usamos los datos que nos envías para responder consultas, preparar cotizaciones, dar seguimiento a solicitudes y, cuando corresponda, atender una relación comercial. No vendemos tus datos ni los usamos para enviarte publicidad no solicitada.</p>
            <h3>Servicios externos y conservación</h3>
            <p>Al enviar un correo o abrir WhatsApp, la información se procesa también mediante el proveedor que elijas; al salir del sitio se aplican sus propios términos y avisos. La plataforma de alojamiento (por ejemplo, Vercel o Netlify, según dónde se publique el sitio) puede procesar datos técnicos de conexión para entregar y proteger la página. {ANALYTICS_ENABLED && ' Si aceptas las cookies de analítica, Google Analytics (Google LLC) recibe datos técnicos de tu visita, como páginas vistas, dispositivo, navegador y ubicación aproximada, para generar estadísticas agregadas; puede tratarlos en servidores fuera de México.'} Conservaremos las consultas durante el tiempo necesario para atenderlas y cumplir obligaciones legales; después se eliminarán o bloquearán cuando corresponda.</p>
            <h3>Derechos ARCO y cambios</h3>
            <p>Puedes solicitar acceso, rectificación, cancelación u oposición (derechos ARCO), así como limitar el uso o divulgación, escribiendo a <a href="mailto:codeposmx@gmail.com?subject=Solicitud%20de%20privacidad%20CodePOS%20MX">codeposmx@gmail.com</a> con el asunto “Solicitud de privacidad”. Indica tu nombre, el derecho que deseas ejercer y una forma de localizar los datos; podremos pedir información razonable para verificar tu identidad o representación. Conforme a la ley aplicable, comunicaremos la determinación dentro de veinte días y, si procede, la haremos efectiva dentro de los quince días siguientes, sujetos a los supuestos de ampliación previstos por la ley. Los cambios a este aviso se publicarán en esta página.</p>
            <p>En este aviso, “cancelación” y “oposición” se refieren únicamente al tratamiento de datos personales: solicitar que se eliminen cuando corresponda o pedir que no se usen para ciertos fines. No significan cancelar la compra del POS ni describen una suscripción.</p>
            <p>Este sitio no solicita datos personales sensibles. Evita incluir información sensible o financiera en formularios, correos o mensajes.</p>
          </LegalSection>

          <LegalSection id="cookies" title="Política de cookies">
            {ANALYTICS_ENABLED ? <>
            <p>El sitio de CodePOS MX usa Google Analytics 4 solo si lo aceptas en el aviso de cookies. Si lo rechazas o no eliges, la etiqueta de Analytics no se carga. Tu elección se guarda en la cookie técnica <code>codepos_cookie_notice</code>.</p>
            <h3>Cookie técnica</h3>
            <ul>
              <li><code>codepos_cookie_notice</code>: recuerda si aceptaste o rechazaste la analítica. Dura hasta 180 días.</li>
              <li>Protección: se limita al sitio con <code>SameSite=Lax</code> y, cuando se usa HTTPS, con el atributo <code>Secure</code>.</li>
            </ul>
            <h3>Cookies de analítica (solo con tu permiso)</h3>
            <ul>
              <li><code>_ga</code> y <code>_ga_*</code>: las configura Google Analytics para distinguir visitas y sesiones. Duran hasta 2 años.</li>
              <li>Finalidad: medir cuántas personas visitan el sitio y qué páginas consultan, con estadísticas agregadas. Tenemos desactivadas las señales de Google y la personalización de anuncios.</li>
              <li>Proveedor: Google LLC. Consulta <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">su política de privacidad</a>.</li>
            </ul>
            <p>No usamos cookies de publicidad. Puedes cambiar tu decisión cuando quieras con el botón de abajo o desde «Preferencias» en el pie de página; al rechazar, borramos las cookies <code>_ga</code> de este sitio. Los enlaces a servicios externos, como WhatsApp, pueden utilizar tecnologías propias que se rigen por las políticas de cada proveedor.</p>
            </> : <>
            <p>El sitio de CodePOS MX no configura cookies de analítica, publicidad ni seguimiento. Al pulsar “Entendido” en el aviso, se guarda únicamente la cookie técnica <code>codepos_cookie_notice</code> para recordar que ya lo cerraste.</p>
            <ul>
              <li>Duración: hasta 180 días o hasta que la borres desde la configuración de tu navegador.</li>
              <li>Alcance: preferencia del aviso en este sitio; no crea perfiles ni se usa para medir tu actividad.</li>
              <li>Protección: se limita al sitio con <code>SameSite=Lax</code> y, cuando se usa HTTPS, con el atributo <code>Secure</code>.</li>
            </ul>
            <p>Los enlaces a servicios externos, como WhatsApp, pueden utilizar tecnologías propias cuando los visitas; esas tecnologías se rigen por las políticas de cada proveedor. Puedes borrar la cookie técnica desde los ajustes del navegador. Si agregamos herramientas de analítica o publicidad en el futuro, actualizaremos esta política antes de activarlas.</p>
            </>}
            <button type="button" className="legal-secondary-button" onClick={() => window.dispatchEvent(new Event('codepos:open-cookie-notice'))}>{ANALYTICS_ENABLED ? 'Cambiar mis preferencias de cookies' : 'Volver a mostrar el aviso de cookies'}</button>
          </LegalSection>

          <LegalSection id="terminos" title="Términos y condiciones">
            <p>Al navegar este sitio aceptas estas condiciones de uso. Si no estás de acuerdo, deja de utilizarlo. El sitio presenta información general de CodePOS MX y permite solicitar información sobre servicios digitales.</p>
            <h3>Información y cotizaciones</h3>
            <p>Las descripciones del sitio son informativas. No constituyen por sí solas una oferta con precio, alcance o plazo garantizado. El precio, funciones, entregables, fechas, forma de pago, soporte y cualquier garantía se establecerán en la cotización o acuerdo particular que acepten ambas partes. La comunicación por WhatsApp o correo no sustituye ese acuerdo.</p>
            <h3>Compra y duración del sistema POS</h3>
            <p>El sistema POS se adquiere mediante un solo pago. Una vez completada la compra, la licencia de uso es permanente y no requiere mensualidad ni suscripción recurrente. El alcance de la compra y cualquier servicio adicional se detallarán en la cotización o acuerdo correspondiente.</p>
            <h3>Demo del punto de venta</h3>
            <p>La demo es un prototipo interactivo con información ficticia, solo para mostrar funciones posibles. No es el sistema final ni debe utilizarse para registrar operaciones reales, llevar contabilidad, calcular impuestos o tomar decisiones comerciales. Sus datos se reinician al cerrar o recargar la página.</p>
            <h3>Uso permitido y propiedad intelectual</h3>
            <p>Utiliza el sitio de manera lícita y no intentes interferir con su operación, seguridad o disponibilidad. El contenido, diseño, marcas, imágenes y software pertenecen a CodePOS MX o a sus respectivos titulares y no pueden copiarse, modificarse, distribuirse o explotarse comercialmente sin autorización, salvo los usos permitidos por la ley.</p>
            <h3>Enlaces, disponibilidad y derechos</h3>
            <p>El sitio puede enlazar a servicios de terceros que tienen sus propios términos y avisos. Procuramos mantener el sitio disponible y la información actualizada, pero algunas funciones pueden cambiar o interrumpirse. Estas condiciones no limitan los derechos irrenunciables que te correspondan conforme a las leyes mexicanas de protección al consumidor y demás legislación aplicable.</p>
            <h3>Contacto y jurisdicción</h3>
            <p>Para dudas, aclaraciones o reclamaciones, contáctanos en línea en <a href="mailto:codeposmx@gmail.com">codeposmx@gmail.com</a> o manda un mensaje por WhatsApp al <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">+52 1 55 7423 2439</a>. CodePOS MX opera desde Cuautla, Morelos y no cuenta con un local de atención al público. Se aplicarán las leyes de México; los derechos de las personas consumidoras y la competencia de las autoridades correspondientes permanecen a salvo.</p>
          </LegalSection>

          <aside className="legal-notice"><strong>Marco legal de referencia</strong><p>Consulta la <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf" target="_blank" rel="noopener noreferrer">Ley Federal de Protección de Datos Personales en Posesión de los Particulares</a> y la <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf_mov/Ley_Federal_de_Proteccion_al_Consumidor.pdf" target="_blank" rel="noopener noreferrer">Ley Federal de Protección al Consumidor</a>.</p></aside>
        </div>
      </div>
    </main>
    <Footer homePath="/"/>
    <CookieNotice/>
  </>;
}
