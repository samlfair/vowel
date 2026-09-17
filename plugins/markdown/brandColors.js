// Vowel's brand pair, the seeds every default-theme site falls back to
// when `theme.colors` isn't configured (see colorScheme.js).
//
// Its own module because both halves need it and they cannot share a
// file: colorScheme.js imports colorhorse, which has no business in the
// browser bundle, while the settings panel needs the same two values to
// show what the colour pickers are actually defaulting to. Same
// arrangement as typography.js and editor/directives.js - keep it free of
// node builtins.
export const fallbackColors = ["#5119ff", "#00edc6"]
