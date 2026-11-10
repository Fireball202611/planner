# Family Planner (Skylight-style wall calendar for old Android tablets)

Open https://fireball202611.github.io/planner/ in Fully Kiosk Browser (Android 4.4+).
Everything you set is stored only on the tablet (localStorage). No personal data lives in this repo.

- Tap the gear button (bottom right) for Settings: Apps Script link + token, chores, lists, photo links, idle time, town/lat/lon.
- Calendars, "+ Event", and Drive photos come from your own copy of `Code.gs` deployed as a Google Apps Script web app.
- Android 4.4 note: github.io and Open-Meteo use Let's Encrypt certificates, which Android 4.4 doesn't trust.
  In Fully Kiosk: Settings > Advanced Web Settings > Ignore SSL Errors = ON.
