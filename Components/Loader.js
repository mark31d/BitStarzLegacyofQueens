// Components/Loader.js
import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const htmlLoader = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    /* Во всю высоту/ширину прозрачный фон */
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding-bottom: 100px;
      overflow: hidden;
    }

    /* треугольники */
    .triangles {
      position: relative;
      width: 90px;
      height: 81px;
      transform: translateZ(0);
    }

    .tri {
      position: absolute;
      animation: pulse_51 750ms ease-in infinite;
      border-top: 27px solid #215A6D;
      border-left: 15px solid transparent;
      border-right: 15px solid transparent;
      border-bottom: 0;
      will-change: opacity;
    }

    .tri.invert {
      border-top: 0;
      border-bottom: 27px solid #215A6D;
      border-left: 15px solid transparent;
      border-right: 15px solid transparent;
    }

    .tri:nth-child(1) { left: 30px; }
    .tri:nth-child(2) { left: 15px; top: 27px; animation-delay: -125ms; }
    .tri:nth-child(3) { left: 30px; top: 27px; }
    .tri:nth-child(4) { left: 45px; top: 27px; animation-delay: -625ms; }
    .tri:nth-child(5) { top: 54px; animation-delay: -250ms; }
    .tri:nth-child(6) { top: 54px; left: 15px; animation-delay: -250ms; }
    .tri:nth-child(7) { top: 54px; left: 30px; animation-delay: -375ms; }
    .tri:nth-child(8) { top: 54px; left: 45px; animation-delay: -500ms; }
    .tri:nth-child(9) { top: 54px; left: 60px; animation-delay: -500ms; }

    @keyframes pulse_51 {
      0% { opacity: 1; }
      16.666% { opacity: 1; }
      100% { opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="triangles">
    <div class="tri invert"></div>
    <div class="tri invert"></div>
    <div class="tri"></div>
    <div class="tri invert"></div>
    <div class="tri invert"></div>
    <div class="tri"></div>
    <div class="tri invert"></div>
    <div class="tri"></div>
    <div class="tri invert"></div>
  </div>
</body>
</html>
`;

export default function Loader({ onFinish, delay = 8000 }) {
  useEffect(() => {
    if (!onFinish) return;
    const timer = setTimeout(onFinish, delay);
    return () => clearTimeout(timer);
  }, [onFinish, delay]);

  return (
    <ImageBackground source={require('../assets/bg.webp')} style={styles.container} resizeMode="cover">
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlLoader }}
        style={styles.webview}
        scrollEnabled={false}
        androidLayerType="none"
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
