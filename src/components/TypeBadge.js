// src/components/TypeBadge.js
import React from "react";

const typeMap = {
  normal: { label: "노말", color: "#A8A878" },
  fire: { label: "불꽃", color: "#F08030" },
  water: { label: "물", color: "#6890F0" },
  electric: { label: "전기", color: "#F8D030" },
  grass: { label: "풀", color: "#78C850" },
  ice: { label: "얼음", color: "#98D8D8" },
  fighting: { label: "격투", color: "#C03028" },
  poison: { label: "독", color: "#A040A0" },
  ground: { label: "땅", color: "#E0C068" },
  flying: { label: "비행", color: "#A890F0" },
  psychic: { label: "에스퍼", color: "#F85888" },
  bug: { label: "벌레", color: "#A8B820" },
  rock: { label: "바위", color: "#B8A038" },
  ghost: { label: "고스트", color: "#705898" },
  dragon: { label: "드래곤", color: "#7038F8" },
  dark: { label: "악", color: "#705848" },
  steel: { label: "강철", color: "#B8B8D0" },
  fairy: { label: "페어리", color: "#EE99AC" },
};

function TypeBadge({ type }) {
  const key = (type || "").toLowerCase();
  const t = typeMap[key] || { label: key, color: "#CCC" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: "8px",
        backgroundColor: t.color,
        color: "white",
        fontSize: "12px",
        marginRight: "4px",
        minWidth: "40px",
        textAlign: "center",
      }}
    >
      {t.label}
    </span>
  );
}

export default TypeBadge;
