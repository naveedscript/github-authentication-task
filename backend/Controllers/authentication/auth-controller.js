const STATUS_CODE = require("../../constants/status-code");
const catchAsync = require("../catch-async/catch-async");
const GENERAL_CONSTANTS = require("../../constants/general-constants");
const GitHubIntegration = require("../../Models/github-integrations/github-integrations-model");

const axios = require("axios");
// Add new user
exports.login = catchAsync(async (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo read:org`;
  res.redirect(authUrl);
});

exports.callbackLogin = catchAsync(async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userId = userResponse.data.id;

    const integration = new GitHubIntegration({
      userId,
      accessToken,
    });
    req.accessToken = accessToken;

    await integration.save();
    res.redirect(
      `http://localhost:4200/auth?access_token=${accessToken}&user_id=${userId}`
    );
  } catch (error) {
    console.error("Error getting access token", error);
    res
      .status(STATUS_CODE.SERVER_ERROR)
      .send("Error authenticating with GitHub");
  }
});
