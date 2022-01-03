module.exports = {
  "roots": [
    "<rootDir>/shared",
    "<rootDir>/src",
    "<rootDir>/webviews"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
}
