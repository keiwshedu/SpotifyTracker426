require("dotenv").config();
const express = require("express");
const cors = require("cors"); // Import the cors package
const axios = require("axios");
const querystring = require("querystring");

const app = express();
const port = 8888;

const redirect_uri = "http://localhost:8888/callback"; // Make sure redirect URI matches with Spotify Dashboard

// Enable CORS for all routes
app.use(cors()); // <-- This line enables CORS

// Optional: Handle JSON bodies if needed
app.use(express.json());

// Spotify credentials
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// Step 1: Authorization endpoint
app.get("/login", (req, res) => {
  const scope = "user-read-currently-playing user-read-playback-state";
  const auth_url =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });
  res.redirect(auth_url); // Redirect user to Spotify authorization
});

// Step 2: Token exchange
app.get("/callback", (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  console.log(`Authorization code received: ${code}`);

  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: querystring.stringify({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    }),
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
    .then((response) => {
      const { access_token, refresh_token } = response.data;

      console.log(`Access token: ${access_token}`);

      // Redirect to the frontend with the access token
      res.redirect(
        `http://localhost:3000/dashboard?access_token=${access_token}`
      );
    })
    .catch((err) => {
      console.error(
        "Error exchanging token:",
        err.response ? err.response.data : err.message
      );
      res.status(500).send("Error exchanging token");
    });
});

// Step 3: Get currently playing track
app.get("/currently-playing", (req, res) => {
  const access_token = req.query.access_token;

  if (!access_token) {
    return res.status(400).send("Access token missing");
  }

  console.log(`Access token for currently playing: ${access_token}`);

  axios
    .get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    })
    .then((response) => {
      if (response.status === 204) {
        // No content if nothing is playing
        return res.status(204).send("No track currently playing");
      }

      console.log("Currently playing track:", response.data);
      res.json(response.data); // Send currently playing track info
    })
    .catch((err) => {
      console.error(
        "Error fetching currently playing track:",
        err.response ? err.response.data : err.message
      );
      res.status(500).send("Error fetching currently playing track");
    });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
