// scripts.js - DecoHogar (VERSIÓN ULTRA-ROBUSTA)
// ✅ Event Delegation en el panel completo
// ✅ Botones +/- GARANTIZADOS funcionando

// ===== REGISTRO DEL SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js');
      console.log('✅ Service Worker registrado:', reg.scope);
    } catch (err) {
      console.error('❌ Error al registrar Service Worker:', err);
    }
  });
}

// ===== PWA - INSTALACIÓN =====
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btnInstalar = document.getElementById('btn-instalar');
  if (btnInstalar) {
    btnInstalar.style.display = 'inline-block';
  }
});

const btnInstalar = document.getElementById('btn-instalar');
if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    btnInstalar.style.display = 'none';
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log(choice.outcome === 'accepted' ? '✅ App instalada' : '❌ Instalación cancelada');
    deferredPrompt = null;
  });
}

// ===== UTILIDADES =====
function formatMXN(value) {
  return value.toLocaleString('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    maximumFractionDigits: 0 
  });
}

// ===== TOAST NOTIFICACIONES =====
function crearToast(mensaje, tipo = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('visible'), 50);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// ===== CARRITO DE COMPRAS (ULTRA-ROBUSTA) =====
class CarritoCompras {
  constructor() {
    this.items = this.cargarCarrito();
    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.renderizarCarrito();
    this.actualizarContador();
  }

  cacheDOM() {
    this.btnToggle = document.getElementById('toggle-carrito');
    this.panel = document.getElementById('carrito-panel');
    this.contenedorItems = document.getElementById('carrito-items');
    this.countEl = document.getElementById('cart-count');
    this.totalEl = document.getElementById('total-precio');
    this.btnVaciar = document.getElementById('vaciar-carrito');
    this.btnFinalizar = document.getElementById('finalizar-compra');
    this.btnCerrar = document.getElementById('cerrar-carrito');
  }

  bindEvents() {
    // Botón toggle carrito
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePanel();
      });
    }

    // Botón cerrar
    if (this.btnCerrar) {
      this.btnCerrar.addEventListener('click', () => this.cerrarPanel());
    }

    // Botón vaciar
    if (this.btnVaciar) {
      this.btnVaciar.addEventListener('click', () => this.vaciarCarrito());
    }

    // Botón finalizar compra
    if (this.btnFinalizar) {
      this.btnFinalizar.addEventListener('click', () => this.finalizarCompra());
    }

    // Botones "Agregar al carrito" en productos
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart') || e.target.closest('.add-to-cart')) {
        const btn = e.target.matches('.add-to-cart') ? e.target : e.target.closest('.add-to-cart');
        const producto = this.extraerProductoDesdeBoton(btn);
        this.agregarProducto(producto);
      }
    });

    // ✅ EVENT DELEGATION EN EL PANEL COMPLETO (no solo en contenedorItems)
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        // Evitar que cierre al hacer click dentro
        e.stopPropagation();
        
        const target = e.target;
        
        // ✅ Detectar botones +/- (incluyendo el texto interno)
        const btnCantidad = target.closest('.btn-cantidad');
        if (btnCantidad) {
          e.preventDefault();
          const id = btnCantidad.getAttribute('data-id');
          const cambio = parseInt(btnCantidad.getAttribute('data-cambio'), 10);
          console.log('🔢 Click cantidad - ID:', id, 'Cambio:', cambio);
          this.actualizarCantidad(id, cambio);
          return;
        }
        
        // ✅ Detectar botón eliminar
        const btnEliminar = target.closest('.btn-eliminar');
        if (btnEliminar) {
          e.preventDefault();
          const id = btnEliminar.getAttribute('data-id');
          console.log('🗑️ Click eliminar - ID:', id);
          this.eliminarProducto(id);
          return;
        }
      });
    }

    // Cerrar panel al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!this.panel || !this.panel.classList.contains('active')) return;
      
      const clickDentro = this.panel.contains(e.target) || 
                          (this.btnToggle && this.btnToggle.contains(e.target));
      
      if (!clickDentro) {
        this.cerrarPanel();
      }
    });
  }

  extraerProductoDesdeBoton(button) {
    const card = button.closest('.card');
    const img = card ? card.querySelector('img') : null;
    return {
      id: button.getAttribute('data-id'),
      nombre: button.getAttribute('data-name'),
      precio: parseFloat(button.getAttribute('data-price')) || 0,
      imagen: img ? img.src : ''
    };
  }

  agregarProducto(producto) {
    console.log('➕ Agregando producto:', producto);
    const itemExistente = this.items.find(item => item.id === producto.id);
    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.items.push({ ...producto, cantidad: 1 });
    }
    this.guardarCarrito();
    this.renderizarCarrito();
    this.actualizarContador();
    crearToast(`${producto.nombre} agregado al carrito`);
      if (!this.panel.classList.contains('active')) 
    this.abrirPanel();
  }

  eliminarProducto(id) {
    console.log('🗑️ Eliminando producto:', id);
    const item = this.items.find(i => i.id === id);
    if (!item) {
      console.error('❌ Item no encontrado:', id);
      return;
    }
    
    this.items = this.items.filter(item => item.id !== id);
    this.guardarCarrito();
    this.renderizarCarrito();
    this.actualizarContador();
    crearToast('Producto eliminado', 'warning');
  }

  actualizarCantidad(id, cambio) {
    console.log('🔢 Actualizando cantidad - ID:', id, 'Cambio:', cambio);
    const item = this.items.find(i => i.id === id);
    
    if (!item) {
      console.error('❌ Item no encontrado:', id);
      console.log('📋 Items actuales:', this.items.map(i => ({ id: i.id, nombre: i.nombre })));
      return;
    }
    
    const nuevaCantidad = item.cantidad + cambio;
    console.log('📊 Cantidad actual:', item.cantidad, '→ Nueva:', nuevaCantidad);
    
    if (nuevaCantidad <= 0) {
      if (confirm('¿Eliminar este producto del carrito?')) {
        this.eliminarProducto(id);
      } else {
        item.cantidad = 1;
        this.guardarCarrito();
        this.renderizarCarrito();
        this.actualizarContador();
      }
      return;
    }
    
    item.cantidad = nuevaCantidad;
    this.guardarCarrito();
    this.renderizarCarrito();
    this.actualizarContador();
    console.log('✅ Cantidad actualizada correctamente');
  }

  vaciarCarrito() {
    if (this.items.length === 0) {
      crearToast('El carrito ya está vacío', 'warning');
      return;
    }
    
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.items = [];
      this.guardarCarrito();
      this.renderizarCarrito();
      this.actualizarContador();
      crearToast('Carrito vaciado', 'warning');
    }
  }

  finalizarCompra() {
    if (this.items.length === 0) {
      crearToast('El carrito está vacío', 'warning');
      return;
    }
    
    const total = this.calcularTotal();
    if (confirm(`¿Confirmar compra por ${formatMXN(total)}?`)) {
      crearToast('¡Gracias por tu compra! 🎉', 'success');
      this.items = [];
      this.guardarCarrito();
      this.renderizarCarrito();
      this.actualizarContador();
      this.cerrarPanel();
    }
  }

  calcularTotal() {
    return this.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }

  actualizarContador() {
    const totalItems = this.items.reduce((t, i) => t + i.cantidad, 0);
    if (this.countEl) {
      this.countEl.textContent = totalItems;
      this.countEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  }

  abrirPanel() {
    if (this.panel) this.panel.classList.add('active');
  }

  cerrarPanel() {
    if (this.panel) this.panel.classList.remove('active');
  }

  togglePanel() {
    if (this.panel) this.panel.classList.toggle('active');
  }

  renderizarCarrito() {
    console.log('🎨 Renderizando carrito con', this.items.length, 'items');
    
    if (!this.contenedorItems) return;
    
    if (this.items.length === 0) {
      this.contenedorItems.innerHTML = '<p class="carrito-vacio">🛒 Tu carrito está vacío</p>';
      if (this.totalEl) this.totalEl.textContent = '$0 MXN';
      return;
    }

    // ✅ HTML con estructura clara y data-id en botones
    this.contenedorItems.innerHTML = this.items.map(item => `
      <div class="carrito-item" data-item-id="${item.id}">
        <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-img">
        <div class="carrito-item-info">
          <div class="carrito-item-name">${item.nombre}</div>
          <div class="carrito-item-price">${formatMXN(item.precio)}</div>
          <div class="carrito-item-cantidad">
            <button class="btn-cantidad" data-id="${item.id}" data-cambio="-1" type="button">−</button>
            <span class="cantidad-text">${item.cantidad}</span>
            <button class="btn-cantidad" data-id="${item.id}" data-cambio="1" type="button">+</button>
            <button class="btn-eliminar" data-id="${item.id}" type="button">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    if (this.totalEl) {
      this.totalEl.textContent = formatMXN(this.calcularTotal());
    }

    console.log('✅ Carrito renderizado. Event delegation activo.');
  }

  guardarCarrito() {
    try {
      localStorage.setItem('carrito', JSON.stringify(this.items));
      console.log('💾 Guardado:', this.items.length, 'items');
    } catch (err) {
      console.warn('⚠️ Error guardando:', err);
    }
  }

  cargarCarrito() {
    try {
      const saved = localStorage.getItem('carrito');
      const items = saved ? JSON.parse(saved) : [];
      console.log('📂 Cargado:', items.length, 'items');
      return items;
    } catch (err) {
      console.warn('⚠️ Error cargando:', err);
      return [];
    }
  }
}

// ===== GALERÍA MODAL =====
class GaleriaModal {
  constructor() {
    this.currentIndex = -1;
    this.images = [];
    this.init();
  }

  init() {
    this.modal = document.getElementById('modal-galeria');
    this.modalImg = document.getElementById('img-modal');
    this.caption = document.querySelector('.modal-caption');
    this.cerrarBtn = document.querySelector('.cerrar-modal');
    this.btnPrev = document.querySelector('.btn-prev');
    this.btnNext = document.querySelector('.btn-next');

    this.images = Array.from(document.querySelectorAll('.galeria img'));
    
    this.images.forEach((img, index) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => this.abrirModal(index));
    });

    if (this.cerrarBtn) {
      this.cerrarBtn.addEventListener('click', () => this.cerrarModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.cerrarModal();
      });
    }

    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.anterior();
      });
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.siguiente();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!this.modal || this.modal.style.display === 'none') return;
      
      if (e.key === 'Escape') this.cerrarModal();
      if (e.key === 'ArrowRight') this.siguiente();
      if (e.key === 'ArrowLeft') this.anterior();
    });
  }

  abrirModal(index) {
    if (index < 0 || index >= this.images.length) return;
    
    this.currentIndex = index;
    const img = this.images[index];
    
    this.modal.style.display = 'flex';
    this.modalImg.src = img.src;
    this.caption.textContent = img.alt || `Imagen ${index + 1}`;
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      this.modal.classList.add('open');
      this.modalImg.classList.add('visible');
    }, 10);

    this.actualizarBotones();
  }

  cerrarModal() {
    if (!this.modal) return;
    
    this.modalImg.classList.remove('visible');
    this.modal.classList.remove('open');
    
    setTimeout(() => {
      this.modal.style.display = 'none';
      this.modalImg.src = '';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  siguiente() {
    if (this.images.length === 0) return;
    const nextIndex = (this.currentIndex + 1) % this.images.length;
    this.abrirModal(nextIndex);
  }

  anterior() {
    if (this.images.length === 0) return;
    const prevIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.abrirModal(prevIndex);
  }

  actualizarBotones() {
    if (this.images.length <= 1) {
      if (this.btnPrev) this.btnPrev.style.display = 'none';
      if (this.btnNext) this.btnNext.style.display = 'none';
    } else {
      if (this.btnPrev) this.btnPrev.style.display = 'block';
      if (this.btnNext) this.btnNext.style.display = 'block';
    }
  }
}

// ===== LAZY LOADING =====
function inicializarLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

// ===== SCROLL SUAVE =====
function inicializarScrollSuave() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    });
  });
}

// ===== ANIMACIONES =====
function inicializarAnimaciones() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.card, .galeria img, section').forEach(el => {
    el.classList.add('will-animate');
    observer.observe(el);
  });
}

// ===== FORMULARIO =====
function inicializarFormulario() {
  const form = document.getElementById('contacto-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    
    console.log('📧 Enviando:', {
      nombre: data.get('nombre'),
      email: data.get('email'),
      mensaje: data.get('mensaje')
    });

    crearToast('✉️ Mensaje enviado. ¡Gracias!', 'success');
    form.reset();
  });
}

// ===== INICIALIZACIÓN =====
let carrito;
let galeria;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Iniciando DecoHogar...');
  
  carrito = new CarritoCompras();
  galeria = new GaleriaModal();
  
  inicializarFormulario();
  inicializarScrollSuave();
  inicializarAnimaciones();
  inicializarLazyLoading();
  inicializarMapaFallback();
  
  console.log('✅ DecoHogar iniciado correctamente');
  console.log('🛒 Items en carrito:', carrito.items.length);
  
  // ✅ PRUEBA DE DIAGNÓSTICO
  setTimeout(() => {
    const botonesCantidad = document.querySelectorAll('.btn-cantidad');
    console.log('🔍 Botones +/- encontrados:', botonesCantidad.length);
    if (botonesCantidad.length > 0) {
      console.log('✅ Botones renderizados correctamente');
    }
  }, 1000);
});

// ===== MAPA: mostrar/ocultar fallback si el iframe carga o no =====
function inicializarMapaFallback() {
  const iframe = document.getElementById('map-iframe');
  if (!iframe) return;

  const container = iframe.closest('.map-container');
  const fallback = container ? container.querySelector('.map-fallback') : null;

  // Si el iframe dispara load, ocultamos fallback
  iframe.addEventListener('load', () => {
    if (container) container.classList.add('loaded');
    console.log('🗺️ Iframe del mapa cargado');
  });

  // Si en 5s no se dispara load, conservamos el fallback visible y dejamos el botón para abrir en Google Maps
  setTimeout(() => {
    if (container && !container.classList.contains('loaded')) {
      console.warn('⚠️ El iframe del mapa no respondió en 5s — mostrando fallback');
      if (fallback) fallback.style.opacity = '1';
    }
  }, 5000);
}