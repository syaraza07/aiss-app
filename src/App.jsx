import { useState, useEffect, useRef } from "react";

const TOPICS = [
  { id: 1, label: "Proklamasi Kemerdekaan", emoji: "🏛", hint: "17 Agustus 1945 — Soekarno membacakan teks proklamasi" },
  { id: 2, label: "Peristiwa Rengasdengklok", emoji: "🌙", hint: "Para pemuda membawa Soekarno-Hatta ke Rengasdengklok" },
  { id: 3, label: "Pertempuran Surabaya", emoji: "⚔️", hint: "10 November 1945 — Arek-arek Suroboyo melawan sekutu" },
  { id: 4, label: "Topik Bebas", emoji: "✨", hint: "Pilih tokoh pahlawan atau peristiwa sejarah favoritmu!" },
];

const WORD_BANKS = {
  tokoh: ["Indonesian leader", "independence fighter", "young hero", "brave soldier", "crowd of people", "mother and child", "elderly man", "group of youth"],
  suasana: ["solemn", "emotional", "patriotic", "dramatic", "tense", "joyful", "tearful", "proud", "historical", "sacred"],
  visual: ["sepia tone", "black and white", "vintage style", "cinematic", "watercolor", "documentary style", "1945 era", "warm golden light"],
  aksi: ["reading a proclamation", "waving a flag", "marching forward", "raising fist", "standing tall", "gathering together", "celebrating", "praying together"],
};

const REFLECTION_QUESTIONS = [
  "Bagian cerita mana yang paling sulit kamu jelaskan ke AI? Kenapa?",
  "Apa yang kamu ubah dari prompt pertama ke prompt berikutnya?",
  "Apa yang kamu pelajari dari kegiatan ini yang belum kamu tahu sebelumnya?",
];

const PHASES = ["Pilih Topik", "Susun Cerita", "Buat Prompt", "Refleksi", "Selesai"];

const phaseColors = ["#7F77DD", "#1D9E75", "#BA7517", "#993C1D", "#444441"];

export default function AISSApp() {
  const [phase, setPhase] = useState(0);
  const [topic, setTopic] = useState(null);
  const [story, setStory] = useState({ orientation: "", complication: "", resolution: "", characters: "", setting: "" });
  const [prompts, setPrompts] = useState({ scene1: "", scene2: "", scene3: "" });
  const [reflection, setReflection] = useState(["", "", ""]);
  const [aiResponse, setAiResponse] = useState({ scene1: "", scene2: "", scene3: "" });
  const [loading, setLoading] = useState({ scene1: false, scene2: false, scene3: false });
  const [wordBank, setWordBank] = useState([]);
  const [copied, setCopied] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [showExport, setShowExport] = useState(false);
  const chatRef = useRef(null);

  const canProceed = () => {
    if (phase === 0) return !!topic && groupName.trim().length > 0;
    if (phase === 1) return story.orientation.length > 20 && story.complication.length > 20 && story.resolution.length > 20;
    if (phase === 2) return prompts.scene1.length > 5 && prompts.scene2.length > 5 && prompts.scene3.length > 5;
    if (phase === 3) return reflection.every(r => r.length > 5);
    return true;
  };

  const generatePrompt = async (scene) => {
    const sceneMap = { scene1: story.orientation, scene2: story.complication, scene3: story.resolution };
    const text = sceneMap[scene];
    if (!text || text.length < 10) return;
    setLoading(p => ({ ...p, [scene]: true }));
    setAiResponse(p => ({ ...p, [scene]: "" }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Kamu adalah asisten belajar yang membantu siswa SD kelas 4-6 membuat prompt untuk AI video generator (seperti Canva AI). 
Tugas kamu: ubah teks narasi Bahasa Indonesia menjadi prompt bahasa Inggris yang singkat, deskriptif, dan visual.
Format output HANYA berupa prompt (maksimal 2-3 kalimat, sekitar 30-50 kata).
Gunakan kata-kata yang visual dan deskriptif: tokoh, latar, aksi, suasana, gaya visual.
Contoh format: "A dignified Indonesian man in white shirt reading a proclamation, 1945 era, surrounded by an emotional crowd, morning light, sepia tone, historical atmosphere"
PENTING: Output HANYA prompt saja, tanpa penjelasan, tanpa kata pembuka.`,
          messages: [{ role: "user", content: `Ubah narasi ini menjadi prompt AI video generator:\n\n${text}\n\nKonteks topik: ${topic?.label || "Sejarah Indonesia"}\nTokoh/latar: ${story.characters}, ${story.setting}` }]
        })
      });
      const data = await res.json();
      const result = data.content?.[0]?.text || "";
      setAiResponse(p => ({ ...p, [scene]: result }));
      setPrompts(p => ({ ...p, [scene]: result }));
    } catch (e) {
      setAiResponse(p => ({ ...p, [scene]: "Gagal terhubung. Coba lagi ya!" }));
    }
    setLoading(p => ({ ...p, [scene]: false }));
  };

  const addWord = (word) => {
    const activeScene = "scene1";
    setPrompts(p => ({ ...p, [activeScene]: p[activeScene] ? p[activeScene] + ", " + word : word }));
  };

  const copyPrompt = (key) => {
    navigator.clipboard.writeText(prompts[key]);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportData = () => {
    const data = { kelompok: groupName, topik: topic?.label, story, prompts, reflection, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `AISS_${groupName}_${Date.now()}.json`; a.click();
  };

  const sceneLabels = {
    scene1: { label: "Scene 1 — Orientation", color: "#7F77DD", bg: "#EEEDFE", hint: "Perkenalan tokoh, latar, dan situasi awal" },
    scene2: { label: "Scene 2 — Complication", color: "#BA7517", bg: "#FAEEDA", hint: "Peristiwa penting / konflik yang terjadi" },
    scene3: { label: "Scene 3 — Resolution", color: "#0F6E56", bg: "#E1F5EE", hint: "Penyelesaian dan dampak peristiwa" },
  };

  return (
    <div style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif", maxWidth: 700, margin: "0 auto", padding: "1rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#7F77DD", letterSpacing: -1 }}>AI Story Sequence</div>
        <div style={{ fontSize: 13, color: "#888780", marginTop: 2 }}>Model Pembelajaran AISS — Kelas 4–6 SD</div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.5rem" }}>
        {PHASES.map((ph, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: i <= phase ? phaseColors[i] : "#E0E0E0", transition: "background .3s" }} />}
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < phase ? phaseColors[i] : i === phase ? phaseColors[i] : "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: i <= phase ? "#fff" : "#999", flexShrink: 0, transition: "all .3s" }}>
                {i < phase ? "✓" : i + 1}
              </div>
              {i < PHASES.length - 1 && <div style={{ flex: 1, height: 2, background: i < phase ? phaseColors[i] : "#E0E0E0", transition: "background .3s" }} />}
            </div>
            <div style={{ fontSize: 10, color: i === phase ? phaseColors[i] : "#999", fontWeight: i === phase ? 700 : 400, textAlign: "center", whiteSpace: "nowrap" }}>{ph}</div>
          </div>
        ))}
      </div>

      {/* PHASE 0: PILIH TOPIK */}
      {phase === 0 && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Nama Kelompok</label>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Contoh: Kelompok Garuda" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: "0.5rem", fontSize: 13, fontWeight: 600, color: "#444" }}>Pilih Topik Cerita</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TOPICS.map(t => (
              <div key={t.id} onClick={() => setTopic(t)} style={{ padding: "14px", borderRadius: 12, border: topic?.id === t.id ? "2px solid #7F77DD" : "1.5px solid #E0E0E0", background: topic?.id === t.id ? "#EEEDFE" : "#fff", cursor: "pointer", transition: "all .2s" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{t.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{t.hint}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 1: SUSUN CERITA */}
      {phase === 1 && (
        <div>
          <div style={{ background: "#EEEDFE", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "#534AB7" }}>
            Topik: <strong>{topic?.emoji} {topic?.label}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
            {[["characters", "Tokoh Cerita", "Siapa yang ada dalam ceritamu?", "#7F77DD"], ["setting", "Latar Tempat & Waktu", "Di mana dan kapan ceritamu terjadi?", "#1D9E75"]].map(([key, label, ph, color]) => (
              <div key={key} style={{ background: "#fafafa", borderRadius: 10, padding: "10px 12px", border: "1px solid #eee" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
                <input value={story[key]} onChange={e => setStory(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          {[["orientation", "Scene 1 — Orientation", "Ceritakan situasi awal — tokoh, tempat, suasana sebelum peristiwa penting terjadi...", "#7F77DD", "#EEEDFE"], ["complication", "Scene 2 — Complication", "Ceritakan peristiwa penting yang terjadi — konflik, aksi, ketegangan...", "#BA7517", "#FAEEDA"], ["resolution", "Scene 3 — Resolution", "Ceritakan bagaimana peristiwa berakhir dan apa dampaknya...", "#0F6E56", "#E1F5EE"]].map(([key, label, ph, color, bg]) => (
            <div key={key} style={{ marginBottom: "1rem" }}>
              <div style={{ background: bg, borderRadius: "8px 8px 0 0", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                <div style={{ fontSize: 11, color, opacity: 0.7 }}>{story[key].length} karakter</div>
              </div>
              <textarea value={story[key]} onChange={e => setStory(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: "0 0 8px 8px", border: "1.5px solid #eee", borderTop: "none", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
          ))}
        </div>
      )}

      {/* PHASE 2: BUAT PROMPT */}
      {phase === 2 && (
        <div>
          <div style={{ background: "#E1F5EE", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "#085041", lineHeight: 1.6 }}>
            <strong>Cara kerja:</strong> Klik "Bantu AI!" untuk mengubah ceritamu menjadi prompt bahasa Inggris. Lalu copy dan paste ke Canva AI!
          </div>

          {/* Word bank */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 6 }}>Bank Kata Kunci (klik untuk tambah ke prompt)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {Object.entries(WORD_BANKS).map(([cat, words]) =>
                words.slice(0, 4).map(word => (
                  <span key={word} onClick={() => setPrompts(p => ({ ...p, scene1: p.scene1 ? p.scene1 + ", " + word : word }))} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", background: "#fafafa", color: "#555", transition: "all .15s" }}>{word}</span>
                ))
              )}
            </div>
          </div>

          {Object.entries(sceneLabels).map(([key, meta]) => (
            <div key={key} style={{ marginBottom: "1rem", borderRadius: 12, border: "1.5px solid #eee", overflow: "hidden" }}>
              <div style={{ background: meta.bg, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                  <div style={{ fontSize: 11, color: meta.color, opacity: 0.75 }}>{meta.hint}</div>
                </div>
                <button onClick={() => generatePrompt(key)} disabled={loading[key]} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: meta.color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: loading[key] ? "wait" : "pointer", fontFamily: "inherit", opacity: loading[key] ? 0.7 : 1 }}>
                  {loading[key] ? "⏳ Proses..." : "✨ Bantu AI!"}
                </button>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Narasi kamu: <em>{(key === "scene1" ? story.orientation : key === "scene2" ? story.complication : story.resolution).substring(0, 80)}...</em></div>
                <textarea value={prompts[key]} onChange={e => setPrompts(p => ({ ...p, [key]: e.target.value }))} placeholder="Prompt akan muncul di sini setelah kamu klik 'Bantu AI!' atau ketik sendiri..." rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, outline: "none", resize: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <button onClick={() => copyPrompt(key)} style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid #ddd", background: copied === key ? "#E1F5EE" : "#fafafa", color: copied === key ? "#0F6E56" : "#555", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    {copied === key ? "✓ Tersalin!" : "📋 Copy Prompt"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ background: "#EEEDFE", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#534AB7", lineHeight: 1.6 }}>
            <strong>Langkah selanjutnya:</strong> Buka Canva AI → Magic Media → paste prompt di atas → Generate! Kalau hasilnya belum sesuai, ubah promptnya dan coba lagi.
          </div>
        </div>
      )}

      {/* PHASE 3: REFLEKSI */}
      {phase === 3 && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#333" }}>Jurnal Refleksi</div>
            <div style={{ fontSize: 12, color: "#888" }}>Ceritakan pengalamanmu hari ini</div>
          </div>
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={i} style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#534AB7", marginBottom: 8, lineHeight: 1.5 }}>{i + 1}. {q}</div>
              <textarea value={reflection[i]} onChange={e => { const r = [...reflection]; r[i] = e.target.value; setReflection(r); }} rows={3} placeholder="Tulis jawabanmu di sini..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      )}

      {/* PHASE 4: SELESAI */}
      {phase === 4 && (
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ fontSize: 60, marginBottom: "1rem" }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#7F77DD", marginBottom: 6 }}>Selamat, {groupName}!</div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: "1.5rem", lineHeight: 1.6 }}>Kalian sudah menyelesaikan satu siklus AI Story Sequence. Narasi, prompt, dan refleksimu sudah tersimpan!</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
            {[["📖", "Cerita", "3 scene naratif"], ["🤖", "Prompt", "3 prompt AI"], ["💬", "Refleksi", "3 jawaban"]].map(([emoji, label, sub]) => (
              <div key={label} style={{ background: "#EEEDFE", borderRadius: 12, padding: "14px 10px" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#534AB7" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#7F77DD" }}>{sub}</div>
              </div>
            ))}
          </div>
          <button onClick={exportData} style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "#7F77DD", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "block", width: "100%" }}>
            📥 Download Data (JSON)
          </button>
          <button onClick={() => { setPhase(0); setTopic(null); setStory({ orientation:"", complication:"", resolution:"", characters:"", setting:"" }); setPrompts({ scene1:"", scene2:"", scene3:"" }); setReflection(["","",""]); setGroupName(""); }} style={{ padding: "10px 28px", borderRadius: 12, border: "1.5px solid #ddd", background: "#fff", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            🔄 Mulai Sesi Baru
          </button>
        </div>
      )}

      {/* NAVIGATION */}
      {phase < 4 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: 10 }}>
          {phase > 0 ? (
            <button onClick={() => setPhase(p => p - 1)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ← Kembali
            </button>
          ) : <div />}
          <button onClick={() => setPhase(p => p + 1)} disabled={!canProceed()} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: canProceed() ? phaseColors[phase] : "#ccc", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed", fontFamily: "inherit", flex: phase === 0 ? 0 : 1, transition: "background .2s" }}>
            {phase === 3 ? "Selesai ✓" : "Lanjut →"}
          </button>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 11, color: "#bbb" }}>
        AI Story Sequence Learning Model · Penelitian Tesis S2 Teknologi Pendidikan
      </div>
    </div>
  );
}
