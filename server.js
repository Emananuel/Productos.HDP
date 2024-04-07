// Importación del módulo Express
var express = require('express');

// Creación de una instancia de Express
var app = express();

// Importación del módulo body-parser para analizar las solicitudes entrantes
var bodyParser = require('body-parser')

// Importación del módulo HTTP y creación de un servidor HTTP utilizando la instancia de Express
var http = require('http').Server(app);

// Importación del módulo Socket.IO y configuración para que funcione con el servidor HTTP creado
var io = require('socket.io')(http);

// Importación del módulo Mongoose para interactuar con la base de datos MongoDB
var mongoose = require('mongoose');

// Middleware para servir archivos estáticos desde el directorio actual
app.use(express.static(__dirname));

// Middleware para analizar solicitudes en formato JSON
app.use(bodyParser.json());

// Middleware para analizar solicitudes codificadas en URL
app.use(bodyParser.urlencoded({ extended: false }))


// Definición del esquema de modelo de datos para los mensajes
var Message = mongoose.model('Message', {
  name: String,
  message: String,
  rol: String,
})

// URL de la base de datos MongoDB
var dbUrl = 'mongodb://juanMunoz:juanomunoz@ac-hddue4c-shard-00-00.glytkh2.mongodb.net:27017,ac-hddue4c-shard-00-01.glytkh2.mongodb.net:27017,ac-hddue4c-shard-00-02.glytkh2.mongodb.net:27017/?ssl=true&replicaSet=atlas-zk1owh-shard-0&authSource=admin&retryWrites=true&w=majority&appName=ApiRest'

// Ruta para obtener todos los mensajes
app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  })
})

// Ruta para obtener mensajes de un usuario específico
app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  })
})

// Ruta para recibir nuevos mensajes
app.post('/messages', async (req, res) => {
  try {
    // Creación de un nuevo mensaje utilizando los datos recibidos en la solicitud
    var message = new Message(req.body);

    // Guardar el mensaje en la base de datos
    var savedMessage = await message.save()
    console.log('saved');

    // Buscar mensajes censurados y eliminarlos de la base de datos
    var censored = await Message.findOne({ message: 'badword' });
    if (censored)
      await Message.remove({ _id: censored.id })
    else
      // Emitir el mensaje a todos los clientes conectados a través de Socket.IO
      io.emit('message', req.body);
    res.sendStatus(200);
  }
  catch (error) {
    // Manejo de errores
    res.sendStatus(500);
    return console.log('error', error);
  }
  finally {
    console.log('Message Posted')
  }

})

// Manejador de eventos para nuevas conexiones de Socket.IO
io.on('connection', () => {
  console.log('a user is connected')
})

// Conexión a la base de datos MongoDB
mongoose.connect(dbUrl, {})
  .then(() => console.log('Connected Successfully'))
  .catch((err) => { console.error(err); });

// Inicio del servidor HTTP en el puerto 3000
var server = http.listen(3000, () => {
  console.log('server is running on port', server.address().port);
});
