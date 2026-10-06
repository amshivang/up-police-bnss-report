# Plan 001: Progressive Web App (PWA) Offline Manifest & Service Worker

- **Target Package**: Root web application
- **Impact**: HIGH (Enables field officers on Android smartphones to install the app like a native police utility with offline caching)
- **Effort**: S (Small)
- **Risk**: LOW

---

## 1. Problem Statement

Field beat officers (बीट आरक्षी एवं हल्का उपनिरीक्षक) in Uttar Pradesh frequently patrol remote rural villages, chakroads, and disputed land sites where cellular network coverage is intermittent. While the current application uses `localStorage` for data persistence, loading the web assets without an initial internet connection requires native PWA offline caching via a Service Worker and Web App Manifest (`manifest.json`).

---

## 2. Proposed Changes

1. **Create `manifest.json`**:
   - `name`: "धारा 126/135 BNSS — चलानी रिपोर्ट"
   - `short_name`: "BNSS 126/135"
   - `start_url`: "./index.html"
   - `display`: "standalone"
   - `background_color`: "#002147"
   - `theme_color`: "#002147"
   - `icons`: Reference `assets/up_police_logo_512.png`

2. **Create `sw.js` (Service Worker)**:
   - Cache-first strategy for `index.html`, `app.css`, `app.js`, `assets/up_police_logo_512.png`, `assets/up_seal.svg`, and `assets/libs/html2pdf.bundle.min.js`.
   - Automatic cache versioning (`upp-bnss-v1`).

3. **Register Service Worker in `index.html`**:
   ```javascript
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('./sw.js').catch(console.error);
     });
   }
   ```

---

## 3. Verification Criteria

- [ ] Chrome DevTools > Application > Manifest shows valid PWA install banner.
- [ ] Toggling DevTools Network tab to "Offline" and refreshing loads the entire application without error.
- [ ] "Install App" icon appears in browser URL bar.
