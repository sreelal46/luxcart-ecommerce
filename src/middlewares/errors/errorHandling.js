//404 error handling
const errorHandling404 = (req, res) => {
  res.status(404).render("errors/404", { url: req.originalUrl });
};

//Error-handling middleware
const errorHandling500 = (err, req, res, next) => {
  console.log(err.stack);
  res.status(500).render("errors/500", { message: "Something went wrong" });
};

module.exports = { errorHandling404, errorHandling500 };
