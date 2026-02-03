const defaultAvatar = process.env.DEFAULT_PROFILE_IMAGE_URL;
const locals = (req, res, next) => {
  res.locals.admin = req.session.admin || null;
  res.locals.user = req.session.user || null;
  res.locals.footer = req.session.footer || null;
  res.locals.defaultAvatar = defaultAvatar;
  next();
};

module.exports = { locals };
