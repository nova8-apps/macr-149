const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.useWatchman = false;

const { assetExts, sourceExts } = config.resolver;
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Native-only modules that should be stubbed out on web to avoid bundling heavy
// native-only code paths (shaves 5-15s off web bundle cold-start).
// Native-only modules stubbed on web because they're pure native-bridge code
// with no working web fallback. We've progressively removed modules that DO
// have working web support:
//   - @react-navigation/bottom-tabs + react-native-screens: work on web via
//     React DOM; needed for any generated app using expo-router Tabs.
//   - @legendapp/motion: explicitly supports react-native-web per its docs
//     ("Supports react-native and react-native-web"). Stubbing it crashed
//     any generated code that used Motion.View, AnimatePresence, or
//     createMotionAnimatedComponent — including a lot of gluestack
//     sub-components (select, toast, and others without .web.tsx).
// Keeping the remaining set small: every one below is either a C++-native
// bridge (no JS fallback) or a wrapper whose web story is handled by our
// .web.tsx stubs in gluestack-kit.
const WEB_STUBBED_MODULES = new Set([
  "react-native-pager-view",
  "react-native-tab-view",
  "react-native-gesture-handler",
  "@gorhom/bottom-sheet",
  "@gorhom/portal",
]);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  useWatchman: false,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web") {
      // Exact match OR scoped/subpath match (e.g. "react-native-pager-view/lib/...")
      for (const stub of WEB_STUBBED_MODULES) {
        if (moduleName === stub || moduleName.startsWith(stub + "/")) {
          return { type: "empty" };
        }
      }
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
