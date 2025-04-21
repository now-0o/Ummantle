// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import { Sun, Moon } from "lucide-react";
import TypeBadge from "./components/TypeBadge";
import "./App.css";

// Import normalization and weight definitions
import {
  normalizeFeature,
  FEATURE_WEIGHTS,
  TYPE_LIST,
  EGG_GROUP_LIST,
  SHAPE_LIST,
  HABITAT_LIST,
  COLOR_LIST,
  ABILITY_LIST,
  EXPERIENCE_GROUP_LIST,
} from "./scoreUtils";

function App() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [inputCount, setInputCount] = useState(0);
  const [correct, setCorrect] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function initGame() {
      const res = await fetch("/enriched_pokemons.json");
      const fetched = await res.json();
      setAllPokemons(fetched);
      const random = fetched[Math.floor(Math.random() * fetched.length)];
      setAnswer(random);
      setLoading(false);
    }
    initGame();
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const rankedList = useMemo(() => {
    if (!answer) return [];
    const list = allPokemons
      .map((p) => ({ ...p, score: getScore(p, answer) }))
      .filter((p) => p.name !== answer.name)
      .sort((a, b) => b.score - a.score);
    return [{ ...answer, score: 100 }, ...list];
  }, [allPokemons, answer]);

  const handleGuess = () => {
    if (!answer) return;
    const guess = allPokemons.find(
      (p) => p.koreanName === input || p.name === input.toLowerCase()
    );
    if (!guess) {
      alert("해당 포켓몬이 없어요!");
      return;
    }
    if (guess.name === answer.name) {
      setCorrect({ ...guess, inputIndex: inputCount + 1, score: 100 });
      setInputCount((i) => i + 1);
      setInput("");
      setSuggestions([]);
      return;
    }
    const idx = rankedList.findIndex((p) => p.name === guess.name);
    const scoredGuess = {
      ...guess,
      rank: idx + 1,
      score: rankedList[idx].score,
      inputIndex: inputCount + 1,
    };
    setGuesses((prev) =>
      prev.find((g) => g.name === scoredGuess.name)
        ? prev
        : [...prev, scoredGuess]
    );
    setInputCount((i) => i + 1);
    setInput("");
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setSuggestions(
      allPokemons
        .filter(
          (p) =>
            p.koreanName.includes(val) || p.name.includes(val.toLowerCase())
        )
        .slice(0, 10)
    );
  };

  const handleReveal = () => {
    if (window.confirm("정말 정답을 보시겠습니까?")) {
      setCorrect({ ...answer, inputIndex: "?", score: 100 });
      setRevealed(true);
    }
  };

  if (loading)
    return <div className="loading">포켓몬 데이터 불러오는 중...</div>;

  const best = guesses.length
    ? guesses.reduce((a, b) => (a.rank < b.rank ? a : b))
    : null;
  const latest = guesses.length ? guesses[guesses.length - 1] : null;
  const others = guesses
    .filter((g) => g.name !== best?.name && g.name !== latest?.name)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="container">
      <header className="header">
        <h1>Ummantle</h1>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="input-area">
        <div className="input-wrapper">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            placeholder="포켓몬 이름 입력"
            disabled={!!correct}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((s) => (
                <li
                  key={s.name}
                  onClick={() => {
                    setInput(s.koreanName);
                    setSuggestions([]);
                  }}
                >
                  {s.koreanName} ({s.name})
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={handleGuess} disabled={!!correct}>
          입력
        </button>
      </div>

      {correct && (
        <div className="correct-box">
          <h2>🎉 정답입니다! 🎉</h2>
          <p>{correct.inputIndex}회 만에 맞추셨습니다!</p>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${correct.id}.png`}
            alt={correct.koreanName}
            width="80"
            height="80"
          />
          <h3>
            {correct.koreanName} ({correct.name})
          </h3>
        </div>
      )}

      <table className="guess-table">
        <thead>
          <tr>
            <th>No</th>
            <th>이미지</th>
            <th>이름</th>
            <th>순위</th>
            <th>유사도</th>
            <th>타입</th>
            <th>키</th>
            <th>몸무게</th>
          </tr>
        </thead>
        <tbody>
          {best && (
            <tr key={best.name}>
              <td>{best.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${best.id}.png`}
                  alt={best.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{best.koreanName}</td>
              <td>{best.rank}</td>
              <td>{best.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={best.type1} />
                {best.type2 && <TypeBadge type={best.type2} />}
              </td>
              <td>{best.height}</td>
              <td>{best.weight}</td>
            </tr>
          )}
          {latest && latest.name !== best?.name && (
            <tr key={latest.name}>
              <td>{latest.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${latest.id}.png`}
                  alt={latest.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{latest.koreanName}</td>
              <td>{latest.rank}</td>
              <td>{latest.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={latest.type1} />
                {latest.type2 && <TypeBadge type={latest.type2} />}
              </td>
              <td>{latest.height}</td>
              <td>{latest.weight}</td>
            </tr>
          )}
          {others.map((g) => (
            <tr key={g.name}>
              <td>{g.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${g.id}.png`}
                  alt={g.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{g.koreanName}</td>
              <td>{g.rank}</td>
              <td>{g.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={g.type1} />
                {g.type2 && <TypeBadge type={g.type2} />}
              </td>
              <td>{g.height}</td>
              <td>{g.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showRanking && (
        <div className="modal-overlay" onClick={() => setShowRanking(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>전체 유사도 순위</h2>
            <table className="guess-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>이름</th>
                  <th>유사도</th>
                </tr>
              </thead>
              <tbody>
                {rankedList.slice(0, 30).map((p, idx) => (
                  <tr key={p.name}>
                    <td>{idx}</td>
                    <td>
                      {p.koreanName} ({p.name})
                    </td>
                    <td>{p.score.toFixed(1)}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="next-btn"
              style={{ backgroundColor: "#aaa", marginTop: "16px" }}
              onClick={() => setShowRanking(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="btn-box">
        <button className="next-btn" onClick={() => window.location.reload()}>
          다음 문제
        </button>
        {!correct && !revealed && (
          <button
            className="next-btn"
            style={{ backgroundColor: "#718096" }}
            onClick={handleReveal}
          >
            정답보기
          </button>
        )}
        {(correct || revealed) && (
          <button
            className="next-btn"
            style={{ backgroundColor: "#4A5568" }}
            onClick={() => setShowRanking(true)}
          >
            순위보기
          </button>
        )}
      </div>
    </div>
  );
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function euclideanScore(vecA, vecB) {
  const dist = Math.sqrt(
    vecA.reduce((sum, a, i) => sum + Math.pow(a - vecB[i], 2), 0)
  );
  return Math.max(0, 100 - dist);
}

function toVector(p) {
  const contArr = [
    normalizeFeature(p.height, "height"),
    normalizeFeature(p.weight, "weight"),
    normalizeFeature(p.base_experience, "base_experience"),
    normalizeFeature(p.capture_rate, "capture_rate"),
    normalizeFeature(p.evolution_stage, "evolution_stage"),
    normalizeFeature(p.generation, "generation"),
  ];
  const stats = [
    normalizeFeature(p.hp, "hp"),
    normalizeFeature(p.attack, "attack"),
    normalizeFeature(p.defense, "defense"),
    normalizeFeature(p.special_attack, "special_attack"),
    normalizeFeature(p.special_defense, "special_defense"),
    normalizeFeature(p.speed, "speed"),
  ];
  const flags = [
    p.has_different_form ? 1 : 0,
    p.has_mega ? 1 : 0,
    p.has_gigantamax ? 1 : 0,
    p.is_partner ? 1 : 0,
  ];
  const typeVec = TYPE_LIST.map((t) =>
    p.type1 === t || p.type2 === t ? 1 : 0
  );
  const eggVec = EGG_GROUP_LIST.map((g) =>
    (p.egg_groups || []).includes(g) ? 1 : 0
  );
  const shapeVec = SHAPE_LIST.map((s) => (p.shape === s ? 1 : 0));
  const habitatVec = HABITAT_LIST.map((h) => (p.habitat === h ? 1 : 0));
  const colorVec = COLOR_LIST.map((c) => (p.color === c ? 1 : 0));
  const abilityVec = ABILITY_LIST.map((a) =>
    (p.abilities || []).includes(a) ? 1 : 0
  );
  const expVec = EXPERIENCE_GROUP_LIST.map((e) =>
    p.experience_group === e ? 1 : 0
  );
  return [
    ...contArr,
    ...stats,
    ...flags,
    ...typeVec,
    ...eggVec,
    ...shapeVec,
    ...habitatVec,
    ...colorVec,
    ...abilityVec,
    ...expVec,
  ];
}

function getScore(a, b) {
  const vecA = toVector(a);
  const vecB = toVector(b);
  const weightedA = vecA.map((v, i) => v * FEATURE_WEIGHTS[i]);
  const weightedB = vecB.map((v, i) => v * FEATURE_WEIGHTS[i]);
  const cos = cosineSimilarity(weightedA, weightedB);
  const euc = euclideanScore(weightedA, weightedB) / 100;
  return Math.round(((cos + euc) / 2) * 100);
}

export default App;
