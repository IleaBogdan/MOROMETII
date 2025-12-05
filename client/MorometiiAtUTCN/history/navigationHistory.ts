let history: string[] = [];

export const addToHistory = (path: string) => {
  if (history[history.length - 1] !== path) {
    history.push(path);
  }
};

export const getPrevPath = () => {
  history.pop();
  return history[history.length - 1] || "/(tabs)/home";
};
