// src/scoreUtils.js
// JavaScript port of PokéMantle's backend/app/poke2vec.py & score.py logic

// Utility: one-hot 범주형 인코딩 목록 생성
function uniqueSorted(arr) {
  return Array.from(new Set(arr.filter((x) => x != null))).sort();
}

// 연속형 행렬 max 정규화
function maxNormalize(matrix) {
  const cols = matrix[0].length;
  const maxs = Array(cols).fill(0);
  matrix.forEach((row) =>
    row.forEach((v, i) => {
      if (v > maxs[i]) maxs[i] = v;
    })
  );
  return matrix.map((row) => row.map((v, i) => (maxs[i] ? v / maxs[i] : 0)));
}

// 코사인 유사도 계산
function calculateCosineMatrix(mat) {
  const n = mat.length;
  const result = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  const norms = mat.map((row) => Math.sqrt(row.reduce((s, v) => s + v * v, 0)));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dot = mat[i].reduce((s, v, k) => s + v * mat[j][k], 0);
      const sim = norms[i] && norms[j] ? dot / (norms[i] * norms[j]) : 0;
      result[i][j] = result[j][i] = sim;
    }
  }
  return result;
}

// 유클리드 기반 유사도 계산 (1 - normalized distance)
function calculateEuclideanMatrix(mat) {
  const n = mat.length;
  const normed = maxNormalize(mat);
  let maxDist = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dist = Math.sqrt(
        normed[i].reduce((s, v, k) => s + Math.pow(v - normed[j][k], 2), 0)
      );
      if (dist > maxDist) maxDist = dist;
    }
  }
  const result = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dist = Math.sqrt(
        normed[i].reduce((s, v, k) => s + Math.pow(v - normed[j][k], 2), 0)
      );
      const sim = maxDist ? 1 - dist / maxDist : 0;
      result[i][j] = result[j][i] = sim;
    }
  }
  return result;
}

// 전체 유사도 행렬 계산: (cosine*2 + euclidean*1)/3
export function calculateSimilarityVector(pokedex) {
  const df = pokedex;

  // 범주형 one‑hot 인코딩 준비
  const gens = uniqueSorted(df.map((p) => p.generation));
  const statuses = uniqueSorted(df.map((p) => p.status));
  const species = uniqueSorted(df.map((p) => p.species));
  const types = uniqueSorted(df.flatMap((p) => [p.type_1, p.type_2]));
  const abilities = uniqueSorted(
    df.flatMap((p) => [p.ability_1, p.ability_2, p.ability_hidden])
  );
  const growth = uniqueSorted(df.map((p) => p.growth_rate));
  const eggs = uniqueSorted(df.flatMap((p) => [p.egg_type_1, p.egg_type_2]));

  // 카테고리 매트릭스
  const catMat = df.map((p) => [
    ...gens.map((g) => (p.generation === g ? 1 : 0)),
    ...statuses.map((s) => (p.status === s ? 1 : 0)),
    ...species.map((s) => (p.species === s ? 1 : 0)),
    ...types.map((t) => (p.type_1 === t || p.type_2 === t ? 1 : 0)),
    ...abilities.map((a) =>
      [p.ability_1, p.ability_2, p.ability_hidden].includes(a) ? 1 : 0
    ),
    ...growth.map((g) => (p.growth_rate === g ? 1 : 0)),
    ...eggs.map((e) => ([p.egg_type_1, p.egg_type_2].includes(e) ? 1 : 0)),
  ]);

  // 숫자형 매트릭스
  const numCols = [
    "type_number",
    "height_m",
    "weight_kg",
    "abilities_number",
    "total_points",
    "hp",
    "attack",
    "defense",
    "sp_attack",
    "sp_defense",
    "speed",
    "egg_type_number",
    "against_normal",
    "against_fire",
    "against_water",
    "against_electric",
    "against_grass",
    "against_ice",
    "against_fight",
    "against_poison",
    "against_ground",
    "against_flying",
    "against_psychic",
    "against_bug",
    "against_rock",
    "against_ghost",
    "against_dragon",
    "against_dark",
    "against_steel",
    "against_fairy",
  ];
  const numMat = df.map((p) => numCols.map((c) => p[c] || 0));

  // 유사도 행렬 생성
  const cosMat = calculateCosineMatrix(catMat);
  const eucMat = calculateEuclideanMatrix(numMat);

  const n = df.length;
  const simVec = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      simVec[i][j] = (cosMat[i][j] * 2 + eucMat[i][j] * 1) / 3;
    }
  }
  return simVec;
}

// 주어진 index 기준으로 순위 리스트 반환
export function calculateRanks(index, pokedex, similarityVector) {
  const sims = similarityVector[index];
  const idxs = Array.from(sims.keys()).sort((a, b) => sims[b] - sims[a]);
  return idxs.map((i, rank) => ({
    name: pokedex[i].name,
    rank,
    similarity: sims[i],
  }));
}
