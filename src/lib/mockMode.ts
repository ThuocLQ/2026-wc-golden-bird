export function isMockApiEnabled() {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env;
  const mockParam = new URLSearchParams(window.location.search).get("mock");
  if (mockParam === "1") localStorage.setItem("lunch-board-mock-api", "true");
  if (mockParam === "0") localStorage.removeItem("lunch-board-mock-api");
  return viteEnv?.VITE_MOCK_API === "true" || localStorage.getItem("lunch-board-mock-api") === "true";
}
