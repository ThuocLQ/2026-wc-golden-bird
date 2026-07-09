let activeMutations = 0;

export function beginMutation() {
  activeMutations += 1;
}

export function endMutation() {
  activeMutations = Math.max(0, activeMutations - 1);
}

export function hasActiveMutation() {
  return activeMutations > 0;
}
