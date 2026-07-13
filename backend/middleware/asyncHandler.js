// Wraps an async route handler so a rejected promise (e.g. a Mongoose
// validation error) goes to next(err) instead of crashing as an unhandled
// rejection - lets a single error-handling middleware in server.js turn
// every failure into the app's normal {success:false, message} JSON shape.
function asyncHandler(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
}

module.exports = asyncHandler;
