const mongoose = require("mongoose");
const schmeaRules = {
  userId: { type: String, required: true }, // Store user ID or any unique identifier
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  createdAt: { type: Date, default: Date.now },
};

const schemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

const GitHubIntegrationModel = new mongoose.Schema(schmeaRules, schemaOptions);

module.exports = mongoose.model("GitHubIntegration", GitHubIntegrationModel);
