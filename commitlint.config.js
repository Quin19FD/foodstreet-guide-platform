export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "done", "refactor", "docs", "style", "test", "perf"],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "poi",
        "location",
        "payment",
        "order",
        "district",
        "tts",
        "media",
        "analytics",
        "qr",
        "web",
        "admin",
      ],
    ],
    "subject-case": [0],
  },
};
