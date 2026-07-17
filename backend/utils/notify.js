// Creates a Notification document and pushes it over Socket.io in one call,
// so routes don't have to remember to do both.

const { Notification } = require("../models/notification.model");
const { emitToRole, emitToUser } = require("../realtime");

async function notifyRole(role, type, title, message, payload = {}) {
  const notification = await Notification.create({ recipientRole: role, type, title, message, payload });
  emitToRole(role, "notification", notification.toJSON());
  return notification;
}

async function notifyUser(userId, type, title, message, payload = {}) {
  const notification = await Notification.create({ recipientId: userId, type, title, message, payload });
  emitToUser(userId, "notification", notification.toJSON());
  return notification;
}

module.exports = { notifyRole, notifyUser };
