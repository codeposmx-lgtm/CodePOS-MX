export const businessTypes = [
  { id: 'abarrotes', name: 'Abarrotes', image: '/abarrotes.png', description: 'Caja e inventario de tienda' },
  { id: 'taller', name: 'Taller Mecánico', image: '/tallermecanico.png', description: 'Servicios y refacciones' },
  { id: 'restaurante', name: 'Restaurante', image: '/restuarante.png', description: 'Pedidos, platillos y bebidas' },
  { id: 'consultorio', name: 'Consultorio', image: '/salud.png', description: 'Servicios y control de insumos' },
];

export const demoCatalogs = {
  abarrotes: [
    { id: 'leche', name: 'Leche entera 1 L', price: 28, category: 'Lácteos', sku: 'AB-001', stock: 6 },
    { id: 'pan', name: 'Pan de caja', price: 42, category: 'Panadería', sku: 'AB-002', stock: 18 },
    { id: 'huevo', name: 'Huevo (docena)', price: 48, category: 'Abarrotes', sku: 'AB-003', stock: 24 },
    { id: 'arroz', name: 'Arroz 1 kg', price: 32, category: 'Abarrotes', sku: 'AB-004', stock: 13 },
    { id: 'agua', name: 'Agua 1.5 L', price: 18, category: 'Bebidas', sku: 'AB-005', stock: 31 },
    { id: 'aceite', name: 'Aceite 1 L', price: 46, category: 'Abarrotes', sku: 'AB-006', stock: 9 },
  ],
  taller: [
    { id: 'aceite-motor', name: 'Cambio de aceite', price: 850, category: 'Servicio', sku: 'TM-001', stock: null },
    { id: 'afinacion', name: 'Afinación básica', price: 1450, category: 'Servicio', sku: 'TM-002', stock: null },
    { id: 'filtro', name: 'Filtro de aceite', price: 180, category: 'Refacciones', sku: 'TM-003', stock: 7 },
    { id: 'diagnostico', name: 'Diagnóstico', price: 350, category: 'Servicio', sku: 'TM-004', stock: null },
    { id: 'balatas', name: 'Balatas delanteras', price: 1200, category: 'Refacciones', sku: 'TM-005', stock: 4 },
    { id: 'bujias', name: 'Juego de bujías', price: 620, category: 'Refacciones', sku: 'TM-006', stock: 12 },
  ],
  restaurante: [
    { id: 'hamburguesa', name: 'Hamburguesa clásica', price: 125, category: 'Platillos', sku: 'RE-001', stock: 18 },
    { id: 'pizza', name: 'Pizza personal', price: 145, category: 'Platillos', sku: 'RE-002', stock: 11 },
    { id: 'ensalada', name: 'Ensalada de la casa', price: 98, category: 'Platillos', sku: 'RE-003', stock: 8 },
    { id: 'cafe', name: 'Café americano', price: 42, category: 'Bebidas', sku: 'RE-004', stock: 26 },
    { id: 'agua-fresca', name: 'Agua fresca', price: 35, category: 'Bebidas', sku: 'RE-005', stock: 3 },
    { id: 'postre', name: 'Pastel del día', price: 68, category: 'Postres', sku: 'RE-006', stock: 5 },
  ],
  consultorio: [
    { id: 'consulta', name: 'Consulta general', price: 500, category: 'Consulta', sku: 'CO-001', stock: null },
    { id: 'seguimiento', name: 'Consulta seguimiento', price: 350, category: 'Consulta', sku: 'CO-002', stock: null },
    { id: 'curacion', name: 'Curación', price: 220, category: 'Procedimiento', sku: 'CO-003', stock: 9 },
    { id: 'presion', name: 'Toma de presión', price: 80, category: 'Procedimiento', sku: 'CO-004', stock: 2 },
    { id: 'certificado', name: 'Certificado médico', price: 300, category: 'Documento', sku: 'CO-005', stock: null },
    { id: 'prueba', name: 'Prueba rápida', price: 180, category: 'Insumos', sku: 'CO-006', stock: 15 },
  ],
};

export const demoMetrics = {
  abarrotes: { sales: 6840, tickets: 42, cash: 3920, pending: 1350, customers: 4, trend: [38, 55, 46, 68, 51, 82, 64] },
  taller: { sales: 12850, tickets: 9, cash: 8250, pending: 4200, customers: 3, trend: [28, 43, 39, 72, 58, 84, 69] },
  restaurante: { sales: 9260, tickets: 37, cash: 5180, pending: 890, customers: 2, trend: [55, 44, 63, 50, 79, 68, 92] },
  consultorio: { sales: 4750, tickets: 11, cash: 3200, pending: 1500, customers: 3, trend: [42, 54, 47, 72, 61, 82, 58] },
};

export const demoAccounts = {
  abarrotes: [
    { id: 'cuenta-1', customer: 'María López', detail: 'Compra de abarrotes · 12 nov', amount: 420, due: 'Hoy' },
    { id: 'cuenta-2', customer: 'Abarrotes El Sol', detail: 'Pedido a crédito · 14 nov', amount: 650, due: 'Mañana' },
    { id: 'cuenta-3', customer: 'José Ramírez', detail: 'Compra de tienda · 15 nov', amount: 280, due: 'En 3 días' },
  ],
  taller: [
    { id: 'cuenta-1', customer: 'Laura Méndez', detail: 'Afinación · Orden #1042', amount: 1800, due: 'Hoy' },
    { id: 'cuenta-2', customer: 'Carlos Ortiz', detail: 'Refacciones · Orden #1038', amount: 1450, due: 'Mañana' },
    { id: 'cuenta-3', customer: 'Transportes Luna', detail: 'Servicio · Orden #1029', amount: 950, due: 'En 3 días' },
  ],
  restaurante: [
    { id: 'cuenta-1', customer: 'Mesa 04', detail: 'Cuenta abierta · 5 productos', amount: 540, due: 'En servicio' },
    { id: 'cuenta-2', customer: 'Mesa 08', detail: 'Cuenta abierta · 3 productos', amount: 350, due: 'En servicio' },
  ],
  consultorio: [
    { id: 'cuenta-1', customer: 'Ana Torres', detail: 'Consulta general · 15 nov', amount: 500, due: 'Hoy' },
    { id: 'cuenta-2', customer: 'Roberto Díaz', detail: 'Estudio clínico · 15 nov', amount: 680, due: 'Mañana' },
    { id: 'cuenta-3', customer: 'Elena Cruz', detail: 'Consulta seguimiento · 16 nov', amount: 320, due: 'En 3 días' },
  ],
};
