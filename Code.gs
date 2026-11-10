/**
 * Family Planner helper  -  Google Apps Script (free, runs in YOUR Google account)
 * Gives the old tablet a simple, old-browser-friendly feed of your Google Calendars + weather,
 * and lets the tablet ADD events (touch "+ Event").
 *
 * Photos (optional): put pictures in a Google Drive folder, share the folder "Anyone with the link - Viewer",
 * and paste the folder ID (the part after /folders/ in its link) into PHOTO_FOLDER_ID.
 *
 * Setup (5 min, once):
 *  1. Go to https://script.google.com  > New project.  Delete what's there and paste this whole file.
 *  2. Change TOKEN below to any long random word (the same word goes into the PC script).
 *  3. Optional: list only some calendars in ONLY_CALENDARS (by name). Empty = all calendars you see.
 *     Tip: make one calendar per family member (Joe, Mom, Max...) - the tablet colors events by calendar,
 *     using each calendar's own Google color, just like Skylight's color-coded profiles.
 *     Project Settings (gear) > Time zone = (GMT-06:00) Central Time.
 *  4. Deploy > New deployment > type "Web app".  Execute as: Me.  Who has access: Anyone.  Deploy.
 *     Approve the permission prompt.  Copy the Web app URL (ends in /exec).
 *  5. On the tablet: tap the gear button > paste the URL and your TOKEN > Save.
 */
var TOKEN = 'change-me-to-something-long';
var ONLY_CALENDARS = [];              // e.g. ['Joe', 'Mom', 'Max', 'Family']  (empty = all)
var DEFAULT_ADD_CALENDAR = '';        // name of calendar "+ Event" uses when none picked ('' = your main one)
var LAT = 38.5917, LON = -90.5093;    // Manchester, MO
var PHOTO_FOLDER_ID = '';             // optional: Google Drive folder ID for the slideshow (folder shared "Anyone with the link")

function doGet(e) {
  var p = e.parameter, cb = (p.cb || 'cb').replace(/[^\w.]/g, '');
  var out;
  try {
    if (p.token !== TOKEN) throw new Error('bad token');
    if (p.action === 'add') out = addEvent(p);
    else out = { calendars: listCals(), events: getEvents(+p.start, +p.end), weather: getWeather(), photos: getPhotos() };
    out.ok = true;
  } catch (err) { out = { ok: false, error: String(err.message || err) }; }
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function cals() {
  return CalendarApp.getAllCalendars().filter(function (c) {
    return !ONLY_CALENDARS.length || ONLY_CALENDARS.indexOf(c.getName()) >= 0;
  });
}
function listCals() {
  return cals().map(function (c) { return { id: c.getId(), name: c.getName(), color: c.getColor() }; });
}
function getEvents(start, end) {
  var s = new Date(start || Date.now() - 864e5 * 7), en = new Date(end || Date.now() + 864e5 * 42), out = [];
  cals().forEach(function (c) {
    c.getEvents(s, en).forEach(function (ev) {
      out.push({ cal: c.getId(), title: ev.getTitle(), start: ev.getStartTime().getTime(),
                 end: ev.getEndTime().getTime(), allDay: ev.isAllDayEvent(), where: ev.getLocation() });
    });
  });
  out.sort(function (a, b) { return a.start - b.start; });
  return out;
}
function getWeather() {
  var cache = CacheService.getScriptCache(), hit = cache.get('wx');
  if (hit) return JSON.parse(hit);
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
    '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&temperature_unit=fahrenheit&timezone=auto&forecast_days=7';
  var txt = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
  cache.put('wx', txt, 1200);
  return JSON.parse(txt);
}
function getPhotos() {
  if (!PHOTO_FOLDER_ID) return [];
  var it = DriveApp.getFolderById(PHOTO_FOLDER_ID).getFiles(), out = [];
  while (it.hasNext() && out.length < 300) {
    var f = it.next();
    if (/^image\//.test(f.getMimeType())) out.push('https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w1600');
  }
  return out;
}
function addEvent(p) {
  var title = String(p.title || '').substring(0, 200);
  if (!title) throw new Error('missing title');
  var c = (p.cal && CalendarApp.getCalendarById(p.cal)) ||
          (DEFAULT_ADD_CALENDAR && CalendarApp.getCalendarsByName(DEFAULT_ADD_CALENDAR)[0]) || CalendarApp.getDefaultCalendar();
  var d = p.date.split('-');                      // yyyy-mm-dd (tablet local date)
  if (p.allDay === '1') { c.createAllDayEvent(title, new Date(+d[0], d[1] - 1, +d[2])); }
  else {
    var t = (p.time || '09:00').split(':'), st = new Date(+d[0], d[1] - 1, +d[2], +t[0], +t[1]);
    c.createEvent(title, st, new Date(st.getTime() + (+p.mins || 60) * 60000));
  }
  return { added: title };
}
