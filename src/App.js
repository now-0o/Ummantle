// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import { Sun, Moon } from "lucide-react";
import TypeBadge from "./components/TypeBadge";
import "./App.css";

// Import normalization and weight definitions
import { calculateSimilarityVector, calculateRanks } from "./scoreUtils";

function App() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [similarityVector, setSimilarityVector] = useState(null);
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
      // 미리 계산해둔 전체 유사도 행렬
      const simVec = calculateSimilarityVector(fetched);
      setSimilarityVector(simVec);
      const random = fetched[Math.floor(Math.random() * fetched.length)];
      setAnswer(random);
      setLoading(false);
    }
    initGame();
  }, []);

  // 다크 모드 클래스 토글
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 현재 정답과 비교해서 점수 매기기
  const rankedList = useMemo(() => {
    if (!answer || !similarityVector) return [];
    // similarityVector[i][j]는 i번째와 j번째 포켓몬 유사도(0~1)
    const idxAnswer = allPokemons.findIndex((p) => p.name === answer.name);
    const list = allPokemons
      .map((p, idx) => ({
        ...p,
        score: Math.round(similarityVector[idx][idxAnswer] * 100),
      }))
      .filter((p) => p.name !== answer.name)
      .sort((a, b) => b.score - a.score);
    return [{ ...answer, score: 100 }, ...list];
  }, [allPokemons, answer, similarityVector]);

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

      {/* 입력창 & 자동완성 */}
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

      {/* 정답 표시 */}
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

      {/* 추측 리스트 */}
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

      {/* 순위 모달 */}
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

      {/* 하단 버튼 박스 */}
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
