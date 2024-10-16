const router = require("express").Router({ mergeParams: true });

const {
  fetchUser,
  removeIntegration,
  fetchGithubUserOrganizations,
  fetchRepoStatsBasedOnRepo
} = require("../../Controllers/user/user-controller");

router.route("/").get(fetchUser);
router.route("/repos").get(fetchGithubUserOrganizations);
router.route("/repos/meta").get(fetchRepoStatsBasedOnRepo);
router.route("/remove-integration").get(removeIntegration);

module.exports = router;
