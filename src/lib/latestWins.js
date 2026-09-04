// Guards against out-of-order async responses: only the most recently
// started call is allowed to apply its result. Older calls that resolve
// later (e.g. a slow poll landing after a newer manual refetch) are
// dropped by checking isCurrent(token) before writing state.
export function createLatestWins() {
  let seq = 0;
  return {
    start() {
      return ++seq;
    },
    isCurrent(token) {
      return token === seq;
    }
  };
}
