module.exports = function (url, mongoose) {

  var connect = function () {
    var options = {
      server: {
        socketOptions: {keepAlive: 1200000},
        poolSize: 10
      },
      auto_reconnect: true
    };
    mongoose.connect(url, options)
  };
  connect();

  // Error handler
  mongoose.connection.on('error', function (err) {
    console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running. -> ' + err)
  });

  // Reconnect when closed
  mongoose.connection.on('disconnected', function () {
    console.error('✗ MongoDB Connection Error, reconnecting ... ');
    connect();
  });

};
