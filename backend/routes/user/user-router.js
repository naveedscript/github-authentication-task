const router = require("express").Router({ mergeParams: true });

const {fetchUser,removeIntegration} = require("../../Controllers/user/user-controller");

router.route("/").get(fetchUser);
router.route("/remove-integration").get(removeIntegration);

module.exports = router;
