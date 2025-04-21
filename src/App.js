// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import { Sun, Moon } from "lucide-react";
import TypeBadge from "./components/TypeBadge";
import "./App.css";
import { calculateSimilarityVector } from "./scoreUtils";

function App() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [simVec, setSimVec] = useState(null);
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

  // 초기 데이터 및 유사도 행렬 계산
  useEffect(() => {
    async function init() {
      const res = await fetch("/enriched_pokemons.json");
      const fetched = await res.json();
      setAllPokemons(fetched);
      const matrix = calculateSimilarityVector(fetched);
      setSimVec(matrix);
      const random = fetched[Math.floor(Math.random() * fetched.length)];
      setAnswer(random);
      setLoading(false);
    }
    init();
  }, []);

  // 다크 모드 토글 적용
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 정답 대비 전체 순위 리스트
  const rankedList = useMemo(() => {
    if (!answer || !simVec) return [];
    const idxA = allPokemons.findIndex((p) => p.name === answer.name);
    const list = allPokemons
      .map((p, i) => ({ ...p, score: Math.round(simVec[i][idxA] * 100) }))
      .filter((p) => p.name !== answer.name)
      .sort((a, b) => b.score - a.score);
    return [{ ...answer, score: 100 }, ...list];
  }, [allPokemons, answer, simVec]);

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
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${correct.pokedex_number}.png`}
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
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${best.pokedex_number}.png`}
                  alt={best.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{best.koreanName}</td>
              <td>{best.rank}</td>
              <td>{best.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={best.type_1} />
                {best.type_2 && <TypeBadge type={best.type_2} />}
              </td>
              <td>{best.height_m}</td>
              <td>{best.weight_kg}</td>
            </tr>
          )}
          {latest && latest.name !== best?.name && (
            <tr key={latest.name}>
              <td>{latest.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${latest.pokedex_number}.png`}
                  alt={latest.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{latest.koreanName}</td>
              <td>{latest.rank}</td>
              <td>{latest.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={latest.type_1} />
                {latest.type_2 && <TypeBadge type={latest.type_2} />}
              </td>
              <td>{latest.height_m}</td>
              <td>{latest.weight_kg}</td>
            </tr>
          )}
          {others.map((g) => (
            <tr key={g.name}>
              <td>{g.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${g.pokedex_number}.png`}
                  alt={g.koreanName}
                  width="40"
                  height="40"
                />
              </td>
              <td>{g.koreanName}</td>
              <td>{g.rank}</td>
              <td>{g.score.toFixed(1)}점</td>
              <td>
                <TypeBadge type={g.type_1} />
                {g.type_2 && <TypeBadge type={g.type_2} />}
              </td>
              <td>{g.height_m}</td>
              <td>{g.weight_kg}</td>
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
                    <td>{idx + 1}</td>
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

export default App;
