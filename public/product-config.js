'use strict';

// Configuración pública. Solo números autorizados para demos, con lada y sin +.
// null mantiene el acceso deshabilitado; nunca se usa un número de otro giro.
window.KACHO_CONFIG = {
  contact: { whatsapp: null, email: null },
  demoNumbers: {
    materiales: null, construccion: null, ecommerce: null, muebles: null,
    inmobiliaria: null, automotriz: null, solar: null, industrial: null,
    educacion: null, eventos: null
  },
  // Completar únicamente con tarifas aprobadas para publicación.
  pricing: { setupMXN: null, monthlyMXN: null }
};
