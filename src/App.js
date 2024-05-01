import React, { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import './style.css';

function App() {

  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef < HTMLParagraphElement | null > (null);
  const uploadedVideoContainerRef = useRef();
  const resultsVideoContainerRef = useRef();

  useEffect(() => {
    const load = async () => {
      const baseURL = "/js";
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on("log", ({ message }) => {
        if (messageRef.current) messageRef.current.innerHTML = message;
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
        workerURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.worker.js`,
          "text/javascript"
        ),
      });
      setLoaded(true);
    };

    load();
  }, []);

  function createVideoPlayer(file) {
    const videoPlayer = document.createElement('video');
    videoPlayer.classList.add('uploaded-video-player');
    videoPlayer.controls = true;

    const url = URL.createObjectURL(file);
    videoPlayer.src = url;

    return videoPlayer;
  }

  const selettoreFileOnChange = (event) => {
    const uploadedVideoContainer = uploadedVideoContainerRef.current;
    const files = event.target.files;
    uploadedVideoContainer.innerHTML = '';

    for (const file of files) {
      const videoPlayer = createVideoPlayer(file);
      uploadedVideoContainer.appendChild(videoPlayer);
    }
  };

  const randomizzaButtonClick = async () => {
    const resultsVideoContainer = resultsVideoContainerRef.current;
    const videoPlayers = document.querySelectorAll('.uploaded-video-player');
    const videoUrls = [];

    videoPlayers.forEach(player => {
      videoUrls.push(player.src);
    });

    resultsVideoContainer.innerHTML = '';

    const numIterations = 3;

    for (let i = 0; i < numIterations; i++) {
      const shuffledArray = shuffleArray(videoUrls);

      const ffmpeg = ffmpegRef.current;

      for (let j = 0; j < shuffledArray.length; j++) {
        await ffmpeg.writeFile("video" + j + ".mp4", await fetchFile(shuffledArray[j]));
      }

      ffmpeg.writeFile("videos.txt", shuffledArray.map((_, index) => "file 'video" + index + ".mp4'").join("\n"));

      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'videos.txt', '-c', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');

      const videoPlayer = document.createElement('video');
      videoPlayer.classList.add('result-video-player');
      videoPlayer.controls = true;
      videoPlayer.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      resultsVideoContainer.appendChild(videoPlayer);
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  return loaded ? (
    <>
      <h1>Video Shuffle</h1>
      {/* <img src={Play} alt="Play" id="play" /> */}
      <label for="selettore-file" class="custom-file-upload">
      Upload File
      </label>
      <input type="file" id="selettore-file" accept="video/*" multiple onChange={selettoreFileOnChange} />
      <div id="uploaded-video-container" ref={uploadedVideoContainerRef}></div>
      <button id="randomizza-video" onClick={randomizzaButtonClick}>Randomize!</button>
      <div id="results-video-container" ref={resultsVideoContainerRef}></div>
    </>
  ) : ("Loading");
}

export default App;