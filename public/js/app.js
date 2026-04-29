var url = window.location.href;
var swLocation = '/sw.js';

var swReg;
window.enviarNotificacion = enviarNotificacion;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }


    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation ).then( function(reg){

            swReg = reg;
            swReg.pushManager.getSubscription().then( verificaSuscripcion );

        });

        // Actualizar estado inicial de permisos
        updateNotificationStatus();

    });

}


// Referencias de jQuery

var titulo             = $('#titulo');
var nuevoBtn           = $('#nuevo-btn');
var salirBtn           = $('#salir-btn');
var cancelarBtn        = $('#cancel-btn');
var postBtn            = $('#post-btn');
var avatarSel          = $('#seleccion');
var timeline           = $('#timeline');

var modal              = $('#modal');
var modalAvatar        = $('#modal-avatar');
var avatarBtns         = $('.seleccion-avatar');
var txtMensaje         = $('#txtMensaje');

var btnActivadas       = $('.btn-noti-activadas');
var btnDesactivadas    = $('.btn-noti-desactivadas');
var notificationStatus = $('#notification-status');

var usuario;





function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data = {
        mensaje: mensaje,
        user: usuario
    };


    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then( res => res.json() )
    .then( res => console.log( 'app.js', res ))
    .catch( err => console.log( 'app.js error:', err ));



    crearMensajeHTML( mensaje, usuario );

});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);
            posts.forEach( post =>
                crearMensajeHTML( post.mensaje, post.user ));


        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();


// Notificaciones
function verificaSuscripcion( activadas ) {

    if ( activadas ) {
        
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');

    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }

}

// Actualizar indicador de estado de permisos
function updateNotificationStatus() {
    if (!('Notification' in window)) {
        notificationStatus.text('Sin soporte').removeClass('granted denied default').addClass('default');
        return;
    }

    const permission = Notification.permission;
    let statusText = '';
    let statusClass = '';

    switch(permission) {
        case 'granted':
            statusText = 'Notificaciones: Permitidas';
            statusClass = 'granted';
            break;
        case 'denied':
            statusText = 'Notificaciones: Bloqueadas';
            statusClass = 'denied';
            break;
        default: // 'default'
            statusText = 'Notificaciones: Por solicitar';
            statusClass = 'default';
            break;
    }

    notificationStatus
        .text(statusText)
        .removeClass('granted denied default')
        .addClass(statusClass);
}


// Propiedades de Notificaciones Push:
// - title: Titulo principal de la notificacion
// - body: Cuerpo/descripcion del mensaje
// - icon: Icono de la notificacion (32x32 o mayor)
// - badge: Badge pequeno mostrado en notificaciones agrupadas
// - image: Imagen grande mostrada en la notificacion
// - tag: Etiqueta para agrupar notificaciones del mismo tipo
// - requireInteraction: true para mantener la notificacion visible
// - actions: Array de acciones/botones que puede el usuario
// - vibrate: Patron de vibracion [vibrar_ms, pausa_ms, vibrar_ms, ...]
// - data: Datos personalizados para manejar en click/action
// - timestamp: Timestamp de cuando ocurrio el evento
// - dir: Direccion del texto (ltr, rtl, auto)
// - lang: Idioma de la notificacion
// - silent: true para no reproducir sonido

// Funcion para crear notificaciones personalizadas
async function crearNotificacionPersonalizada(personaje, mensaje, tipo = 'mensaje') {
    if (!swReg) {
        console.log('No hay registro de Service Worker');
        return;
    }
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }
    if (Notification.permission !== 'granted') {
        console.log('No hay permiso para mostrar notificaciones');
        return;
    }

    try {
        // Configuraciones personalizadas segun el tipo
        const configs = {
            // Notificacion de mensaje normal
            mensaje: {
                title: 'Nuevo mensaje de @' + personaje,
                body: mensaje.substring(0, 100) + (mensaje.length > 100 ? '...' : ''),
                icon: 'img/avatars/' + personaje + '.jpg',
                badge: 'img/favicon.ico',
                image: 'img/avatars/' + personaje + '.jpg',
                tag: 'mensaje-' + personaje,
                requireInteraction: true,
                actions: [
                    { action: 'responder', title: 'Responder' },
                    { action: 'ver', title: 'Ver' }
                ],
                vibrate: [100, 50, 100],
                data: {
                    personaje: personaje,
                    mensaje: mensaje,
                    timestamp: new Date().toISOString(),
                    url: '/index.html?personaje=' + personaje,
                    conversacion: personaje
                },
                timestamp: Date.now(),
                dir: 'auto',
                lang: 'es-ES',
                silent: false
            },
            // Notificacion de alerta importante
            importante: {
                title: 'ALERTA: @' + personaje,
                body: 'Mensaje importante! ' + mensaje.substring(0, 80),
                icon: 'img/avatars/' + personaje + '.jpg',
                badge: 'img/favicon.ico',
                image: 'img/avatars/' + personaje + '.jpg',
                tag: 'alerta-' + personaje,
                requireInteraction: true,
                actions: [
                    { action: 'marcar_leido', title: 'Marcar como leido' }
                ],
                vibrate: [200, 100, 200],
                data: {
                    personaje: personaje,
                    tipo: 'importante',
                    url: '/index.html?personaje=' + personaje
                },
                timestamp: Date.now(),
                dir: 'auto',
                lang: 'es-ES',
                silent: false
            },
            // Notificacion silenciosa
            silenciosa: {
                title: personaje,
                body: mensaje.substring(0, 50),
                icon: 'img/avatars/' + personaje + '.jpg',
                badge: 'img/favicon.ico',
                tag: 'silenciosa-' + personaje,
                requireInteraction: false,
                data: {
                    personaje: personaje,
                    tipo: 'silenciosa',
                    url: '/index.html?personaje=' + personaje
                },
                timestamp: Date.now(),
                silent: true
            }
        };

        const opciones = configs[tipo] || configs.mensaje;
        console.log('Enviando notificacion personalizada:', opciones);
        await swReg.showNotification(opciones.title, opciones);
    } catch (err) {
        console.log('Error en notificacion personalizada:', err);
    }
}

async function enviarNotificacion() {
    if (!swReg) {
        console.log('No hay registro de Service Worker');
        return;
    }
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }
    if (Notification.permission !== 'granted') {
        console.log('No hay permiso para mostrar notificaciones');
        return;
    }
    try {
        console.log('Mostrando notificacion de prueba...');
        await swReg.showNotification('Notificacion de prueba', {
            body: 'Las notificaciones funcionan correctamente en Chrome',
            icon: '/img/icons/icon-192x192.png',
            badge: '/img/favicon.ico',
            data: {
                url: '/index.html'
            },
            requireInteraction: true
        });
    } catch (err) {
        console.log('Error mostrando notificacion de prueba:', err);
    }
}

async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('El permiso para las notificaciones se ha concedido!');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('El usuario bloqueó las notificaciones');
    return false;
  }

  const permiso = await Notification.requestPermission();
  // Actualizar el indicador de estado después de solicitar permisos
  updateNotificationStatus();
  return permiso === 'granted';
}



// Get Key
function getPublicKey() {

    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );

    return fetch('api/key')
        .then( res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) );


}

// getPublicKey().then( console.log );
/* btnDesactivadas.on( 'click', function() {

    if ( !swReg ) return console.log('No hay registro de SW');

    getPublicKey().then( function( key ) {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then( res => res.toJSON() )
        .then( suscripcion => {

            // console.log(suscripcion);
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion )
            .catch( cancelarSuscripcion );


        });


    });


});
 */

btnDesactivadas.on('click', async function() {

    try {
        if (!swReg) {
            console.log('No hay registro de SW');
            return;
        }

        const permitido = await solicitarPermisoNotificaciones();

        if (!permitido) {
            console.log('El usuario no concedió permisos');
            updateNotificationStatus();
            return;
        }

        const key = await getPublicKey();

        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        });

        await fetch('api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        verificaSuscripcion(subscription);
        updateNotificationStatus();

    } catch (err) {
        console.error('Error al activar notificaciones push:', err);
    }

});


function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then( subs => {

        subs.unsubscribe().then( () =>  verificaSuscripcion(false) );

    });


}

btnActivadas.on( 'click', function() {

    cancelarSuscripcion();
    updateNotificationStatus();

});

// Monitorear cambios en los permisos cuando la página vuelve a ser visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // La página vuelve a ser visible, actualizar el estado de permisos
        updateNotificationStatus();
    }
});

// Botones para probar notificaciones personalizadas
var personajesDisponibles = ['spiderman', 'ironman', 'wolverine', 'thor', 'hulk'];
var mensajesEjemplo = {
    'spiderman': 'Con gran poder viene gran responsabilidad!',
    'ironman': 'Cuando tienes hierro en las venas nada te detiene',
    'wolverine': 'Mis cicatrices cuentan historias de batalla',
    'thor': 'El poder de Asgard fluye en mis venas',
    'hulk': 'Mas fuerte de lo que imaginas!'
};

var btnNotifMensaje = $('#btn-notif-mensaje');
var btnNotifImportante = $('#btn-notif-importante');
var btnNotifSilenciosa = $('#btn-notif-silenciosa');

if (btnNotifMensaje.length) {
    btnNotifMensaje.on('click', function() {
        var personaje = personajesDisponibles[Math.floor(Math.random() * personajesDisponibles.length)];
        var mensaje = mensajesEjemplo[personaje];
        crearNotificacionPersonalizada(personaje, mensaje, 'mensaje');
    });

    btnNotifImportante.on('click', function() {
        var personaje = personajesDisponibles[Math.floor(Math.random() * personajesDisponibles.length)];
        var mensaje = mensajesEjemplo[personaje];
        crearNotificacionPersonalizada(personaje, mensaje, 'importante');
    });

    btnNotifSilenciosa.on('click', function() {
        var personaje = personajesDisponibles[Math.floor(Math.random() * personajesDisponibles.length)];
        var mensaje = mensajesEjemplo[personaje];
        crearNotificacionPersonalizada(personaje, mensaje, 'silenciosa');
    });
}
