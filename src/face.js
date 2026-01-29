import * as faceapi from 'face-api.js';

let loaded = false;

export async function loadModels() {
  if (loaded) return;

  const url = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(url),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(url),
  ]);

  loaded = true;
}

export async function detectFace(video) {
  return faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true);
}
