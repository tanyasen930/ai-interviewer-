import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff, Send,
  MessageSquare, ListChecks, Headphones, Lightbulb, MessageCircle, User, Rocket, AlertCircle,
} from "lucide-react";
import { getInterviewApi, submitAnswerApi } from "../api/interview";
import { errMsg } from "../api/axios";
import "../styles/room.css";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const VOICE_ERRORS = {
  "not-allowed": "Microphone access is blocked. Click the lock icon in the address bar, allow Microphone, then reload the page.",
  "service-not-allowed": "Microphone access is blocked. Click the lock icon in the address bar, allow Microphone, then reload the page.",
  "no-speech": "We did not hear anything. Check that the right microphone is selected, speak closer to it, and try again.",
  "audio-capture": "No microphone was found. Please connect a microphone and try again.",
  network: "Voice recognition needs an internet connection and does not work in Brave. Please use Chrome or Edge, or type your answer.",
  "language-not-supported": "This voice language is not supported in your browser.",
};

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const recRef = useRef(null);
  const chatEnd = useRef(null);
  const inputRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [caption, setCaption] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [tab, setTab] = useState("chat");
  const [lang, setLang] = useState("en-IN");
  const [voiceError, setVoiceError] = useState("");

  const total = questions.length;

  useEffect(() => { inputRef.current = input; }, [input]);

  useEffect(() => {
    let alive = true;
    getInterviewApi(id)
      .then((iv) => {
        if (!alive) return;
        const qs = iv.questions || [];
        const first = qs.findIndex((q) => !(q.answer && q.answer.trim()));
        if (first === -1) {
          navigate(`/feedback/${id}`, { replace: true });
          return;
        }
        setQuestions(qs);
        setIndex(first);
        setMessages(qs.slice(0, first).flatMap((q) => [
          { role: "ai", text: q.question },
          { role: "me", text: q.answer },
        ]));
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setLoadError(errMsg(e, "Could not load this interview."));
        setLoading(false);
      });
    return () => { alive = false; };
  }, [id, navigate]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, started]);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recRef.current?.abort?.();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const speak = (text) => {
    setCaption(text);
    if (muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const addAi = (text) => {
    setMessages((m) => [...m, { role: "ai", text }]);
    speak(text);
  };

  const begin = async () => {
    setStarted(true);
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: true }));
    } catch {
      setCamOn(false);
    }
    addAi(questions[index].question);
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    stream?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleMute = () => {
    if (!muted) window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMuted(!muted);
  };

  const switchLang = () => {
    recRef.current?.stop();
    setLang((l) => (l === "en-IN" ? "hi-IN" : "en-IN"));
  };

  const toggleListen = async () => {
    setVoiceError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your answer.");
      return;
    }
    if (listening) { recRef.current?.stop(); return; }

    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch {
      setVoiceError(VOICE_ERRORS["not-allowed"]);
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeaking(false);

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    const base = inputRef.current.trim();
    let finalText = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setInput((base + " " + finalText + interim).replace(/\s+/g, " ").trim());
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setVoiceError(VOICE_ERRORS[e.error] || `Voice input stopped (${e.error}). Please try again or type your answer.`);
    };
    rec.onend = () => setListening(false);

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setVoiceError("Could not start the microphone. Please try again.");
    }
  };

  const send = async () => {
    const answer = input.trim();
    if (!answer || thinking) return;
    recRef.current?.stop();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setVoiceError("");

    setMessages((m) => [...m, { role: "me", text: answer }]);
    setInput("");
    setThinking(true);
    setCaption("The AI is evaluating your answer...");

    try {
      await submitAnswerApi(id, questions[index]._id, answer);
      const next = index + 1;
      if (next >= total) {
        setIndex(total);
        setCaption("Interview complete! Preparing your feedback...");
        setTimeout(() => navigate(`/feedback/${id}`), 1800);
      } else {
        setIndex(next);
        addAi(questions[next].question);
      }
    } catch (e) {
      setMessages((m) => m.slice(0, -1));
      setInput(answer);
      setCaption(errMsg(e, "Could not submit your answer. Please try again."));
    } finally {
      setThinking(false);
    }
  };

  const leave = () => {
    if (window.confirm("Leave the interview? Your answers so far are saved.")) {
      window.speechSynthesis?.cancel();
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="lobby card fade-up">
        <div className="orb sm" />
        <p className="muted">Loading your interview...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="lobby card fade-up">
        <h3>Could not open the interview</h3>
        <p className="muted">{loadError}</p>
        <button className="btn" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="lobby card fade-up">
        <div className="orb sm" />
        <h2>Ready for your interview?</h2>
        <p className="muted">
          {total} questions based on your resume
          {index > 0 ? `. You will continue from question ${index + 1}.` : "."} Please allow camera access if asked.
        </p>
        <ul className="checks">
          <li><Headphones size={18} /> Sit in a quiet place</li>
          <li><Lightbulb size={18} /> Keep the light in front of your face</li>
          <li><MessageCircle size={18} /> Use Chrome or Edge for voice answers</li>
        </ul>
        <button className="btn" onClick={begin}><Rocket size={17} /> {index > 0 ? "Continue interview" : "Start interview"}</button>
      </div>
    );
  }

  const status = speaking ? "Speaking" : thinking ? "Thinking" : listening ? "Listening to you" : "Waiting for your answer";

  return (
    <div className="fade-up room-wide">
      <header className="room-head">
        <button className="icon-btn" onClick={leave} title="Leave interview"><ArrowLeft size={18} /></button>
        <div>
          <strong>AI Mock Interview</strong>
          <div className="muted">Question {Math.min(index + 1, total)} of {total}</div>
        </div>
        <span className="rec"><i /> {fmt(seconds)}</span>
      </header>
      <div className="progress"><i style={{ width: `${(index / total) * 100}%` }} /></div>

      <div className="room-grid">
        <section className="room-main">
          <div className="stage">
            <div className="name-tag"><i /> AI Interviewer · {status}</div>

            <div className="pip">
              <video ref={videoRef} autoPlay muted playsInline hidden={!(stream && camOn)} />
              {!(stream && camOn) && <div className="pip-off"><User size={32} /></div>}
              <span>You</span>
            </div>

            <div className={`orb-wrap ${speaking ? "speaking-on" : ""}`}>
              <i className="ring r1" /><i className="ring r2" />
              <div className={`orb ${speaking ? "speaking" : ""} ${thinking ? "thinking" : ""}`} />
            </div>

            <div className="stage-bottom">
              <div className="caption-ov">
                <div className={`wave ${speaking || listening ? "on" : ""}`}>
                  {Array.from({ length: 10 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}
                </div>
                <p>{caption}</p>
              </div>

              <div className="controls">
                <button className={`ctl ${listening ? "live" : ""}`} onClick={toggleListen} title="Answer by voice">
                  {listening ? <Mic size={21} /> : <MicOff size={21} />}
                </button>
                <button className="ctl lang" onClick={switchLang} title="Voice language (English / Hindi)">
                  {lang === "en-IN" ? "EN" : "HI"}
                </button>
                <button className={`ctl ${!camOn ? "off" : ""}`} onClick={toggleCam} title="Camera">
                  {camOn ? <Video size={21} /> : <VideoOff size={21} />}
                </button>
                <button className={`ctl ${muted ? "off" : ""}`} onClick={toggleMute} title="AI voice">
                  {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
                </button>
                <button className="ctl end" onClick={leave} title="Leave interview"><PhoneOff size={21} /></button>
              </div>
            </div>
          </div>

          {voiceError && (
            <div className="voice-note">
              <AlertCircle size={18} style={{ flex: "none", marginTop: 2 }} />
              <span>{voiceError}</span>
            </div>
          )}

          <div className="answer">
            <textarea
              placeholder={listening ? "Listening... please speak" : "Type your answer or press the mic to speak..."}
              value={input}
              disabled={thinking}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button className="btn" onClick={send} disabled={thinking || !input.trim()}>
              Send <Send size={16} />
            </button>
          </div>
        </section>

        <aside className="card side">
          <div className="tabs wide">
            <button className={tab === "chat" ? "tab active" : "tab"} onClick={() => setTab("chat")}>
              <MessageSquare size={16} /> Chat
            </button>
            <button className={tab === "q" ? "tab active" : "tab"} onClick={() => setTab("q")}>
              <ListChecks size={16} /> Questions
            </button>
          </div>

          {tab === "chat" ? (
            <div className="chat">
              {messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
              {thinking && <div className="bubble ai"><span className="dots"><i /><i /><i /></span></div>}
              <div ref={chatEnd} />
            </div>
          ) : (
            <div className="chat">
              {questions.map((q, i) => (
                <div key={q._id || i} className={`qitem ${i < index ? "done" : i === index ? "now" : ""}`}>
                  <span className="dot">{i < index ? "✓" : i + 1}</span>
                  <span>Question {i + 1}{q.category ? ` · ${q.category}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}