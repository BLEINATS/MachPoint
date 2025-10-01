import { Participant, Match } from '../types';

// Função para embaralhar um array
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

export const generateBracket = (participants: Participant[]): Match[] => {
  if (participants.length < 2) return [];

  const shuffledParticipants = shuffle([...participants]);
  
  // For simplicity, we'll work with a power of 2.
  // We'll take the first 8 participants for this mock.
  const bracketParticipants = shuffledParticipants.slice(0, 8);
  const numParticipants = bracketParticipants.length;

  if (numParticipants !== 8) {
      alert("Esta demonstração de geração de chaves funciona melhor com 8 participantes.");
  }

  const matches: Match[] = [];
  let matchCounter = 0;

  // Round 1 (Quarter-finals)
  for (let i = 0; i < numParticipants / 2; i++) {
    matches.push({
      id: `match_${matchCounter++}`,
      round: 1,
      matchNumber: i,
      participant_ids: [bracketParticipants[i * 2].id, bracketParticipants[i * 2 + 1].id],
      score: [null, null],
      winner_id: null,
      nextMatchId: `match_${Math.floor(i / 2) + (numParticipants / 2)}`,
    });
  }

  // Round 2 (Semi-finals)
  for (let i = 0; i < numParticipants / 4; i++) {
    matches.push({
      id: `match_${matchCounter++}`,
      round: 2,
      matchNumber: i,
      participant_ids: [null, null],
      score: [null, null],
      winner_id: null,
      nextMatchId: `match_${Math.floor(i / 2) + (numParticipants / 2) + (numParticipants / 4)}`,
    });
  }
  
  // Round 3 (Final)
  matches.push({
    id: `match_${matchCounter++}`,
    round: 3,
    matchNumber: 0,
    participant_ids: [null, null],
    score: [null, null],
    winner_id: null,
    nextMatchId: null, // Final match
  });

  return matches;
};
