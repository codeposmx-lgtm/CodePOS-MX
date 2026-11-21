---
name: CodePOS MX
description: Tecnología útil para negocios locales mexicanos, mostrada con claridad de cristal.
colors:
  brand-blue: "#176be8"
  kicker-blue: "#175fca"
  eyebrow-blue: "#155cbd"
  navy-ink: "#07162f"
  navy-deep: "#091a35"
  navy-panel: "#123769"
  body-slate: "#172b4d"
  muted-slate: "#5d6d84"
  copy-slate: "#586981"
  nav-slate: "#41516b"
  pale-blue: "#edf5ff"
  soft-surface: "#f7f9fc"
  hairline: "#e2eaf5"
  card-border: "#e4eaf2"
  white: "#ffffff"
  success-green: "#1a9a72"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(3.05rem, 6vw, 5.15rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.065em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2.2rem, 4.2vw, 3.35rem)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.055em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 700
    letterSpacing: "-0.035em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.69rem"
    fontWeight: 700
    letterSpacing: "0.15em"
  data:
    fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.58rem"
rounded:
  sm: "10px"
  md: "13px"
  lg: "18px"
  xl: "24px"
  art: "28px"
  pill: "999px"
spacing:
  section: "104px"
  section-tablet: "82px"
  section-mobile: "70px"
  gutter: "20px"
  card: "25px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "13px 21px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.pill}"
    padding: "13px 21px"
  card-service:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  chip-eyebrow:
    backgroundColor: "{colors.pale-blue}"
    textColor: "{colors.eyebrow-blue}"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
  panel-contact:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "58px"
---

# Design System: CodePOS MX

## Overview

**Creative North Star: "Mostrador de cristal"**

Un mostrador limpio donde todo lo que ofrece el negocio se ve a la primera. El sistema combina un azul marino profundo, que da peso y confianza, con un azul brillante que marca lo accionable, sobre superficies blancas y casi blancas con un leve tinte azul. Las piezas que flotan sobre el contenido (barra de navegación, tarjeta del hero, etiquetas flotantes, menú desplegable) son de vidrio translúcido: dejan ver lo que hay detrás, igual que el producto deja ver con claridad qué obtiene el cliente.

La densidad es cómoda y respirada: secciones amplias (104px), tarjetas con aire interior y texto de lectura a 1.7–1.95 de interlineado. Los componentes son amables y táctiles: esquinas redondeadas, botones en forma de píldora y una elevación ligera al pasar el mouse. El movimiento es contenido: entradas suaves al hacer scroll y una deriva lenta en las etiquetas del hero.

**Key Characteristics:**
- Marino profundo para títulos y paneles; azul brillante solo para acción y acento.
- Vidrio translúcido (backdrop-filter con blur y saturación) reservado a capas flotantes.
- Tipografía del sistema, pesada en títulos con tracking negativo marcado.
- Esquinas generosas y botones píldora; nada de esquinas vivas.
- Sombras azuladas y difusas, nunca negras.

## Colors

Una paleta de un solo acento: azules sobre blancos fríos, con el marino como ancla.

### Primary
- **Azul CodePOS** (brand-blue): botones primarios, enlaces de servicio, iconos de acento, la palabra "MX" del logotipo y el énfasis del titular del hero. Es el único color que pide clic.
- **Azul rótulo** (kicker-blue) y **Azul etiqueta** (eyebrow-blue): variantes un paso más oscuras del acento para rótulos de sección en mayúsculas y la píldora sobre el titular, donde el texto es pequeño y necesita más contraste.

### Neutral
- **Tinta marina** (navy-ink): titulares, marca, texto de componentes. También es el `theme-color` del sitio.
- **Marino profundo → Marino panel** (navy-deep → navy-panel): degradado a 120° del panel de contacto, la única superficie oscura grande de la portada.
- **Pizarra** (body-slate): color base del texto.
- **Pizarra suave** (muted-slate, copy-slate, nav-slate): párrafos secundarios, texto del hero y enlaces de navegación.
- **Azul pálido** (pale-blue): fondos de iconos y chips.
- **Superficie suave** (soft-surface): fondo de secciones alternas, en un degradado vertical casi imperceptible.
- **Filete** (hairline, card-border): bordes de tarjetas y divisores de 1px.
- **Verde estado** (success-green): solo para la píldora de estado "en línea" del hero y mensajes de éxito de la demo.

### Named Rules
**La regla del único acento.** El azul CodePOS marca lo que se puede hacer; no se usa como relleno decorativo de superficies grandes. Un segundo color de acento no forma parte del sistema.

**La regla del azul en las sombras.** Toda sombra se tiñe de marino (`rgba(7,22,47,…)` o `rgba(13,34,66,…)`) o de azul de marca; nunca negro puro.

## Typography

**Display Font:** San Francisco en Mac, iPhone y iPad (fuente del sistema); Inter en Windows, Android y Linux (incluida en el sitio, `src/fonts.css`)
**Body Font:** la misma pila
**Label/Mono Font:** SF Mono / ui-monospace, solo para números de índice del menú de servicios

**Character:** Una sola familia que se vuelve expresiva por peso y tracking: titulares en 700 con letras muy juntas, cuerpo regular con interlineado amplio. En Apple se siente nativa (San Francisco); en el resto, Inter da un dibujo muy parecido y consistente entre Windows y Android, en lugar de Segoe UI o Roboto.

### Hierarchy
- **Display** (700, clamp(3.05rem, 6vw, 5.15rem), 1.06, -0.065em): solo el titular del hero.
- **Headline** (700, clamp(2.2rem, 4.2vw, 3.35rem), 1.14, -0.055em): títulos de sección.
- **Title** (700, ~1.04rem, -0.035em): títulos de tarjetas de servicio, misión y valores.
- **Body** (400, 1.08rem en el hero, 0.86–1rem en tarjetas, interlineado 1.7–1.95): párrafos, con ancho máximo de ~540–570px en el hero.
- **Label** (700, 0.69rem, 0.15em, MAYÚSCULAS): rótulos de sección sobre los títulos.

### Named Rules
**La regla del tracking negativo.** Cuanto más grande es el título, más juntas van las letras (de -0.03em en tarjetas a -0.065em en el hero). El cuerpo de texto nunca lleva tracking negativo.

## Layout

Contenedor centrado de `min(1120px, 100% - 40px)`; en celular, `min(100% - 30px, 540px)`. El hero es una rejilla de dos columnas (1.08fr / .92fr, separación 66px) con el texto a la izquierda y la ilustración de vidrio a la derecha. Las secciones alternan blanco y superficie suave, con 104px de padding vertical (82px en tablet, 70px en celular). Los servicios van en rejilla de 3 columnas (2 en tablet, 1 en celular) y los valores en 4 (2 y luego 1).

Puntos de quiebre: 900px (tablet), 700px (celular: el menú se vuelve desplegable y el hero pasa a una columna), 600px (misión y valores en una columna) y 390px (ajustes finos del hero).

## Elevation & Depth

Sistema híbrido: superficies planas en reposo con sombras suaves y azuladas, más una capa de vidrio translúcido para todo lo que flota. La profundidad se comunica por desenfoque (blur 22–32px con saturación 170–190%), por brillos internos blancos (`inset`) y por sombras difusas de gran radio.

### Shadow Vocabulary
- **Reposo de tarjeta** (`box-shadow: 0 2px 8px rgba(13,34,66,.025)`): tarjetas de servicio, misión y valores.
- **Elevación al hover** (`box-shadow: 0 16px 36px rgba(13,34,66,.075)`): las mismas tarjetas al pasar el mouse, junto con `translateY(-3px)`.
- **Botón primario** (`box-shadow: 0 9px 22px rgba(22,119,255,.2)`): halo azul bajo el botón; crece a `0 13px 28px … .25` en hover.
- **Vidrio flotante** (`box-shadow: 0 14px 38px rgba(7,22,47,.1), 0 1px 0 rgba(255,255,255,.98) inset`): barra de navegación, tarjeta del hero, etiquetas y menú desplegable.

### Named Rules
**La regla del vidrio solo para lo que flota.** El efecto translúcido se reserva a capas que están sobre otro contenido (navegación, hero, desplegables). Las tarjetas de contenido son blancas y sólidas. Con `prefers-reduced-transparency` el vidrio se vuelve casi opaco.

## Shapes

Formas suaves y generosas. Botones, chips y la barra de navegación de escritorio son píldoras (999px). Las tarjetas usan 18px; el panel de contacto, 24px; la tarjeta del hero y la imagen de "Quiénes somos", 28px; los iconos, 10–17px. Los bordes son filetes de 1px en tonos azul grisáceo muy claros. Los círculos (el orbe del hero y los anillos decorativos) son el único motivo geométrico recurrente.

## Components

### Buttons
Píldoras amables que se elevan un poco al tocarlas.
- **Shape:** píldora (999px).
- **Primary:** fondo azul CodePOS, texto blanco, 13px × 21px, 0.84rem en peso 700 con tracking -0.015em, halo azul debajo.
- **Hover / Focus:** sube 2px y el halo crece; la flecha interior se desplaza 3px a la derecha. Foco visible con un contorno azul translúcido de 3px separado 3px.
- **Secondary:** fondo blanco, texto marino y borde de 1px `#dce6f3`.

### Chips
- **Style:** la píldora sobre el titular del hero: fondo azul pálido translúcido, texto azul etiqueta, borde azul claro y un punto azul con halo.

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** blanco sólido.
- **Shadow Strategy:** reposo de tarjeta y elevación al hover (ver Elevation & Depth).
- **Border:** 1px card-border; pasa a `#c8d9ef` en hover.
- **Internal Padding:** 25px en servicios; 30px en misión y visión; 24px en valores.

### Navigation
Barra pegajosa con dos capas de vidrio: una franja translúcida a todo lo ancho y, dentro, una píldora de vidrio con los enlaces. Enlaces en 0.84rem, peso 500, color nav-slate, que pasan al azul en hover. El menú "Servicios" abre un panel de vidrio de 548px con una rejilla de 2 columnas, números en monoespaciada y flechas que se desplazan en hover. En celular la píldora se vuelve un rectángulo de 19px de radio y los enlaces pasan a un panel desplegable de vidrio.

### Hero glass showcase
La pieza firma del sitio: una tarjeta de vidrio inclinada -1° sobre un orbe azul pálido que "respira", con un mini panel de cuatro soluciones y dos etiquetas flotantes que derivan lentamente en las esquinas.

### Contact panel
El único bloque oscuro grande: degradado marino a 120°, anillos concéntricos translúcidos en la esquina y enlaces de contacto como filas de vidrio claro que se desplazan 3px en hover.

## Do's and Don'ts

### Do:
- **Do** usar el azul CodePOS solo para acciones, enlaces y acentos pequeños.
- **Do** teñir todas las sombras de marino o de azul de marca.
- **Do** reservar el vidrio translúcido para capas flotantes y dar un respaldo opaco con `prefers-reduced-transparency`.
- **Do** mantener las esquinas redondeadas: 18px en tarjetas y píldora en botones.
- **Do** respetar `prefers-reduced-motion`: las animaciones de entrada y deriva se desactivan.

### Don't:
- **Don't** introducir un segundo color de acento ni degradados morado-azul.
- **Don't** usar sombras negras ni esquinas vivas en componentes.
- **Don't** aplicar el efecto de vidrio a tarjetas de contenido o a bloques de texto largos.
- **Don't** usar tracking negativo en texto de lectura.
