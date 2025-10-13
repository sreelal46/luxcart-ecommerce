export const loadLandingPage = (req, res) => {
  res.render("user/landingPage");
};

export const loadLoginPage = (req, res) => {
  res.render("user/login");
};

export const loadSignUpPage = (req, res) => {
  res.render("user/signUp");
};

export const createUser = (req, res) => {
  console.log(req.body);
  res.send();
};
