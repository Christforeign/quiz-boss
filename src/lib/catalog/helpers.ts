import type { QuizQuestion } from "../hardQuestions";

export function pickDistractors(correct: string, pool: string[], seed = 0): string[] {
  const candidates = pool.filter((x) => x !== correct);
  const out: string[] = [];
  let idx = Math.abs(seed) % Math.max(1, candidates.length);
  while (out.length < 3 && candidates.length > 0) {
    const item = candidates[idx % candidates.length]!;
    if (!out.includes(item)) out.push(item);
    idx = (idx + 7) % candidates.length;
    if (out.length < 3 && idx === Math.abs(seed) % candidates.length) {
      for (const c of candidates) {
        if (!out.includes(c) && out.length < 3) out.push(c);
      }
      break;
    }
  }
  // En cas d'insuffisance, compléter avec des valeurs sûres
  const fallback = ["Autre", "Aucune de ces réponses", "Variable", "Indéterminé"];
  let fi = 0;
  while (out.length < 3) {
    const fb = fallback[fi++] || `Option ${out.length + 1}`;
    if (!out.includes(fb) && fb !== correct) out.push(fb);
  }
  return [correct, ...out.slice(0, 3)];
}

export function dedupeQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>();
  const out: QuizQuestion[] = [];
  for (const q of questions) {
    const key = q.question.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}
