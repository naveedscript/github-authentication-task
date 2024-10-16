const STATUS_CODE = require("../../constants/status-code");
const catchAsync = require("../catch-async/catch-async");
const axios = require("axios");
const GitHubIntegration = require("../../Models/github-integrations/github-integrations-model");

exports.fetchUser = catchAsync(async (req, res) => {
  const { access_token, user_id } = req.query;

  if (!user_id) {
    return res.status(STATUS_CODE.UNAUTHORIZED).send("User ID is required");
  }

  const integration = await GitHubIntegration.findOne({
    userId: user_id,
    accessToken: access_token || req.accessToken,
  });

  if (!integration) {
    return res.status(STATUS_CODE.UNAUTHORIZED).send("Not authenticated");
  }

  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token || req.accessToken}`,
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
      accessToken: access_token || req.accessToken,
    });

    res.status(STATUS_CODE.OK).send("Integration removed");
  } catch (error) {
    console.error("Error fetching user data", error);

    res
      .status(STATUS_CODE.SERVER_ERROR)
      .send("Error while removing integration");
  }
});

exports.fetchGithubUserOrganizations = catchAsync(async (req, res) => {
  const { access_token } = req.query;
  const accessToken = access_token || req.accessToken;

  try {
    const orgsResponse = await axios.get(
      `https://api.github.com/user/orgs?timestamp=${Date.now()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!orgsResponse.data.length) {
      return res.status(STATUS_CODE.OK).json({
        status: "success",
        records: [],
        message: "No organizations found for this user.",
      });
    }

    const orgsWithRepos = await Promise.all(
      orgsResponse.data.map(async (org) => {
        const reposResponse = await axios.get(
          `https://api.github.com/orgs/${org.login}/repos?timestamp=${Date.now()}`,
          {
            headers: {
              Authorization: `token ${accessToken}`,
              "Cache-Control": "no-cache",
            },
          }
        );
        return {
          organization: org,
          repositories: reposResponse.data,
        };
      })
    );

    res.status(STATUS_CODE.OK).json({
      status: "success",
      records: orgsWithRepos,
    });
  } catch (error) {
    console.error("Error fetching user data", error);
    if (error.response) {
      console.error("GitHub API response:", error.response.data);
    }
    res.status(STATUS_CODE.SERVER_ERROR).send("Error while getting repos");
  }
});

exports.fetchRepoStatsBasedOnRepo = catchAsync(async (req, res) => {
  const { access_token: accessToken, repo_full_name: repoFullName } = req.query;

  if (!accessToken || !repoFullName) {
    return res.status(STATUS_CODE.BAD_REQUEST).json({
      status: "fail",
      message: "Missing required parameters: access_token and repo_full_name.",
    });
  }

  try {
    const contributors = await fetchContributors(accessToken, repoFullName);

    const userStatsPromises = contributors.map(async (contributor) => {
      const totalCommits = await fetchCommits(
        accessToken,
        repoFullName,
        contributor.login
      );
      const totalPullRequests = await fetchPullRequests(
        accessToken,
        repoFullName,
        contributor.login
      );
      const totalIssues = await fetchIssues(
        accessToken,
        repoFullName,
        contributor.login
      );
      console.log(contributor.login, "contributor.login");
      return {
        user: contributor.login,
        userId: contributor.id,
        totalCommits,
        totalPullRequests,
        totalIssues,
      };
    });

    const userStats = await Promise.all(userStatsPromises);

    res.status(STATUS_CODE.OK).json({
      status: "success",
      records: userStats,
    });
  } catch (error) {
    if (error.response) {
      console.error("GitHub API response:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);

      if (error.response.status === 409) {
        return res.status(STATUS_CODE.CONFLICT).json({
          status: "error",
          message: "Conflict with the current state of the resource.",
          details:
            error.response.data.message || "Please check the repository state.",
        });
      }
    }
    res.status(STATUS_CODE.SERVER_ERROR).json({
      status: "error",
      message: "Error while getting repo user stats",
      details: error.message,
      responseData: error.response ? error.response.data : null,
    });
  }
});

const fetchContributors = async (accessToken, repo) => {
  const response = await axios.get(
    `https://api.github.com/repos/${repo}/contributors?timestamp=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Cache-Control": "no-cache",
      },
    }
  );
  return response.data;
};

const fetchCommits = async (accessToken, repo, username) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repo}/commits?author=${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Cache-Control": "no-cache",
        },
      }
    );
    return response.data.length;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.warn("GitHub API response: Repository is empty.");
      return 0;
    }
    throw error;
  }
};

const fetchPullRequests = async (accessToken, repo, username) => {
  const response = await axios.get(
    `https://api.github.com/repos/${repo}/pulls?state=all&author=${username}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Cache-Control": "no-cache",
      },
    }
  );
  return response.data.length;
};

const fetchIssues = async (accessToken, repo, username) => {
  const response = await axios.get(
    `https://api.github.com/repos/${repo}/issues?filter=all&creator=${username}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Cache-Control": "no-cache",
      },
    }
  );
  return response.data.filter((issue) => !issue.pull_request).length;
};
