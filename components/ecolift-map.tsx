// Platform-specific map implementation.
//
// - Native (Android/iOS): `ecolift-map.native.tsx` renders the real Google Map
//   using `react-native-maps`.
// - Web: `ecolift-map.web.tsx` renders a lightweight vector preview, avoiding
//   the native-only `react-native-maps` module that cannot load in a browser.
//
// Metro resolves this file to the correct platform variant at bundle time.
// This base module exists so TypeScript has a resolvable declaration.
export { EcoliftMap } from "./ecolift-map.native";
