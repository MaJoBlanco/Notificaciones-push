
const fs = require('fs');


const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');

const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:carlos.arenas@uptc.edu.co',
    vapid.publicKey,
    vapid.privateKey
  );




let suscripciones = require('./subs-db.json');


module.exports.getKey = () => {
    return urlsafeBase64.decode( vapid.publicKey );
};



module.exports.addSubscription = ( suscripcion ) => {
    console.log('Antes enviar suscripción ');
    suscripciones.push( suscripcion );

    console.log('antes modificar subs-db.json');
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
    console.log('Nueva suscripción agregada');
};


module.exports.sendPush = ( post ) => {

    console.log('Mandando PUSHES');

    const notificacionesEnviadas = [];


    suscripciones.forEach( (suscripcion, i) => {


        const pushProm = webpush.sendNotification( suscripcion , JSON.stringify( post ) )
            .then( console.log( 'Notificacion enviada ') )
            .catch( err => {

                console.log('Notificación falló');

                if ( err.statusCode === 410 ) { // GONE, ya no existe
                    suscripciones[i].borrar = true;
                }

            });

        notificacionesEnviadas.push( pushProm );

    });

    Promise.all( notificacionesEnviadas ).then( () => {


        suscripciones = suscripciones.filter( subs => !subs.borrar );

        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );

    });

}

