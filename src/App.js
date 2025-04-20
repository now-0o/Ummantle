// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

function App() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [inputCount, setInputCount] = useState(0);

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
    return allPokemons
      .map((p) => ({ ...p, score: getScore(p, answer) }))
      .sort((a, b) => b.score - a.score);
  }, [allPokemons, answer]);

  const handleGuess = () => {
    const guess = rankedList.find(
      (p) => p.koreanName === input || p.name === input.toLowerCase()
    );
    if (!guess) {
      alert("해당 포켓몬이 없어요!");
      return;
    }
    const rank = rankedList.findIndex((p) => p.name === guess.name) + 1;
    const scoredGuess = { ...guess, rank, inputIndex: inputCount + 1 };
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

  if (loading)
    return <div className="loading">포켓몬 데이터 불러오는 중...</div>;

  const best =
    guesses.length > 0
      ? guesses.reduce((a, b) => (a.rank < b.rank ? a : b))
      : null;
  const others = guesses
    .filter((g) => g.name !== best?.name)
    .sort((a, b) => b.inputIndex - a.inputIndex);

  return (
    <div className="container">
      <h1>Ummantle</h1>
      <div className="input-area">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleGuess()}
          placeholder="포켓몬 이름 입력"
        />
        <button onClick={handleGuess}>입력</button>
      </div>

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
                {best.type1}
                {best.type2 ? "/" + best.type2 : ""}
              </td>
              <td>{best.height}</td>
              <td>{best.weight}</td>
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
                {g.type1}
                {g.type2 ? "/" + g.type2 : ""}
              </td>
              <td>{g.height}</td>
              <td>{g.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="next-btn" onClick={() => window.location.reload()}>
        다음 문제
      </button>
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
