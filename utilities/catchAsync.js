module.exports = (func) => {
  //insted of try and catch in app.js
  return (req, res, next) => {
    func(req, res, next).catch(next); //catches errors and passes to next
  };
};
