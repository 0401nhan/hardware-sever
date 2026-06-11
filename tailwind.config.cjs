module.exports = {
  content: ["./src/**/*.js", "./app.js", "./public/**/*.html"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f97316",
          strong: "#ea580c",
          soft: "#fff7ed",
        },
      },
      boxShadow: {
        panel: "0 10px 24px rgba(15, 23, 42, 0.06)",
        lift: "0 14px 30px rgba(15, 23, 42, 0.1)",
      },
    },
  },
};
