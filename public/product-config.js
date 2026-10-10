'use strict';

// Configuración pública. Solo números autorizados para demos, con lada y sin +.
// null mantiene el acceso deshabilitado; nunca se usa un número de otro giro.
window.KACHO_CONFIG = {
  // hola@ es un alias de la cuenta admin (KAC-5). El WhatsApp comercial sigue pendiente.
  contact: { whatsapp: null, email: 'hola@kachobot.com' },
  demoNumbers: {
    materiales: null, construccion: null, ecommerce: null, muebles: null,
    inmobiliaria: null, automotriz: null, solar: null, industrial: null,
    educacion: null, eventos: null
  },
  // Completar únicamente con tarifas aprobadas para publicación.
  pricing: { setupMXN: null, monthlyMXN: null }
};
