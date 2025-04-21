// src/App.js
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [inputCount, setInputCount] = useState(0);
  const [correct, setCorrect] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const suggestionsRef = useRef(null);

  // 초기 데이터 로드 및 유사도 행렬 계산
  useEffect(() => {
    async function init() {
      const res = await fetch("/enriched_pokemons.json");
      const data = await res.json();
      setAllPokemons(data);
      const matrix = calculateSimilarityVector(data);
      setSimVec(matrix);
      const rand = data[Math.floor(Math.random() * data.length)];
      setAnswer(rand);
      setLoading(false);
    }
    init();
  }, []);

  // 다크모드 토글
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 자동완성 하이라이트 스크롤
  useEffect(() => {
    if (suggestionsRef.current && highlightIndex >= 0) {
      const list = suggestionsRef.current.children;
      const el = list[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  // 순위 리스트 계산
  const rankedList = useMemo(() => {
    if (!answer || !simVec) return [];
    const idx = allPokemons.findIndex((p) => p.name === answer.name);
    const list = allPokemons
      .map((p, i) => ({ ...p, score: Math.round(simVec[i][idx] * 100) }))
      .filter((p) => p.name !== answer.name)
      .sort((a, b) => b.score - a.score);
    return [{ ...answer, score: 100 }, ...list];
  }, [allPokemons, answer, simVec]);

  // 제안 선택
  const selectSuggestion = (i) => {
    if (i >= 0 && i < suggestions.length) {
      setInput(suggestions[i].koreanName);
      setSuggestions([]);
      setHighlightIndex(-1);
    }
  };

  // 키보드 이벤트
  const handleKeyDown = (e) => {
    // 제안이 1개이고 입력과 일치하면 바로 제출
    if (suggestions.length === 1 && e.key === "Enter") {
      const s = suggestions[0];
      if (s.koreanName === input || s.name === input.toLowerCase()) {
        e.preventDefault();
        handleGuess();
        return;
      }
    }
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        selectSuggestion(highlightIndex);
        return;
      }
    }
    if (e.key === "Enter") handleGuess();
  };

  // 추측 처리
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
    } else {
      const idx = rankedList.findIndex((p) => p.name === guess.name);
      const g = {
        ...guess,
        rank: idx + 1,
        score: rankedList[idx].score,
        inputIndex: inputCount + 1,
      };
      setGuesses((prev) =>
        prev.some((x) => x.name === g.name) ? prev : [...prev, g]
      );
    }
    setInputCount((i) => i + 1);
    setInput("");
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  // 입력 변화
  const handleInputChange = (e) => {
    const v = e.target.value;
    setInput(v);
    if (!v.trim()) {
      setSuggestions([]);
      setHighlightIndex(-1);
      return;
    }
    const m = allPokemons.filter(
      (p) => p.koreanName.includes(v) || p.name.includes(v.toLowerCase())
    );
    setSuggestions(m.slice(0, 10));
    setHighlightIndex(0);
  };

  // 정답 공개
  const handleReveal = () => {
    if (window.confirm("정말 정답을 보시겠습니까?"))
      setCorrect({ ...answer, inputIndex: "?", score: 100 });
    setRevealed(true);
  };

  if (loading)
    return <div className="loading">포켓몬 데이터 불러오는 중...</div>;

  //best, latest, others
  const best =
    guesses.length > 0
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

      {/* 입력 영역 */}
      <div className="input-area">
        <div className="input-wrapper">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="포켓몬 이름 입력"
            disabled={!!correct}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions" ref={suggestionsRef}>
              {suggestions.map((s, i) => (
                <li
                  key={s.name}
                  className={i === highlightIndex ? "highlighted" : ""}
                  onMouseEnter={() => setHighlightIndex(i)}
                  onClick={() => selectSuggestion(i)}
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

      {/* 정답 박스 */}
      {correct && (
        <div className="correct-box">
          <h2>🎉 정답입니다! 🎉</h2>
          <p>{correct.inputIndex}회 만에 맞추셨습니다!</p>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${correct.pokedex_number}.png`}
            alt={correct.koreanName}
            onError={(e) => (e.target.src = "/placeholder.png")}
            width="80"
            height="80"
          />
          <h3>
            {correct.koreanName} ({correct.name})
          </h3>
        </div>
      )}

      {/* 히스토리 테이블 */}
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
            <tr
              key={best.name}
              onClick={() => setSelected(best)}
              style={{ cursor: "pointer" }}
            >
              <td>{best.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${best.pokedex_number}.png`}
                  alt={best.koreanName}
                  onError={(e) => (e.target.src = "/placeholder.png")}
                  width="40"
                  height="40"
                />
              </td>
              <td>{best.koreanName}</td>
              <td>{best.rank}</td>
              <td>{best.score}점</td>
              <td>
                <TypeBadge type={best.type_1.toLowerCase()} />
                {best.type_2 && <TypeBadge type={best.type_2.toLowerCase()} />}
              </td>
              <td>{best.height_m}m</td>
              <td>{best.weight_kg}kg</td>
            </tr>
          )}
          {latest && latest.name !== best?.name && (
            <tr
              key={latest.name}
              onClick={() => setSelected(latest)}
              style={{ cursor: "pointer" }}
            >
              <td>{latest.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${latest.pokedex_number}.png`}
                  alt={latest.koreanName}
                  onError={(e) => (e.target.src = "/placeholder.png")}
                  width="40"
                  height="40"
                />
              </td>
              <td>{latest.koreanName}</td>
              <td>{latest.rank}</td>
              <td>{latest.score}점</td>
              <td>
                <TypeBadge type={latest.type_1.toLowerCase()} />
                {latest.type_2 && (
                  <TypeBadge type={latest.type_2.toLowerCase()} />
                )}
              </td>
              <td>{latest.height_m}m</td>
              <td>{latest.weight_kg}kg</td>
            </tr>
          )}
          {others.map((g) => (
            <tr
              key={g.name}
              onClick={() => setSelected(g)}
              style={{ cursor: "pointer" }}
            >
              <td>{g.inputIndex}</td>
              <td>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${g.pokedex_number}.png`}
                  alt={g.koreanName}
                  onError={(e) => (e.target.src = "/placeholder.png")}
                  width="40"
                  height="40"
                />
              </td>
              <td>{g.koreanName}</td>
              <td>{g.rank}</td>
              <td>{g.score}점</td>
              <td>
                <TypeBadge type={g.type_1.toLowerCase()} />
                {g.type_2 && <TypeBadge type={g.type_2.toLowerCase()} />}
              </td>
              <td>{g.height_m}m</td>
              <td>{g.weight_kg}kg</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 하단 버튼 */}
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
                {rankedList.slice(0, 30).map((p, i) => (
                  <tr key={p.name}>
                    <td>{i + 1}</td>
                    <td>
                      {p.koreanName} ({p.name})
                    </td>
                    <td>{p.score}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="next-btn"
              style={{ backgroundColor: "#aaa", marginTop: 16 }}
              onClick={() => setShowRanking(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
