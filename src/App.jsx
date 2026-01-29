import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

const SOUNDS = {
  alarm: "/alarm.ogg",
  troll: "/troll.ogg",
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

  // 🔊 Inicializa áudio (unlock)
  const initAudio = () => {
    const audio = new Audio(SOUNDS[soundType]);
    audio.loop = true;
    audio.volume = 1;
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
        audioRef.current.play().catch(() => {});
      }
    }
  }, [paused, audioEnabled]);

  // 📷 Init câmera + modelos
  useEffect(() => {
    async function init() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      lastSeenRef.current = Date.now();

      intervalRef.current = setInterval(detectFace, 1200);
    }

    init();
    return () => clearInterval(intervalRef.current);
  }, [detectFace]);

  // ⏸ Pause real
  useEffect(() => {
    if (paused && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [paused]);

  // 🔁 Troca de áudio
  useEffect(() => {
    localStorage.setItem("soundType", soundType);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(SOUNDS[soundType]);
      audioRef.current.loop = true;
    }
  }, [soundType]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 FocusGuard</h1>

        <div style={styles.content}>
          {/* VIDEO */}
          <div style={styles.videoBox}>
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

          {/* CONTROLES */}
          <div style={styles.controls}>
            <button
              onClick={() => setPaused((p) => !p)}
              style={{
                ...styles.button,
                background: paused ? "#198754" : "#ffc107",
                color: "#000",
              }}
            >
              {paused ? "▶ Retomar" : "⏸ Pausar"}
            </button>

            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value)}
              style={styles.select}
            >
              <option value="alarm">🔔 Alarme</option>
              <option value="troll">🤡 Troll</option>
            </select>

            {!audioEnabled && (
              <button onClick={initAudio} style={styles.buttonDanger}>
                🔓 Ativar áudio
              </button>
            )}

            <button
              style={styles.buttonSecondary}
              onClick={() => new Audio(SOUNDS[soundType]).play()}
            >
              ▶ Testar som
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// STYLES RESPONSIVOS
// =====================
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "#111",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 900,
    boxShadow: "0 20px 40px rgba(0,0,0,.6)",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  content: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap", // 🔑 mobile quebra automaticamente
    justifyContent: "center",
  },
  videoBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  video: {
    width: 280,
    borderRadius: 14,
    border: "2px solid #333",
    marginBottom: 10,
  },
  status: {
    padding: "6px 14px",
    borderRadius: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  controls: {
    minWidth: 260,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  button: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 12,
  },
  buttonDanger: {
    padding: 12,
    borderRadius: 12,
    background: "#dc3545",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    marginBottom: 12,
  },
  buttonSecondary: {
    padding: 12,
    borderRadius: 12,
    background: "#0d6efd",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  select: {
    padding: 10,
    borderRadius: 12,
    background: "#222",
    color: "#fff",
    border: "1px solid #333",
    marginBottom: 12,
  },
};
