import React, { useState, useEffect } from "react";
import "./PokemonQuiz.css";

const ZOOM_SCALE_PIXEL = 10; // 픽셀 버전 줌 배율 (픽셀 강조)
const PAN_SPEED_PIXEL = ZOOM_SCALE_PIXEL;

export default function PokemonQuizPixel({ onBack }) {
  const [pokemon, setPokemon] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showNext, setShowNext] = useState(false);

  const loadPokemon = async () => {
    const mapRes = await fetch("/enriched_pokemons.json");
    const mapData = await mapRes.json();
    const rand = mapData[Math.floor(Math.random() * mapData.length)];
    const imgRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${rand.name}`
    );
    const imgData = await imgRes.json();
    setPokemon({
      koreanName: rand.koreanName,
      image: imgData.sprites.front_default,
    });
    setGuess("");
    setFeedback("");
    setPosition({ x: 0, y: 0 });
    setShowNext(false);
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  const startDrag = (x, y) => {
    setDragging(true);
    setStartPos({ x: x - position.x, y: y - position.y });
  };
  const moveDrag = (x, y) => {
    if (!dragging) return;
    const dx = ((x - startPos.x) / ZOOM_SCALE_PIXEL) * PAN_SPEED_PIXEL;
    const dy = ((y - startPos.y) / ZOOM_SCALE_PIXEL) * PAN_SPEED_PIXEL;
    setPosition({ x: dx, y: dy });
  };
  const endDrag = () => setDragging(false);

  const submitGuess = () => {
    if (!pokemon || showNext) return;
    setFeedback(
      guess.trim() === pokemon.koreanName
        ? "정답입니다!"
        : `틀렸습니다! 정답은 ${pokemon.koreanName}입니다.`
    );
    setShowNext(true);
  };

  if (!pokemon) return <div className="loading">로딩 중...</div>;

  return (
    <div className="quiz-container">
      <button onClick={onBack}>메인으로 돌아가기</button>
      <div
        className="zoom-container2"
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          e.preventDefault();
          moveDrag(e.clientX, e.clientY);
        }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          startDrag(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          moveDrag(t.clientX, t.clientY);
        }}
        onTouchEnd={endDrag}
      >
        <img
          src={pokemon.image}
          alt="pokemon"
          className="zoom-image"
          style={{
            transform: `scale(${ZOOM_SCALE_PIXEL}) translate(${position.x}px, ${position.y}px)`,
          }}
          draggable={false}
        />
      </div>
      <div className="guess-area">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitGuess()}
          placeholder="포켓몬 이름(한글)"
          disabled={showNext}
        />
        <button onClick={submitGuess} disabled={showNext}>
          제출
        </button>
      </div>
      {feedback && <p className="feedback">{feedback}</p>}
      {showNext && (
        <button className="next-button" onClick={loadPokemon}>
          다음 문제
        </button>
      )}
    </div>
  );
}
