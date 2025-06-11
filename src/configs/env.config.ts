export const envConfig = {
  be: {
    url: import.meta.env.VITE_BACK_END_URL || "http://localhost:3001",
  },

  animate: {
    fade: import.meta.env.VITE_ANIMATE_FADE || 1,
    float: import.meta.env.VITE_ANIMATE_FLOAT || 1,
  }
};