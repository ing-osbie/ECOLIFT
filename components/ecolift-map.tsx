// Platform-specific map implementation.
//
// - Native (Android/iOS): `ecolift-map.native.tsx` renders OpenStreetMap tiles
//   using `react-native-maps`.
// - Web: `ecolift-map.web.tsx` renders an OpenStreetMap embed.
//
// Metro resolves this file to the correct platform variant at bundle time.
// This base module exists so TypeScript has a resolvable declaration.
export { EcoliftMap } from "./ecolift-map.native";
