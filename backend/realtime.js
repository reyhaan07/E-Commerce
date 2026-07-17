// Socket.io hub. Clients connect with ?role=admin|seller|user|delivery and
// optionally ?userId=..., and get joined to matching rooms. Routes call
// emitToRole / emitToUser to broadcast events; if socket.io hasn't been
// initialised yet (e.g. in tests) the emits are just no-ops.

const { Server } = require("socket.io");

let io = null;

function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const { role, userId } = socket.handshake.query;
    if (["admin", "seller", "user", "delivery"].includes(role)) {
      socket.join(`role:${role}`);
    }
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  return io;
}

function emitToRole(role, event, payload) {
  if (io) io.to(`role:${role}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

function emitToAll(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = { initRealtime, emitToRole, emitToUser, emitToAll };
