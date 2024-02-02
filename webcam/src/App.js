import './App.css';
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { emojisplosion } from 'emojisplosion';


function predictionToEmoji(predictions) {
  /** Function to map a prediction array into a set of known emojis.*/
  const labels = ["fear", "happy", "neutral"];
  const highestIndex = predictions.indexOf(Math.max(...predictions));
  const predictedEmotion = labels[highestIndex]
  const emotionEmojiMapping = { 'happy': "\u{1f604}", 'neutral': "\u{1f610}", 'fear':"\u{1f631}"};
  return emotionEmojiMapping[predictedEmotion];
}

function cropImage(img) {
  /** Function to crop an image into a square before resizing.*/
  const size = Math.min(img.shape[0], img.shape[1]);
  const centerHeight = img.shape[0] / 2;
  const beginHeight = centerHeight - (size / 2);
  const centerWidth = img.shape[1] / 2;
  const beginWidth = centerWidth - (size / 2);
  return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
}

const WebcamApp = () => {
  /** Main webcam component in this application.*/
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const [currentEmoji, setCurrentEmoji] = useState(null);

  // Load model.
  const loadModel = async () => {
    const modelPath = 'model/model.json';
    modelRef.current = await tf.loadLayersModel(modelPath);
  };

  // Run frame through model.
  const analyzeFrame = async () => {
    if (!videoRef.current || !modelRef.current) return;
    const video = videoRef.current;
    const model = modelRef.current;
    var frame = tf.browser.fromPixels(video);
    frame = cropImage(frame);
    frame = tf.image.resizeBilinear(frame, [96, 96]);
    var prediction = model.predict(tf.expandDims(frame, 0));
    var predictionArray = Array.from(prediction.dataSync());
    console.log(predictionArray)
    if (predictionArray.some(value => value > 0.5)) {
      var predictedEmoji = predictionToEmoji(predictionArray);
      setCurrentEmoji(predictedEmoji)
      emojisplosion({ emojis: [predictedEmoji], count: 1, fontSize: ([96, 98]), position: {x: 1, y: 1}});
      return predictedEmoji;
    } else {
      setCurrentEmoji(null)
    }

    
  };

  useEffect(() => {

    // Load model.
    loadModel();

    // Get video reference.
    const video = videoRef.current;
    if (!video) return;

    // Start streaming video.
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      video.srcObject = stream;
      video.play().catch(err => console.error("Video Error: ", err));
      setTimeout(() => {
        const intervalId = setInterval(analyzeFrame, 500); 
        return () => {clearInterval(intervalId);};
      }, 2000);
    });

    // Run analyzeFrame every half second.
    // const intervalId = setInterval(analyzeFrame, 1000);
    // return () => {clearInterval(intervalId);};
  }, []);

  // Return video component.
  return (
    <div style={{position: "relative", width: "100vw", height: "100vh"}}>
      <span style={{position: "absolute",top: 10,left: 10,fontSize: '10rem'}}>{currentEmoji}</span>
      <video ref={videoRef} preload="none" style={{ position: "fixed",  right: 0,  bottom: 0,  minWidth: "70%",  minHeight: "70%", borderRadius: "30px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}/>
    </div>
  );
};

export default WebcamApp;
