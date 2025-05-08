import "./App.css";
import React, { useState } from "react";
import Pokemantle from "./Pokemantle";
import PokemonQuiz from "./PokemonQuiz";
import PokemonQuizPixel from "./PokemonQuizPixel";

export default function App() {
  const [view, setView] = useState("menu");

  return (
    <div className="app-container">
      {view === "menu" && (
        <div className="menu">
          <h1>엄켓몬</h1>
          <button onClick={() => setView("mantle")}>포켓맨틀 시작</button>
          <button onClick={() => setView("quizImg")}>
            포켓몬 퀴즈(이미지) 시작
          </button>
          <button onClick={() => setView("quizPix")}>
            포켓몬 퀴즈(픽셀) 시작
          </button>
        </div>
      )}
      {view === "mantle" && <Pokemantle onBack={() => setView("menu")} />}
      {view === "quizImg" && <PokemonQuiz onBack={() => setView("menu")} />}
      {view === "quizPix" && (
        <PokemonQuizPixel onBack={() => setView("menu")} />
      )}
    </div>
  );
}
