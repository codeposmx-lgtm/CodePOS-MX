import { useState } from 'react';
import { businessTypes, demoAccounts, demoCatalogs, demoMetrics } from './data/demoData.js';
import CookieNotice from './CookieNotice.jsx';
import useRevealOnScroll from './useRevealOnScroll.js';

export const WHATSAPP_NUMBER = '5215574232439';
const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

function BrandLogo() {
  return <><svg className="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="18" stroke="#07162f" strokeWidth="2.8"/><path d="M4.8 17h34.4M4.8 27h23.7M22 4c-5.8 5-8.7 11-8.7 18s2.9 13 8.7 18M22 4c5.8 5 8.7 11 8.7 18" stroke="#07162f" strokeWidth="2.2" strokeLinecap="round"/><path d="m24 24 8 6-8 6M35 23l-3 14" stroke="#1677ff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></svg><span>CodePOS <span className="mx">MX</span></span></>;
}

function Brand({ homeHref = "#inicio" }) {
  return <a className="brand" href={homeHref} aria-label="CodePOS MX, inicio"><BrandLogo/></a>;
}

const navServices = [
  { icon: '01', title: 'POS y ventas', detail: 'Ventas, inventario y cuentas', href: 'pos.html' },
  { icon: '02', title: 'Tarjetas NFC y QR', detail: 'Comparte tu negocio con un toque', href: 'nfc.html' },
  { icon: '03', title: 'Páginas web', detail: 'Tu negocio, presente en internet', href: '#servicio-paginas-web' },
  { icon: '04', title: 'Menús digitales', detail: 'Consulta fácil desde un QR', href: '#servicio-menus-digitales-con-qr' },
  { icon: '05', title: 'Sistemas a medida', detail: 'Herramientas para tu operación', href: '#servicio-sistemas-personalizados' },
];

export function Navbar({ homePath = "" }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const sectionHref = (section) => `${homePath}#${section}`;
  const close = () => { setOpen(false); setServicesOpen(false); };
  const toggleServices = () => {
    if (window.matchMedia('(min-width: 701px)').matches) setServicesOpen(true);
    else setServicesOpen(value => !value);
  };

  return <div className="nav-wrap">
    <div className="container">
      <nav aria-label="Navegación principal">
        <Brand homeHref={sectionHref('inicio')}/>
        <div className={`nav-links${open ? ' open' : ''}`} id="navLinks">
          <a href={sectionHref('inicio')} onClick={close}>Inicio</a>
          <a href={sectionHref('historia')} onClick={close}>Nuestra historia</a>
          <div className="nav-service-menu"
            onPointerEnter={(event) => { if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 701px)').matches) setServicesOpen(true); }}
            onPointerLeave={(event) => { if (event.pointerType === 'mouse') setServicesOpen(false); }}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setServicesOpen(false); }}>
            <button className="nav-service-trigger" type="button" aria-expanded={servicesOpen} aria-controls="navServiceDropdown" onClick={toggleServices}>
              Servicios <span aria-hidden="true">⌄</span>
            </button>
            <div className={`nav-service-dropdown${servicesOpen ? ' open' : ''}`} id="navServiceDropdown">
              <div className="nav-service-dropdown-heading"><span>CODEPOS MX · SOLUCIONES</span><strong>¿Qué quieres mejorar?</strong></div>
              <div className="nav-service-grid">
                {navServices.map(({ icon, title, detail, href }) => <a className="nav-service-item" key={title} href={`${homePath}${href}`} onClick={close}>
                  <span className="nav-service-number">{icon}</span>
                  <span><strong>{title}</strong><small>{detail}</small></span>
                  <span className="nav-service-arrow" aria-hidden="true">↗</span>
                </a>)}
              </div>
              <a className="nav-service-all" href={sectionHref('servicios')} onClick={close}>Ver todos los servicios <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <a href={sectionHref('contacto')} onClick={close}>Contacto</a>
        </div>
        <a className="nav-cta" href={sectionHref('contacto')}>Hablemos <span aria-hidden="true">↗</span></a>
        <button className="menu-toggle" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
      </nav>
    </div>
  </div>;
}

const heroSolutions = [
  ['POS.jpg', 'Sistemas POS', 'Organiza tu operación'],
  ['sitio-web.png', 'Páginas web', 'Hazte visible en línea'],
  ['favicon_nfc.jpg', 'NFC + QR', 'Conecta con tus clientes'],
  ['sis_per.png', 'A tu medida', 'Crece con tecnología'],
];

function Hero() {
  return <section className="hero" id="inicio"><div className="container hero-grid"><div className="reveal"><div className="eyebrow"><span/> Tecnología hecha para negocios reales</div><h1>Tu negocio merece<br/>tecnología útil.<br/><em>Y hecha para ti.</em></h1><p className="hero-copy">Sistemas de punto de venta, páginas web y tarjetas digitales para resolver necesidades reales. Escuchamos tu idea y te ayudamos a encontrar una solución clara, a tu medida.</p><div className="hero-actions"><a className="btn btn-primary" href="#servicios">Explora las soluciones <span aria-hidden="true">→</span></a><a className="btn btn-secondary" href="#historia">Conoce al equipo</a></div><div className="hero-note"><strong>Un equipo pequeño, ideas concretas.</strong> <span>Emprendimiento mexicano con tecnología útil.</span></div></div><div className="hero-art" aria-label="Vista ilustrativa de las soluciones CodePOS MX"><div className="orb"/><div className="art-card"><div className="art-top"><div className="mini-brand"><BrandLogo/></div><span className="status">● Soluciones digitales</span></div><div className="dashboard">{heroSolutions.map(([image, title, detail]) => <div className="dash-tile" key={title}><div className="tile-icon"><img src={`/${image}`} alt=""/></div><strong>{title}</strong><small>{detail}</small></div>)}</div></div><div className="floating-tag tag-one"><span className="tag-icon">✦</span><span>Ideas con propósito</span></div><div className="floating-tag tag-two"><span className="tag-icon">↗</span><span>Impulsa tu negocio</span></div></div></div></section>;
}

function Historia() {
  return <section className="section" id="historia"><div className="container story-grid"><div className="story-visual"><img className="story-image" src="/quienes-somos.webp" alt="Equipo de CodePOS MX trabajando en soluciones digitales" loading="lazy" decoding="async"/></div><div className="story-copy"><span className="section-kicker">Quiénes somos</span><h2>Una idea que nació con ganas de hacer algo diferente.</h2><p>CodePOS MX surgió de la visión de tres jóvenes universitarios que querían salir de la rutina y llevar sus ideas más allá del aula.</p><p>Decidimos poner en práctica los conocimientos adquiridos durante nuestra carrera, afrontar nuevos retos y comenzar nuestro camino en el mundo laboral a través del emprendimiento.</p><p>Hoy buscamos transformar ideas en soluciones tecnológicas útiles, accesibles y pensadas para las necesidades reales de cada negocio.</p><div className="story-points">{['Creatividad e iniciativa','Soluciones a tu medida','Aprendizaje constante','Tecnología con propósito'].map(item => <div className="story-point" key={item}><span className="check">✓</span> {item}</div>)}</div></div></div></section>;
}

const services = [
  ['favicon_nfc.jpg','Tarjeteros digitales NFC y QR','Comparte tus datos de contacto, redes sociales y la información de tu negocio de una manera práctica y moderna. Elige NFC, QR o ambos.','nfc.html','Quiero saber más'],
  ['POS.jpg','Sistemas de punto de venta (POS)','Organiza ventas y operaciones con herramientas que ayudan a simplificar tareas y mantener la información de tu negocio más ordenada.','pos.html','Quiero saber más'],
  ['sitio-web.png','Páginas web','Presenta tu negocio, productos o servicios en internet con una página que refleje tu identidad y ayude a que más personas te conozcan.','#contacto','Quiero saber más'],
  ['menu_digital.png','Menús digitales con QR','Facilita que tus clientes consulten tu menú desde su celular y ofrece una experiencia cómoda y actual para tu restaurante o negocio.','#contacto','Quiero saber más'],
  ['sis_per.png','Sistemas personalizados','Desarrollamos herramientas de acuerdo con las necesidades de tu proyecto para apoyar la organización, la eficiencia y la productividad.','#contacto','Platiquemos tu idea'],
  ['reporte.png','Soluciones para crecer','Analizamos contigo lo que tu negocio necesita y te orientamos para convertir una idea o un reto cotidiano en una oportunidad de mejora.','#contacto','Cuéntanos tu proyecto'],
];
function SectionHeading({ kicker, title, children }) { return <div className="section-heading"><span className="section-kicker">{kicker}</span><h2>{title}</h2>{children && <p>{children}</p>}</div>; }
function Servicios() {
  return <section className="section section-soft" id="servicios"><div className="container"><SectionHeading kicker="Qué hacemos" title="Soluciones para llevar tu negocio al siguiente nivel.">Ya sea que estés comenzando o quieras mejorar la forma en que trabajas, podemos ayudarte a encontrar una solución digital que se adapte a tus objetivos.</SectionHeading><div className="services-grid">{services.map(([image,title,description,href,label]) => {
    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return <article className="service-card" id={`servicio-${slug}`} key={title}><div className="service-icon service-image"><img src={`/${image}`} alt="" loading="lazy" decoding="async"/></div><h3>{title}</h3><p>{description}</p><a className="service-link btn btn-secondary" href={href}>{label} <span>→</span></a></article>;
  })}</div></div></section>;
}

function Identidad() {
  const identity = [['◎','Nuestra misión','Proveer a los negocios locales y talleres herramientas de software de punto de venta accesibles, eficientes y fáciles de usar, que optimicen su administración diaria y les permitan enfocarse en lo más importante: hacer crecer sus ventas y atender a sus clientes.'],['↗','Nuestra visión','Convertirnos en el aliado tecnológico de confianza para los pequeños y medianos comercios, impulsando su modernización mediante sistemas intuitivos que se adapten a las necesidades reales del mercado mexicano.']];
  const values = [['✦','Innovación accesible','Creemos que la tecnología de calidad debe estar al alcance de cualquier negocio, simplificando procesos sin complicarlos.'],['♡','Empatía comercial','Entendemos los retos de talleres y comercios locales. Diseñamos soluciones para resolver problemas reales del día a día.'],['✓','Transparencia','Construimos relaciones basadas en la honestidad, con sistemas claros, funcionales y directos.'],['↗','Compromiso con el crecimiento','Trabajamos para que nuestras soluciones acompañen a los negocios y contribuyan a su desarrollo a largo plazo.']];
  return <section className="section" id="nosotros"><div className="container"><SectionHeading kicker="Lo que nos define" title="Tecnología con propósito.">En CodePOS MX creemos que la tecnología debe ser una herramienta para crecer, no un obstáculo. Por eso creamos soluciones que responden a las necesidades reales de cada negocio.</SectionHeading><div className="identity-grid">{identity.map(([icon,title,text])=><article className="identity-card" key={title}><div className="identity-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div><div className="values-heading"><span className="section-kicker">Nuestros principios</span><h2>Los valores detrás de cada solución.</h2></div><div className="values-grid">{values.map(([icon,title,text])=><article className="value-card" key={title}><div className="value-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

function Beneficios() {
  const benefits = [['ϟ','Más eficiencia','Simplifica tareas y aprovecha mejor tu tiempo.'],['↗','Mayor productividad','Organiza procesos para trabajar de forma más clara.'],['◎','Más visibilidad','Haz que más personas descubran tu negocio en línea.'],['✧','A tu medida','Soluciones pensadas para tus necesidades y objetivos.']];
  return <section className="section"><div className="container"><SectionHeading kicker="Nuestra visión" title="Tecnología que trabaja contigo.">Queremos que las herramientas digitales sean una oportunidad para los negocios, no una complicación.</SectionHeading><div className="benefits">{benefits.map(([icon,title,text])=><div className="benefit" key={title}><div className="benefit-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>;
}

const posViews = [
  { id: 'ventas', label: 'Ventas', icon: '/ventas.jpg' },
  { id: 'inventario', label: 'Inventario', icon: '/inventario.jpg' },
  { id: 'cuentas', label: 'Cuentas', icon: '/cuentas.png' },
  { id: 'reportes', label: 'Reportes', icon: '/166122.png' },
];
const viewCopy = {
  ventas: ['Punto de venta', 'Agrega productos a la venta y consulta el total al instante.'],
  inventario: ['Control de inventario', 'Revisa existencias, precios y productos que necesitan reposición.'],
  cuentas: ['Cuentas por cobrar', 'Consulta saldos pendientes y lleva el seguimiento de tus clientes.'],
  reportes: ['Resumen del negocio', 'Visualiza ventas y actividad para tomar mejores decisiones.'],
};
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function MetricCard({ icon, label, value, detail, accent }) {
  return <article className={`pos-metric${accent ? ' accent' : ''}`}><span className="pos-metric-icon">{icon}</span><div><span className="pos-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

export function DemoPOS() {
  const [business, setBusiness] = useState(null);
  const [activeView, setActiveView] = useState('ventas');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [settledAccounts, setSettledAccounts] = useState([]);
  const [extraSales, setExtraSales] = useState(0);
  const [extraTickets, setExtraTickets] = useState(0);
  const [saleNotice, setSaleNotice] = useState('');
  const catalog = business ? demoCatalogs[business.id] : [];
  const metrics = business ? demoMetrics[business.id] : null;
  const accounts = business ? demoAccounts[business.id] : [];
  const categories = ['Todos', ...new Set(catalog.map(product => product.category))];
  const filteredProducts = catalog.filter(product => {
    const matchesQuery = product.name.toLowerCase().includes(search.toLowerCase()) || product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    return matchesQuery && matchesCategory;
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pendingTotal = accounts.filter(account => !settledAccounts.includes(account.id)).reduce((sum, account) => sum + account.amount, 0);
  const lowStockCount = catalog.filter(product => product.stock !== null && product.stock <= 8).length;
  const quoteUrl = business && `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, me interesa cotizar CodePOS para mi negocio de ${business.name}. Probé la demo y quisiera más información.`)}`;

  const addProduct = (product) => {
    setSaleNotice('');
    setCart(items => {
      const found = items.find(item => item.id === product.id);
      return found ? items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }];
    });
  };
  const changeQuantity = (id, amount) => setCart(items => items.map(item => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0));
  const selectBusiness = (type) => {
    setBusiness(type);
    setActiveView('ventas');
    setCart([]);
    setSearch('');
    setActiveCategory('Todos');
    setSettledAccounts([]);
    setExtraSales(0);
    setExtraTickets(0);
    setSaleNotice('');
  };
  const completeSale = () => {
    if (!cart.length) return;
    setExtraSales(value => value + total);
    setExtraTickets(value => value + 1);
    setCart([]);
    setSaleNotice('Venta de prueba registrada correctamente.');
  };

  return <section className="section demo-section" id="demo">
    <div className="container">
      <SectionHeading kicker="Conoce CodePOS" title="Todo tu negocio, en una sola vista.">
        Explora cómo se conectan ventas, inventario, cuentas y reportes. Elige tu giro y prueba una operación de muestra.
      </SectionHeading>
      <div className="demo-intro"><div><span className="demo-step">01</span><div><strong>Elige tu tipo de negocio</strong><small>Es una prueba interactiva, no el sistema terminado.</small></div></div><span className="demo-sample-label"><span/> DEMO INTERACTIVA</span></div>
      <div className="business-picker" role="group" aria-label="Elige el tipo de negocio">
        {businessTypes.map(type => <button type="button" key={type.id} className={`business-card${business?.id === type.id ? ' selected' : ''}`} onClick={() => selectBusiness(type)} aria-pressed={business?.id === type.id}>
          <span className="business-icon">{type.image ? <img src={type.image} alt=""/> : type.icon}</span><span className="business-card-copy"><strong>{type.name}</strong><small>{type.description}</small></span><span className="business-card-arrow" aria-hidden="true">↗</span>
        </button>)}
      </div>
      {business && <div className="pos-app-frame">
        <div className="pos-app-topbar">
          <div className="pos-brand-lockup"><span className="pos-brand-mark">CP</span><span><strong>CodePOS</strong><small>GESTIÓN DE NEGOCIO</small></span></div>
          <div className="pos-topbar-right"><span className="pos-demo-chip"><span/><span className="demo-chip-full">Prototipo · No es el sistema final</span><span className="demo-chip-short">Prototipo</span></span><button type="button" className="pos-business-switch" onClick={() => setBusiness(null)}><span className="switch-full">Cambiar giro</span><span className="switch-short">Giro</span><span>⌄</span></button><span className="pos-avatar" aria-label="Usuario de prueba">CP</span></div>
        </div>
        <div className="pos-app-layout">
          <aside className="pos-sidebar">
            <div className="pos-store-card"><span className="pos-store-icon">{business.icon}</span><span><strong>{business.name}</strong><small>Sucursal principal</small></span><span className="pos-chevron">⌄</span></div>
            <span className="pos-nav-label">MENÚ PRINCIPAL</span>
            <nav className="pos-side-nav" aria-label="Secciones de la demo">
              {posViews.map(view => <button type="button" key={view.id} className={activeView === view.id ? 'active' : ''} onClick={() => { setActiveView(view.id); setSaleNotice(''); }} aria-current={activeView === view.id ? 'page' : undefined}><span className="pos-side-icon"><img src={view.icon} alt=""/></span>{view.label}{view.id === 'inventario' && lowStockCount > 0 && <small className="pos-nav-count">{lowStockCount}</small>}</button>)}
            </nav>
            <div className="pos-cash-status"><span className="cash-status-dot"/><span><strong>Caja abierta</strong><small>Lista para vender</small></span><span className="cash-status-icon">⌁</span></div>
            <div className="pos-sidebar-foot">CodePOS MX <span>·</span> Demo</div>
          </aside>
          <div className="pos-workspace">
            <div className="pos-page-heading"><div><span className="pos-eyebrow">PANEL DE CONTROL <span>·</span> {business.name.toUpperCase()}</span><h3>{viewCopy[activeView][0]}</h3><p>{viewCopy[activeView][1]}</p></div><div className="pos-date"><span>◷</span> Operación de hoy</div></div>
            <div className="pos-metrics-grid">
              <MetricCard icon="$" label="Ventas de hoy" value={money(metrics.sales + extraSales)} detail={`${metrics.tickets + extraTickets} tickets registrados`} accent/>
              <MetricCard icon="▦" label="Productos" value={catalog.length} detail={`${lowStockCount} por reponer`}/>
              <MetricCard icon="◎" label="Cuentas abiertas" value={accounts.length - settledAccounts.length} detail={`${money(pendingTotal)} por cobrar`}/>
              <MetricCard icon="⌁" label="Efectivo en caja" value={money(metrics.cash + extraSales)} detail="Caja abierta"/>
            </div>
            {activeView === 'ventas' && <div className="pos-sales-layout">
              <div className="pos-panel pos-catalog-panel">
                <div className="pos-panel-heading"><div><h4>Productos y servicios</h4><p>Selecciona un artículo para agregarlo a la venta.</p></div><span className="pos-item-count">{filteredProducts.length} artículos</span></div>
                <label className="pos-search"><span>⌕</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar producto o código…" aria-label="Buscar productos"/><kbd>⌘ K</kbd></label>
                <div className="pos-category-list" aria-label="Filtrar por categoría">{categories.map(category => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
                <div className="pos-products">
                  {filteredProducts.map((product, index) => <button className="pos-product" key={product.id} type="button" onClick={() => addProduct(product)}>
                    <span className={`pos-product-symbol pos-product-tone-${index % 4}`}>{product.category === 'Servicio' || product.category === 'Consulta' ? '✳' : '▦'}</span><span className="pos-product-info"><small>{product.category}</small><strong>{product.name}</strong><span>{product.sku}</span></span><span className="pos-product-buy"><strong>{money(product.price)}</strong><span>＋ Agregar</span></span>
                  </button>)}
                  {!filteredProducts.length && <div className="pos-empty-search"><span>⌕</span><strong>No encontramos ese artículo</strong><small>Prueba otra búsqueda o categoría.</small></div>}
                </div>
              </div>
              <aside className="pos-panel pos-cart-panel">
                <div className="pos-panel-heading"><div><h4>Venta actual</h4><p>Ticket <strong>#CP-0048</strong></p></div><button type="button" className="pos-clear-cart" onClick={() => setCart([])} disabled={!cart.length}>Limpiar</button></div>
                <div className="pos-ticket-label"><span>ARTÍCULO</span><span>CANT.</span><span>IMPORTE</span></div>
                {cart.length ? <div className="cart-items">{cart.map(item => <div className="cart-row" key={item.id}><div className="cart-product-copy"><strong>{item.name}</strong><small>{money(item.price)} por unidad</small></div><div className="quantity-control"><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Quitar una unidad de ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Agregar una unidad de ${item.name}`}>+</button></div><strong className="cart-line-total">{money(item.price * item.quantity)}</strong></div>)}</div> : <div className="cart-empty"><span>＋</span><strong>Tu venta comienza aquí</strong><small>Agrega productos desde el catálogo para ver el total.</small></div>}
                <div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Impuestos</span><small>Incluidos en los precios</small></div><div className="cart-total"><span>Total a cobrar</span><strong>{money(total)}</strong></div></div>
                {saleNotice && <p className="pos-success-message" role="status">✓ {saleNotice}</p>}
                <button className="pos-charge-button" type="button" onClick={completeSale} disabled={!cart.length}>Cobrar venta <strong>{money(total)} <span>→</span></strong></button>
                <p className="pos-secure-note">◈ Operación local de demostración</p>
              </aside>
            </div>}
            {activeView === 'inventario' && <div className="pos-panel pos-data-panel"><div className="pos-panel-heading"><div><h4>Existencias de productos</h4><p>Consulta tu catálogo y detecta lo que conviene reponer.</p></div><span className="pos-item-count">{catalog.length} registros</span></div><div className="pos-table-wrap"><table className="pos-table"><thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>SKU</th><th>EXISTENCIA</th><th>PRECIO</th></tr></thead><tbody>{catalog.map(product => <tr key={product.id}><td><span className="pos-table-product-icon">{product.category === 'Servicio' || product.category === 'Consulta' ? '✳' : '▦'}</span><strong>{product.name}</strong></td><td>{product.category}</td><td className="pos-sku">{product.sku}</td><td>{product.stock === null ? <span className="stock-service">Servicio</span> : <span className={`stock-badge${product.stock <= 8 ? ' low' : ''}`}><span/>{product.stock} unidades</span>}</td><td className="pos-price-cell">{money(product.price)}</td></tr>)}</tbody></table></div><div className="pos-inventory-foot"><span><i className="stock-dot-ready"/> Existencia suficiente</span><span><i className="stock-dot-low"/> Requiere atención</span><small>Los datos mostrados son de ejemplo.</small></div></div>}
            {activeView === 'cuentas' && <div className="pos-panel pos-data-panel"><div className="pos-panel-heading"><div><h4>Seguimiento de saldos</h4><p>Ten a la vista lo pendiente y registra pagos en la demo.</p></div><span className="pos-item-count">{accounts.length - settledAccounts.length} cuentas abiertas</span></div><div className="pos-account-list">{accounts.map(account => { const settled = settledAccounts.includes(account.id); return <article className={`pos-account-row${settled ? ' settled' : ''}`} key={account.id}><span className="account-avatar">{account.customer.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div className="pos-account-name"><strong>{account.customer}</strong><small>{account.detail}</small></div><span className={`account-due${account.due === 'Hoy' ? ' today' : ''}`}>{settled ? 'Pagada' : account.due}</span><strong className="account-amount">{settled ? money(0) : money(account.amount)}</strong><button type="button" className="account-action" onClick={() => setSettledAccounts(ids => settled ? ids.filter(id => id !== account.id) : [...ids, account.id])}>{settled ? 'Deshacer' : 'Marcar pagada'}</button></article>; })}</div><div className="pos-account-summary"><span><span className="account-summary-icon">◎</span><span><small>Total pendiente</small><strong>{money(pendingTotal)}</strong></span></span><span className="pos-summary-note">Cuentas de muestra · Sin conexión a banco</span></div></div>}
            {activeView === 'reportes' && <div className="pos-reports-grid"><div className="pos-panel pos-chart-panel"><div className="pos-panel-heading"><div><h4>Ventas de la semana</h4><p>Actividad diaria · últimos 7 días</p></div><span className="pos-report-period">Esta semana⌄</span></div><div className="pos-chart-legend"><span><i/> Ventas</span><strong>{money(metrics.sales + extraSales)}</strong></div><div className="pos-bar-chart" role="img" aria-label="Gráfica de ventas de los últimos siete días">{metrics.trend.map((height, index) => <div className="pos-bar-column" key={weekDays[index]}><div className="pos-bar-track"><span className={index === metrics.trend.length - 1 ? 'today' : ''} style={{ height: `${height}%` }}/></div><small>{weekDays[index]}</small></div>)}</div></div><div className="pos-panel pos-report-summary"><div className="pos-panel-heading"><div><h4>Tu operación</h4><p>Resumen de hoy</p></div><span className="report-spark">↗</span></div><div className="report-stat"><span>Ventas registradas</span><strong>{metrics.tickets + extraTickets}</strong><small>tickets</small></div><div className="report-stat"><span>Ticket promedio</span><strong>{money((metrics.sales + extraSales) / Math.max(metrics.tickets + extraTickets, 1))}</strong><small>por venta</small></div><div className="report-stat"><span>Inventario bajo</span><strong>{lowStockCount}</strong><small>artículos por revisar</small></div></div></div>}
            <div className="pos-data-disclaimer"><span>ⓘ</span> Prototipo de prueba, no es el trabajo terminado. Los datos son ficticios y la versión final se definiría contigo.</div>
            <a className="pos-quote-strip" href={quoteUrl} target="_blank" rel="noopener noreferrer">
              <span className="pos-quote-icon">↗</span>
              <span className="pos-quote-copy"><strong>¿Te gustó cómo funciona?</strong><small>Platiquemos sobre una solución para tu negocio.</small></span>
              <strong className="pos-quote-action">Cotiza CodePOS <span>→</span></strong>
            </a>
          </div>
        </div>
      </div>}
      <div className="demo-trust-row"><span>✓ Sin registro</span><span>✓ Sin backend</span><span>✓ Prueba a tu ritmo</span></div>
    </div>
  </section>;
}

function Contacto() {
  return <section className="section section-soft" id="contacto"><div className="container"><div className="contact-panel"><div><span className="section-kicker">Hagamos equipo</span><h2>¿Tienes una idea?<br/>Hablemos.</h2><p>Cuéntanos qué quieres crear o qué te gustaría mejorar en tu negocio. Nos encantará conocer tu proyecto y explorar cómo podemos ayudarte.</p><small className="contact-privacy">Al contactarnos, consulta nuestro <a href="/legal.html#privacidad">aviso de privacidad</a>.</small></div><div className="contact-links"><a className="contact-link" href="mailto:codeposmx@gmail.com?subject=Informaci%C3%B3n%20sobre%20CodePOS%20MX"><span className="contact-icon">✉</span><span><small>Escríbenos por correo</small><strong>codeposmx@gmail.com</strong></span></a><a className="contact-link" href="https://www.instagram.com/codeposmx/?hl=es-lam" target="_blank" rel="noopener noreferrer"><span className="contact-icon">◎</span><span><small>Síguenos en Instagram</small><strong>@codeposmx</strong></span></a><a className="contact-link" href="https://www.facebook.com/profile.php?id=61595543454633" target="_blank" rel="noopener noreferrer"><span className="contact-icon">f</span><span><small>Encuéntranos en Facebook</small><strong>CodePOS MX</strong></span></a><a className="contact-link" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"><span className="contact-icon">W</span><span><small>Escríbenos por WhatsApp</small><strong>+52 1 55 7423 2439</strong></span></a></div></div></div></section>;
}

export function Footer({ homePath = "" }) { return <footer><div className="container footer-inner"><Brand homeHref={`${homePath}#inicio`}/><span>© {new Date().getFullYear()} CodePOS MX. Todos los derechos reservados.</span><div className="footer-social"><a href="https://www.instagram.com/codeposmx/?hl=es-lam" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.facebook.com/profile.php?id=61595543454633" target="_blank" rel="noopener noreferrer">Facebook</a><a href="mailto:codeposmx@gmail.com">Correo</a></div><nav className="footer-legal-links" aria-label="Información legal"><a href="/legal.html#privacidad">Privacidad</a><a href="/legal.html#terminos">Términos</a><a href="/legal.html#cookies">Cookies</a><button type="button" onClick={() => window.dispatchEvent(new Event('codepos:open-cookie-notice'))}>Preferencias</button></nav></div></footer>; }

export default function App() {
  useRevealOnScroll();
  return <><Navbar/><main><Hero/><Historia/><Servicios/><Identidad/><Beneficios/><DemoPOS/><Contacto/></main><Footer/><CookieNotice/></>;
}
