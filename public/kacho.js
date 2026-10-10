'use strict';

// Canal sin configurar hasta recibir un destino comercial real de Pablo.
const CONTACT = window.KACHO_CONFIG.contact;
const DETAILS = {
  materiales:{name:'Materiales',question:'¿Dónde lo vas a instalar?',caption:'Una buena cotización empieza con una buena pregunta.',alt:'naranja, con casco, chaleco café y muestras de material',price:'¿Qué material, cuántos metros y en qué zona sería la entrega? La cotización debe confirmar piezas y existencia.',brief:'una opción de piso para una cafetería, con 80 m² de tránsito comercial'},
  construccion:{name:'Obra',question:'¿Qué quieres construir?',caption:'Entiende el proyecto antes de preparar una visita.',alt:'naranja, con casco marfil, overol azul petróleo y un plano',price:'¿Qué quieres construir, cuántos metros y dónde? Un proyecto requiere revisar condiciones antes de estimar la obra.',brief:'una ampliación de terraza de 30 m² en Guadalajara'},
  ecommerce:{name:'Tienda',question:'¿Para qué lo vas a usar?',caption:'Ayuda a elegir la variante que tiene sentido.',alt:'color miel, con gorra naranja, polo crema y un paquete',price:'¿Qué modelo y variante te interesan? También hay que confirmar el destino del envío antes de presentar el total.',brief:'una mochila de oficina compatible con una laptop de 15 pulgadas'},
  muebles:{name:'Hogar',question:'¿Cómo es tu espacio?',caption:'Medidas, materiales y una decisión mejor orientada.',alt:'verde salvia, con mandil crudo y muestras textiles',price:'¿Qué pieza, medida y tapizado estás considerando? Esos datos y la entrega forman parte de la propuesta.',brief:'un sofá para una pared de 2.80 metros y una casa con mascota'},
  inmobiliaria:{name:'Inmuebles',question:'¿Para vivir o invertir?',caption:'Una búsqueda con contexto vale más que una lista.',alt:'azul niebla, con saco azul marino y una llave',price:'¿Qué inmueble te interesa y cuál es tu rango de presupuesto? El asesor debe confirmar precio y condiciones vigentes.',brief:'un departamento para vivir en la zona de Chapalita'},
  automotriz:{name:'Autos',question:'¿Cómo te mueves todos los días?',caption:'Conecta el uso con el vehículo adecuado.',alt:'naranja, con chamarra grafito y una llave de auto',price:'¿Qué modelo y versión tienes en mente? La cotización requiere confirmar equipamiento, disponibilidad y forma de compra.',brief:'una SUV para una familia de cinco que viaja con frecuencia'},
  solar:{name:'Solar',question:'¿Cómo consume energía tu negocio?',caption:'Una evaluación empieza por entender el consumo.',alt:'verde salvia, con casco marfil, chaleco crema y panel solar',price:'Para preparar una evaluación necesitamos consumo, ubicación y condiciones del techo. El dimensionamiento se confirma con el equipo técnico.',brief:'paneles solares para un local comercial con techo propio'},
  industrial:{name:'Industria',question:'¿Qué necesita hacer tu equipo?',caption:'Primero aplicación y compatibilidad. Después, propuesta.',alt:'azul niebla, con overol grafito, lentes de seguridad y calibrador',price:'¿Qué aplicación, capacidad y alimentación eléctrica necesitas? Primero verificamos compatibilidad para cotizar el equipo correcto.',brief:'un compresor que alimente dos pistolas de pintura y una herramienta neumática'},
  educacion:{name:'Formación',question:'¿Qué quieres poder hacer?',caption:'El objetivo del alumno orienta la recomendación.',alt:'lavanda, con cárdigan crudo, lentes redondos y un cuaderno',price:'¿Qué programa, modalidad y horario te interesan? Revisemos la oferta vigente y qué incluye antes de elegir.',brief:'un curso de conversación en inglés orientado al trabajo'},
  eventos:{name:'Eventos',question:'¿Qué tienen en mente?',caption:'Convierte una idea en un brief que se puede cotizar.',alt:'lavanda, con chaleco naranja, diadema de comunicación y portapapeles',price:'¿Para qué fecha, cuántas personas y qué servicios necesitan? Con el alcance y la disponibilidad se prepara la propuesta.',brief:'un evento empresarial para unas 100 personas en Guadalajara'},
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHTML = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let sectors = [], current, switchId = 0;
let preparedText = '';
let requestedSector = 'materiales', wheelDirection = 1, swipeStart = null, suppressWheelClickUntil = 0;
const imageCache = new Map();

function ensureImage(id) {
  if (!imageCache.has(id)) imageCache.set(id,new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => image.decode().then(resolve).catch(resolve);
    image.onerror = () => { imageCache.delete(id); reject(new Error('image-unavailable')); };
    image.src = `assets/${id}.webp`;
  }));
  return imageCache.get(id);
}

function renderSectorButtons() {
  $('#sector-tabs').innerHTML = sectors.map(s => `<button type="button" class="sector-tab" data-sector="${s.id}" aria-pressed="false"><img src="assets/${s.id}.webp" width="64" height="64" loading="lazy" alt=""><span>${s.name}</span></button>`).join('');
  $('#request-sector').innerHTML = sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  $$('.sector-tab').forEach(button => button.addEventListener('click',() => selectSector(button.dataset.sector)));
  $('#casting-track').innerHTML = sectors.map(s => `<button type="button" class="casting-character" data-cast="${s.id}" aria-label="Elegir ${escapeHTML(s.name)}" aria-pressed="false" tabindex="-1"><img src="assets/${s.id}.webp" width="80" height="80" alt="" draggable="false"></button>`).join('');
  $('#casting-options').innerHTML = sectors.map(s => `<button type="button" class="casting-option" data-cast-option="${s.id}" aria-pressed="false"><img src="assets/${s.id}.webp" width="42" height="42" alt=""><span>${escapeHTML(s.name)}</span>${icon('check')}</button>`).join('');
  $$('[data-cast]').forEach(button=>button.addEventListener('click',()=>{
    if(performance.now()<suppressWheelClickUntil)return;
    selectSector(button.dataset.cast);
  }));
  $$('[data-cast-option]').forEach(button=>button.addEventListener('click',()=>{
    closeCasting(true);selectSector(button.dataset.castOption);
  }));
  $('#casting-prev').disabled=false;$('#casting-next').disabled=false;$('#casting-toggle').disabled=false;
}

function commitSector(s,animate) {
  const previous=current;
  current = s;
  const d = DETAILS[s.id], name = `Kacho ${d.name}`;
  $('#hero-sector').value = s.id;
  $('#request-sector').value = s.id;
  $('#hero-sector').disabled=false;
  $('#request-sector').disabled=false;
  $$('.sector-tab').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.sector===s.id)));
  for (const selector of ['#hero-character','#specialist-character','#chat-avatar','#request-character']) {
    const element = $(selector);
    element.src = `assets/${s.id}.webp`;
    if(selector!=='#chat-avatar') element.alt = `${name} ${d.alt}`;
    if(animate && !paused && selector!=='#chat-avatar') {
      element.getAnimations().forEach(a => a.cancel());
      element.animate([{opacity:.2,transform:'translateX(18px) scale(.97)',filter:'blur(5px)'},{opacity:1,transform:'translateX(0) scale(1)',filter:'blur(0)'}],{duration:460,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  }
  // La familia sigue visible; ninguno de los acompañantes repite al protagonista.
  const companions = ['muebles','inmobiliaria','materiales'].filter(id => id!==s.id).slice(0,2);
  companions.forEach((id,index) => {
    const side = index===0?'left':'right', detail = DETAILS[id];
    const image = $(`#hero-companion-${side}`);
    image.src = `assets/${id}.webp`;
    image.alt = `Kacho ${detail.name} ${detail.alt}`;
    $(`#hero-companion-${side}-name`).textContent = detail.name;
  });
  $('#hero-character-name').textContent = name;
  $('#hero-question').textContent = d.question;
  $('#specialist-name').textContent = name;
  $('#specialist-skill').textContent = s.skill;
  $('#chat-name').textContent = name;
  $('#request-character-name').textContent = `Tu Kacho de ${d.name}`;
  updateCasting(s,animate&&previous?.id!==s.id);
  document.body.dataset.sector = s.id;
  KachoProduct.selectSector(s, d);
  const url = new URL(location.href);
  url.searchParams.set('giro',s.id);
  history.replaceState(null,'',url);
  if(!$('#request-result').hidden) editRequest(false);
  window.__kacho = {ready:true,sector:s.id,profiles:sectors.length};
  $('#request-form').querySelector('button[type="submit"]').disabled=false;
}

async function selectSector(id,animate=true) {
  if(!sectors.length)return;
  const s = sectors.find(item => item.id===id) || sectors[0];
  requestedSector=s.id;
  const requestId = ++switchId;
  if(current?.id===s.id) {
    $('#hero-sector').value=s.id;
    $('#request-sector').value=s.id;
    $('#asset-status').textContent='';
    $('#hero-stage').setAttribute('aria-busy','false');
    $('#specialist-workbench').setAttribute('aria-busy','false');
    $('#hero-casting').setAttribute('aria-busy','false');
    $('#casting-status').textContent='';
    $('#request-form').querySelector('button[type="submit"]').disabled=false;
    return;
  }
  $('#hero-stage').setAttribute('aria-busy','true');
  $('#specialist-workbench').setAttribute('aria-busy','true');
  $('#hero-casting').setAttribute('aria-busy','true');
  $('#casting-status').textContent=`Cambiando a ${s.name}…`;
  $('#request-form').querySelector('button[type="submit"]').disabled=true;
  $('#asset-status').textContent = `Preparando a Kacho ${DETAILS[s.id].name}…`;
  try {
    await ensureImage(s.id);
    if(requestId!==switchId) return;
    commitSector(s,animate);
    $('#asset-status').textContent = '';
    $('#casting-status').textContent='';
  } catch {
    if(requestId!==switchId) return;
    $('#asset-status').textContent = 'No se pudo cargar este personaje. Elige de nuevo el giro para reintentarlo.';
    $('#hero-sector').value = current?.id || 'materiales';
    $('#request-sector').value = current?.id || 'materiales';
    requestedSector=current?.id || 'materiales';
    $('#casting-status').textContent='No cargó el personaje. Toca otra vez para reintentar.';
  } finally {
    if(requestId===switchId) {
      $('#hero-stage').setAttribute('aria-busy','false');
      $('#specialist-workbench').setAttribute('aria-busy','false');
      $('#hero-casting').setAttribute('aria-busy','false');
      $('#request-form').querySelector('button[type="submit"]').disabled=!current;
    }
  }
}

function updateCasting(s,animate) {
  const index=sectors.findIndex(item=>item.id===s.id), count=sectors.length;
  const moveFocus=document.activeElement?.classList.contains('casting-character');
  $$('[data-cast]').forEach((button,i)=>{
    let offset=(i-index+count)%count;if(offset>count/2)offset-=count;
    button.style.setProperty('--slot',offset);
    button.dataset.position=offset===0?'current':Math.abs(offset)===1?'near':'away';
    button.setAttribute('aria-pressed',String(offset===0));
    button.setAttribute('aria-hidden',String(Math.abs(offset)>1));
    button.tabIndex=offset===0?0:-1;
  });
  $$('[data-cast-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.castOption===s.id)));
  $('#casting-name').textContent=s.name;
  $('#casting-count').textContent=`${index+1} / ${count}`;
  $('#casting-prev').setAttribute('aria-label',`Elegir ${sectors[(index-1+count)%count].name}`);
  $('#casting-next').setAttribute('aria-label',`Elegir ${sectors[(index+1)%count].name}`);
  if(moveFocus)$(`[data-cast="${s.id}"]`).focus({preventScroll:true});
  if(animate&&!paused){
    const name=$('#casting-name');name.getAnimations().forEach(a=>a.cancel());
    name.animate([{transform:`translateY(${wheelDirection*18}px)`,opacity:.3,filter:'blur(3px)'},{transform:'translateY(0)',opacity:1,filter:'blur(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
  }
}

function moveCasting(direction) {
  if(!sectors.length)return;
  wheelDirection=direction;
  const index=sectors.findIndex(s=>s.id===requestedSector);
  selectSector(sectors[(index+direction+sectors.length)%sectors.length].id);
}

function closeCasting(returnFocus=false) {
  $('#casting-options').hidden=true;
  $('#casting-toggle').setAttribute('aria-expanded','false');
  if(returnFocus)$('#casting-toggle').focus({preventScroll:true});
}

function applyMotion() {
  document.body.dataset.motion = paused?'off':'on';
  document.documentElement.style.scrollBehavior=paused?'auto':'smooth';
  const button=$('#motion-toggle');
  button.setAttribute('aria-pressed',String(paused));
  button.setAttribute('aria-label',paused?'Activar movimiento':'Pausar movimiento');
  button.innerHTML = `${icon(paused?'play':'pause')}<span>${paused?'Animar':'Pausar'}</span>`;
  if(paused) document.getAnimations().forEach(animation => {if(animation.effect?.target && !animation.animationName) animation.cancel();});
}

function closeMenu(returnFocus=false) {
  $('.site-header').classList.remove('menu-open');
  $('#menu-toggle').setAttribute('aria-expanded','false');
  $('#menu-toggle').setAttribute('aria-label','Abrir menú');
  $('#menu-toggle').innerHTML=icon('menu');
  if(returnFocus) $('#menu-toggle').focus();
}

function editRequest(focus=true) {
  $('#request-result').hidden=true;
  $('#request-form').hidden=false;
  preparedText='';
  if(focus) $('#company').focus();
}

function configureContact() {
  // El correo está escrito en el HTML para lectores sin JavaScript; aquí se alinea con la configuración.
  $$('[data-contact-email]').forEach(link=>{
    if(CONTACT.email){link.href=`mailto:${CONTACT.email}`;link.textContent=CONTACT.email;}
    else (link.closest('.request-direct')||link).hidden=true;
  });
  if(!CONTACT.whatsapp&&!CONTACT.email) return;
  $('#form-note').textContent = CONTACT.whatsapp ? 'Al final la envías por WhatsApp.' : 'Al final la envías desde tu correo.';
}

$('#request-form').addEventListener('submit',event => {
  event.preventDefault();
  const company=$('#company').value.trim();
  const name=$('#lead-name').value.trim(), email=$('#lead-email').value.trim(), phone=$('#lead-phone').value.trim();
  if(!company){$('#company').setCustomValidity('Escribe el nombre de tu negocio.');$('#company').reportValidity();return;}
  const selected=sectors.find(s => s.id===$('#request-sector').value) || current;
  const context=$('#context').value.trim();
  preparedText=[`Solicitud de demo · KACHO`,``,`Nombre: ${name}`,`Correo: ${email}`,`WhatsApp: ${phone}`,`Negocio: ${company}`,`Giro: ${selected.name}`,`Especialista: Kacho ${DETAILS[selected.id].name}`,context?`Contexto: ${context}`:null,``,`Me gustaría revisar una demostración para mi negocio y conocer una propuesta de alcance e inversión.`].filter(line => line!==null).join('\n');
  $('#request-summary').textContent=preparedText;
  $('#copy-status').textContent='';
  $('#request-form').hidden=true;
  $('#request-result').hidden=false;
  if(CONTACT.whatsapp) {
    $('#send-request').href=`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(preparedText)}`;
    $('#send-request').hidden=false;
    $('#result-state').textContent='Revísala y abre WhatsApp cuando quieras enviarla.';
  } else if(CONTACT.email) {
    $('#send-request').href=`mailto:${CONTACT.email}?subject=${encodeURIComponent('Demo Kacho · '+company)}&body=${encodeURIComponent(preparedText)}`;
    $('#send-request').innerHTML=`Enviar por correo ${icon('arrow-up')}`;
    $('#send-request').removeAttribute('target');
    $('#send-request').hidden=false;
    $('#result-state').textContent=`Revísala y envíala a ${CONTACT.email}.`;
  }
  $('#request-summary').focus({preventScroll:true});
});
$('#company').addEventListener('input',()=>$('#company').setCustomValidity(''));
$('#copy-request').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(preparedText);$('#copy-status').textContent='Solicitud copiada. Todavía no se ha enviado.';}
  catch{$('#copy-status').textContent='No se pudo copiar automáticamente. Puedes descargar la solicitud o seleccionar el texto.';const range=document.createRange();range.selectNodeContents($('#request-summary'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}
});
$('#download-request').addEventListener('click',()=>{
  const blob=new Blob([preparedText+'\n'],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url;link.download='solicitud-demo-kacho.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#edit-request').addEventListener('click',()=>editRequest());
$('#casting-prev').addEventListener('click',()=>moveCasting(-1));
$('#casting-next').addEventListener('click',()=>moveCasting(1));
$('#casting-toggle').addEventListener('click',()=>{
  const open=$('#casting-toggle').getAttribute('aria-expanded')!=='true';
  $('#casting-toggle').setAttribute('aria-expanded',String(open));
  $('#casting-options').hidden=!open;
  if(open)$(`[data-cast-option="${current.id}"]`).focus({preventScroll:true});
});
$('#hero-casting').addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeCasting(true);return;}
  if(!$('#casting-options').hidden)return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
    event.preventDefault();moveCasting(event.key==='ArrowRight'?1:-1);
  }
});
document.addEventListener('pointerdown',event=>{if(!$('#hero-casting').contains(event.target))closeCasting();});
$('#hero-casting').addEventListener('focusout',event=>{
  if(event.relatedTarget&&!$('#hero-casting').contains(event.relatedTarget))closeCasting();
});
$('#casting-viewport').addEventListener('pointerdown',event=>{swipeStart={x:event.clientX,y:event.clientY};});
$('#casting-viewport').addEventListener('pointercancel',()=>{swipeStart=null;});
$('#casting-viewport').addEventListener('pointerup',event=>{
  if(!swipeStart)return;
  const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y;swipeStart=null;
  if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy)){
    suppressWheelClickUntil=performance.now()+300;moveCasting(dx<0?1:-1);
  }
});
$('#hero-sector').addEventListener('change',event=>selectSector(event.target.value));
$('#request-sector').addEventListener('change',event=>selectSector(event.target.value));
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;applyMotion();});
reduced.addEventListener('change',event=>{paused=event.matches;applyMotion();});
$('#menu-toggle').addEventListener('click',()=>{
  if($('#menu-toggle').getAttribute('aria-expanded')==='true'){closeMenu();return;}
  $('.site-header').classList.add('menu-open');$('#menu-toggle').setAttribute('aria-expanded','true');$('#menu-toggle').setAttribute('aria-label','Cerrar menú');$('#menu-toggle').innerHTML=icon('close');
});
$$('.site-header a').forEach(link=>link.addEventListener('click',()=>closeMenu()));
document.addEventListener('pointerdown',event=>{
  if($('.site-header').classList.contains('menu-open')&&!$('.site-header').contains(event.target))closeMenu();
});
matchMedia('(max-width:720px)').addEventListener('change',()=>closeMenu());
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.site-header').classList.contains('menu-open'))closeMenu(true);});
$$('svg.icon').forEach(svg=>{svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');});
applyMotion();configureContact();

fetch('giros.json').then(response=>{if(!response.ok)throw new Error('sectors-unavailable');return response.json();}).then(async data=>{
  sectors=data;
  renderSectorButtons();
  const desired=new URLSearchParams(location.search).get('giro');
  const selected=sectors.find(s=>s.id===desired) || sectors[0];
  commitSector(sectors[0],false);
  if(selected.id!==sectors[0].id)await selectSector(selected.id,false);
}).catch(()=>{
  $('#asset-status').textContent='No se pudieron cargar las especialidades. Recarga la página para volver a intentarlo.';
  $('#request-form').querySelector('button[type="submit"]').disabled=true;
});
