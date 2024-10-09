const router = require("express").Router({ mergeParams: true });

const {
  login,
  callbackLogin,
} = require("../../Controllers/authentication/auth-controller");

router.route("/login").get(login);
router.route("/callback").get(callbackLogin);

module.exports = router;
