import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // For styling

function App() {
  const [track, setTrack] = useState(null);
  const [accessToken, setAccessToken] = useState(
    new URLSearchParams(window.location.search).get("access_token")
  );

  useEffect(() => {
    if (accessToken) {
      fetchCurrentlyPlaying();
    }
  }, [accessToken]);

  const fetchCurrentlyPlaying = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8888/currently-playing?access_token=${accessToken}`
      );
      setTrack(response.data);
    } catch (error) {
      console.error("Error fetching currently playing track:", error);
    }
  };

  const handlePlayPause = () => {
    if (track) {
      const player = window.spotifyPlayer;
      if (player) {
        player.togglePlay();
      }
    }
  };

  useEffect(() => {
    if (window.Spotify && accessToken) {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const token = accessToken;

        const player = new window.Spotify.Player({
          name: "Music Player",
          getOAuthToken: (cb) => {
            cb(token);
          },
        });

        player.addListener("ready", ({ device_id }) => {
          console.log("Spotify Player is ready");
          window.spotifyPlayer = player;
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.log("Spotify Player is not ready");
        });

        player.connect();
      };

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [accessToken]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Currently listening to</h1>
        {track ? (
          <div className="track-info">
            <img
              src={track.item.album.images[0].url}
              alt={track.item.name}
              className="track-artwork"
            />
            <div className="track-details">
              <h2>{track.item.name}</h2>
              <p>{track.item.artists.map((artist) => artist.name).join(", ")}</p>
              <p>{track.item.album.name}</p>
              <div className="controls">
                <button onClick={handlePlayPause}>
                  {track.is_playing ? "❚❚" : "▶"}
                </button>
                <button>⏮</button>
                <button>⏭</button>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
