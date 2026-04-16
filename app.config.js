module.exports =
{
  "expo": {
    "name": "Calzz",
    "slug": "calzz",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "calzz",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.dormsdots",
      "entitlements": {
        "com.apple.security.application-groups": [
          "group.com.dormsdots"
        ]
      },
      "buildNumber": "2"
    },
    "android": {
      "package": "com.dormsdots",
      "adaptiveIcon": {
        "backgroundColor": "#000000",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON,
      "versionCode": 2
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://replit.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "@react-native-google-signin/google-signin"
      ],
      "expo-sqlite",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/IMG_0329 (2).png",
          "color": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "router": {
        "origin": "https://replit.com/"
      },"eas": {
        "projectId": "98a9acda-3925-4b87-8370-90ca9b4840bc"
      }
    }
  }
}
