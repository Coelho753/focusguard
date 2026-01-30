import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

const SOUNDS = {
  alarm: "/alarm.ogg",
  troll: "/troll.mp3",
};

export default function App() {
  const [present, setPresent] = useState(true);
  const [paused, setPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundType, setSoundType] = useState(
    localStorage.getItem("soundType") || "alarm"
  );

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lastSeenRef = useRef(null);
  const intervalRef = useRef(null);

  // 🔓 Unlock áudio
  const initAudio = () => {
    const audio = new Audio(SOUNDS[soundType]);
    audio.loop = true;
    audioRef.current = audio;
    setAudioEnabled(true);
  };

  // 👁️ Detecção facial
  const detectFace = useCallback(async () => {
    if (!videoRef.current || paused) return;

    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    );

    const now = Date.now();

    if (detection) {
      lastSeenRef.current = now;
      setPresent(true);

      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else if (now - lastSeenRef.current > 4000) {
      setPresent(false);

      if (
        audioEnabled &&
        audioRef.current &&
        audioRef.current.paused &&
        !paused
      ) {
        audioRef.current.play().catch(() => { });
      }
    }
  }, [paused, audioEnabled]);

  // 📷 Init câmera
  useEffect(() => {
    async function init() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        intervalRef.current = setInterval(detectFace, 1200);
      } catch (err) {
        alert("Permita o acesso à câmera para usar o FocusGuard.");
        console.error(err);
      }
    }

    init();
    return () => clearInterval(intervalRef.current);
  }, [detectFace]);

  // ⏸ Pausa real
  useEffect(() => {
    if (paused && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [paused]);

  // 🔁 Troca de som
  useEffect(() => {
    localStorage.setItem("soundType", soundType);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(SOUNDS[soundType]);
      audioRef.current.loop = true;
    }
  }, [soundType]);

  return (
    <div style={styles.app}>
      {/* VIDEO */}
      <div style={styles.videoArea}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={styles.video}
        />

        <div
          style={{
            ...styles.status,
            background: present ? "#0f5132" : "#842029",
          }}
        >
          {present ? "🟢 Presente" : "🔴 Ausente"}
        </div>
      </div>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>🎯 FocusGuard</h1>

        <button
          style={{
            ...styles.button,
            background: paused ? "#198754" : "#ffc107",
            color: "#000",
          }}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "▶ Retomar" : "⏸ Pausar"}
        </button>

        <select
          value={soundType}
          onChange={(e) => setSoundType(e.target.value)}
          style={styles.select}
        >
          <option value="alarm">Alarm</option>
          <option value="troll">Troll</option>
        </select>

        {!audioEnabled && (
          <button style={styles.buttonDanger} onClick={initAudio}>
            🔓 Ativar áudio
          </button>
        )}

        <button
          style={styles.buttonSecondary}
          onClick={() => new Audio(SOUNDS[soundType]).play()}
        >
          ▶ Testar som
        </button>
      </aside>
    </div>
  );
}

/* =====================
   FULLSCREEN DESKTOP UI
===================== */

const styles = {
  app: {
    width: "100vw",
    height: "100vh",
    display: "grid",
    gridTemplateColumns: "2fr 360px",
    background: "#0b0f14",
    overflow: "hidden",
  },

  videoArea: {
    position: "relative",
    width: "100%",
    height: "100%",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  video: {
    width: "70%",
    height: "auto",
    maxHeight: "85vh",
    objectFit: "contain",
    transform: "scaleX(-1)",
  },

  status: {
    position: "absolute",
    bottom: 24,
    left: 24,
    padding: "10px 20px",
    borderRadius: 20,
    color: "#fff",
    fontWeight: "bold",
  },

  sidebar: {
    background: "#111",
    padding: 50,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    borderLeft: "4px solid #222",
  },

  title: {
    color: "#fff",
    marginBottom: 20,
  },

  button: {
    padding: 14,
    borderRadius: 14,
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },

  buttonDanger: {
    padding: 14,
    borderRadius: 14,
    background: "#dc3545",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  buttonSecondary: {
    padding: 14,
    borderRadius: 14,
    background: "#0d6efd",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  select: {
    padding: 12,
    borderRadius: 14,
    background: "#222",
    color: "#fff",
    border: "1px solid #333",
  },
};
