// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import TypeBadge from "./components/TypeBadge";
import "./App.css";

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
      setInputCount((prev) => prev + 1);
      setInput("");
      setSuggestions([]);
      return;
    }

    const rank = rankedList.findIndex((p) => p.name === guess.name);
    const scoredGuess = {
      ...guess,
      rank: rank + 1,
      score: rankedList[rank].score,
      inputIndex: inputCount + 1,
    };
    setGuesses((prev) => {
      const exists = prev.find((g) => g.name === scoredGuess.name);
      if (exists) return prev;
      return [...prev, scoredGuess];
    });
    setInputCount((prev) => prev + 1);
    setInput("");
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    const matched = allPokemons.filter(
      (p) =>
        p.koreanName.includes(value) || p.name.includes(value.toLowerCase())
    );
    setSuggestions(matched.slice(0, 10));
  };

  const handleReveal = () => {
    if (window.confirm("정말 정답을 보시겠습니까?")) {
      setCorrect({ ...answer, inputIndex: "?", score: 100 });
      setRevealed(true);
    }
  };

  if (loading)
    return <div className="loading">포켓몬 데이터 불러오는 중...</div>;

  const best =
    guesses.length > 0
      ? guesses.reduce((a, b) => (a.rank < b.rank ? a : b))
      : null;

  const latest = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  const others = guesses
    .filter((g) => g.name !== best?.name && g.name !== latest?.name)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="container">
      <h1>Pokemantle</h1>
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
        <div className="correct-box">
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

function getScore(a, b) {
  if (!a || !b) return 0;
  let score = 0;
  if (a.type1 === b.type1) score += 20;
  if (a.type2 === b.type2) score += 10;
  score -= Math.abs((a.height ?? 0) - (b.height ?? 0)) * 2;
  score -= Math.abs((a.weight ?? 0) - (b.weight ?? 0)) * 1;
  if (a.evolution_stage === b.evolution_stage) score += 15;
  if (a.generation === b.generation) score += 15;
  score -= Math.abs((a.base_experience ?? 0) - (b.base_experience ?? 0)) * 0.2;
  score -= Math.abs((a.capture_rate ?? 0) - (b.capture_rate ?? 0)) * 0.2;
  const sharedEggs = (a.egg_groups ?? []).filter((group) =>
    (b.egg_groups ?? []).includes(group)
  );
  score += sharedEggs.length * 10;
  if ((a.strong_against ?? []).includes(b.type1)) score += 5;
  if ((a.weak_against ?? []).includes(b.type1)) score -= 5;
  return Math.max(0, Math.min(100, score));
}

export default App;
