module.exports = io => {
  io.on('connection', socket => {
    global.log.info(`Client with id ${socket.id} connected to socket`);
    io.emit('news', 'Info sent from server using socket');

    socket.on('disconnect', () => {
      global.log.info(`Client with id ${socket.id} disconnected to socket`);
    });
  });
};
