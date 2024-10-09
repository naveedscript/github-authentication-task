const STATUS_CODE = require("../../constants/status-code");
const catchAsync = require("../catch-async/catch-async");
const axios = require("axios");
const GitHubIntegration = require("../../Models/github-integrations/github-integrations-model");

// Add new user
exports.fetchUser = catchAsync(async (req, res) => {
  const { access_token, user_id } = req.query;
  console.log(access_token, "accessToken - req.session.accessToken");

  if (!user_id) {
    return res.status(STATUS_CODE.UNAUTHORIZED).send("User ID is required");
  }

  const integration = await GitHubIntegration.findOne({
    userId: user_id,
    accessToken: access_token,
  });

  if (!integration) {
    return res.status(STATUS_CODE.UNAUTHORIZED).send("Not authenticated");
  }

  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    res.json({
      ...userResponse.data,
      integration_created_at: integration.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user data", error.status);
    if (error.status === 401) {
      await GitHubIntegration.deleteOne({ accessToken: access_token });
      return res
        .status(STATUS_CODE.UNAUTHORIZED)
        .send("Error fetching user data");
    }
    res.status(STATUS_CODE.SERVER_ERROR).send("Error fetching user data");
  }
});

exports.removeIntegration = catchAsync(async (req, res) => {
  const { access_token, user_id } = req.query;

  if (!user_id) {
    return res.status(STATUS_CODE.UNAUTHORIZED).send("User ID is required");
  }

  try {
    await GitHubIntegration.deleteOne({
      userId: user_id,
      accessToken: access_token,
    });

    res.status(STATUS_CODE.OK).send("Integration removed");
  } catch (error) {
    console.error("Error fetching user data", error);

    res
      .status(STATUS_CODE.SERVER_ERROR)
      .send("Error while removing integration");
  }
});
