import React, { useEffect, useState, useMemo, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import TypeBadge from "./components/TypeBadge";
import "./App.css";
import { calculateSimilarityVector } from "./scoreUtils";

export default function Pokemantle({ onBack }) {
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
  const [darkMode, setDarkMode] = useState(false);
  const [selectedName, setSelectedName] = useState(null);
  const suggestionsRef = useRef(null);

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

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (suggestionsRef.current && highlightIndex >= 0) {
      const el = suggestionsRef.current.children[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const rankedList = useMemo(() => {
    if (!answer || !simVec) return [];
    const idx = allPokemons.findIndex((p) => p.name === answer.name);
    const list = allPokemons
      .map((p, i) => ({ ...p, score: Math.round(simVec[i][idx] * 100) }))
      .filter((p) => p.name !== answer.name)
      .sort((a, b) => b.score - a.score);
    return [{ ...answer, score: 100 }, ...list];
  }, [allPokemons, answer, simVec]);

  const selectSuggestion = (i) => {
    if (i >= 0 && i < suggestions.length) {
      setInput(suggestions[i].koreanName);
      setSuggestions([]);
      setHighlightIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
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
    } else {
      const idx = rankedList.findIndex((p) => p.name === guess.name);
      const prevItem = guesses.find((x) => x.name === guess.name);
      const newIndex = prevItem ? prevItem.inputIndex : inputCount + 1;
      const g = {
        ...guess,
        rank: idx + 1,
        score: rankedList[idx].score,
        inputIndex: newIndex,
      };
      setGuesses((prev) => {
        const filtered = prev.filter((x) => x.name !== g.name);
        return [...filtered, g];
      });
      if (!prevItem) {
        setInputCount((i) => i + 1);
      }
    }
    setInput("");
    setSuggestions([]);
    setHighlightIndex(-1);
  };

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

  const handleReveal = () => {
    if (window.confirm("정말 정답을 보시겠습니까?"))
      setCorrect({ ...answer, inputIndex: "?", score: 100 });
    setRevealed(true);
  };

  if (loading)
    return <div className="loading">포켓몬 데이터 불러오는 중...</div>;

  const latest = guesses.length ? guesses[guesses.length - 1] : null;
  const others = guesses
    .filter((g) => g.name !== latest?.name)
    .sort((a, b) => a.rank - b.rank);
  const displayList = latest ? [latest, ...others] : others;
  const toggleDetail = (name) =>
    setSelectedName((prev) => (prev === name ? null : name));

  return (
    <div className="container">
      <button onClick={onBack}>메인으로 돌아가기</button>
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
          {displayList.map((g) => (
            <React.Fragment key={g.name}>
              {/* 1) 클릭 행 */}
              <tr
                onClick={() => toggleDetail(g.name)}
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
              {/* 2) 상세정보 토글 */}
              {selectedName === g.name && (
                <tr className="detail-row">
                  <td colSpan={8}>
                    <table className="detail-table">
                      <tbody>
                        <tr>
                          <td rowSpan={5} className="detail-img-cell">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${g.pokedex_number}.png`}
                              alt={g.koreanName}
                              onError={(e) =>
                                (e.target.src = "/placeholder.png")
                              }
                              className="detail-img-large"
                            />
                          </td>
                          <th>이름</th>
                          <td colSpan={2}>
                            {g.koreanName} ({g.name})
                          </td>
                          <th>분류</th>
                          <td>{g.species}</td>
                        </tr>
                        <tr>
                          <th>세대</th>
                          <td colSpan={2}>{g.generation}세대</td>
                          <th>유사도</th>
                          <td>{g.score}점</td>
                        </tr>
                        <tr>
                          <th>키</th>
                          <td colSpan={2}>{g.height_m}m</td>
                          <th>몸무게</th>
                          <td>{g.weight_kg}kg</td>
                        </tr>
                        <tr>
                          <th>타입</th>
                          <td colSpan={2}>
                            <TypeBadge type={g.type_1.toLowerCase()} />
                            {g.type_2 && (
                              <TypeBadge type={g.type_2.toLowerCase()} />
                            )}
                          </td>
                          <th>알그룹</th>
                          <td>
                            {g.egg_type_1}
                            {g.egg_type_2 ? `, ${g.egg_type_2}` : ""}
                          </td>
                        </tr>
                        <tr>
                          <th>능력치</th>
                          <td colSpan={4}>
                            HP: {g.hp}, ATK: {g.attack}, DEF: {g.defense},<br />
                            S‑ATK: {g.sp_attack}, S‑DEF: {g.sp_defense}, SPD:{" "}
                            {g.speed}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
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
