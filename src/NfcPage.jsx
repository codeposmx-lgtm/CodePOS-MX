import { createElement, useEffect, useMemo } from 'react';
import nfcDocument from './pages/nfc-content.html?raw';
import useRevealOnScroll from './useRevealOnScroll.js';
import CookieNotice from './CookieNotice.jsx';
import { Navbar } from './Navbar.jsx';
import '../nfc.css';

const attributeNames = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan', cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', viewbox: 'viewBox',
};
const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function renderNode(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE || node.tagName.toLowerCase() === 'script') return null;
  const tag = node.tagName.toLowerCase();
  const props = { key };
  for (const attribute of node.attributes) {
    const name = attributeNames[attribute.name.toLowerCase()] || attribute.name;
    if (name === 'className' && !attribute.value) continue;
    props[name] = ['required', 'disabled', 'multiple', 'checked', 'selected', 'autofocus'].includes(attribute.name.toLowerCase())
      ? true
      : attribute.value;
  }
  const children = tag === 'textarea'
    ? undefined
    : voidElements.has(tag)
      ? undefined
      : Array.from(node.childNodes).map((child, index) => renderNode(child, `${key}-${index}`));
  if (tag === 'textarea') props.defaultValue = node.textContent;
  return createElement(tag, props, ...(children ? [children] : []));
}


function NfcSection({ node, index }) { return renderNode(node, `nfc-section-${index}`); }
function NfcMain({ node }) {
  return <main>{Array.from(node.childNodes).map((child, index) => (
    child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'section'
      ? <NfcSection key={`section-${index}`} node={child} index={index} />
      : renderNode(child, `main-${index}`)
  ))}</main>;
}
function NfcFooter({ node }) { return renderNode(node, 'nfc-footer'); }

// Enlaces propios de la página NFC en la barra compartida. "contacto" no tiene
// enlace (es el botón), pero se sigue para dejar de marcar al llegar a esa sección.
const nfcLinks = [
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'preguntas', label: 'Preguntas frecuentes' },
];
const nfcSpySections = [...nfcLinks.map(link => link.id), 'contacto'];
const nfcCta = { href: '#contacto', label: 'Cotizar mi tarjetero', icon: '→' };

export default function NfcPage() {
  useRevealOnScroll();
  const bodyNodes = useMemo(() => {
    const document = new DOMParser().parseFromString(nfcDocument, 'text/html');
    return Array.from(document.body.childNodes).filter((node) => !(node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'script'));
  }, []);

  useEffect(() => {
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
    const select = document.getElementById('interest');
    const interestLinks = Array.from(document.querySelectorAll('[data-interest]'));
    const interestHandlers = interestLinks.map((link) => {
      const handler = () => {
        const target = link.getAttribute('data-interest');
        if (select && Array.from(select.options).some((option) => option.text === target)) select.value = target;
      };
      link.addEventListener('click', handler);
      return [link, handler];
    });
    const form = document.getElementById('contactForm');
    const sendEmail = (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const subject = encodeURIComponent(`Información sobre tarjeteros NFC/QR - ${formData.get('interest')}`);
      const body = encodeURIComponent(`Hola CodePOS MX,\n\nMe interesa recibir información sobre: ${formData.get('interest')}.\n\nNombre: ${formData.get('name')}\nNegocio: ${formData.get('business') || 'No indicado'}\nDetalles: ${formData.get('message') || 'Me gustaría conocer las opciones disponibles.'}\n\nEnviado desde la página de tarjeteros NFC y QR.`);
      window.location.href = `mailto:codeposmx@gmail.com?subject=${subject}&body=${body}`;
    };
    form?.addEventListener('submit', sendEmail);
    return () => {
      interestHandlers.forEach(([link, handler]) => link.removeEventListener('click', handler));
      form?.removeEventListener('submit', sendEmail);
    };
  }, []);

  return <>{bodyNodes.map((node, index) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return renderNode(node, `nfc-${index}`);
    const tag = node.tagName.toLowerCase();
    if (tag === 'header') return <Navbar key={`nfc-${index}`} homePath="/" links={nfcLinks} spySections={nfcSpySections} cta={nfcCta} menuFromTablet />;
    if (tag === 'main') return <NfcMain key={`nfc-${index}`} node={node} />;
    if (tag === 'footer') return <NfcFooter key={`nfc-${index}`} node={node} />;
    return renderNode(node, `nfc-${index}`);
  })}<CookieNotice/></>;
}
