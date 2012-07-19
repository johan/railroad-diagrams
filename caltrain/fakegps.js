// generate one-shot mock-up gps logs via copy(json(fake(schedule))), or a day's
// worth of gps logs for all trains: copy(fakeMany(schedules))

var NOISE_LEVEL = 0.5 // how much gps noise to add to readouts
  , PRECISION = 6  // digits of precision
  , schedule = {"id":260,"type":"Limited","stops":[{"t":"15:37","s":56220},null,null,null,{"t":"15:51","s":57060},{"t":"15:55","s":57300},null,{"t":"15:59","s":57540},{"t":"16:02","s":57720},null,{"t":"16:06","s":57960},{"t":"16:09","s":58140},{"t":"16:12","s":58320},{"t":"16:17","s":58620},null,{"t":"16:22","s":58920},{"t":"16:25","s":59100},null,{"t":"16:29","s":59340},{"t":"16:33","s":59580},{"t":"16:37","s":59820},{"t":"16:42","s":60120},{"t":"16:46","s":60360},{"t":"16:51","s":60660},null,{"t":"17:00","s":61200},{"t":"17:07","s":61620},null,null,null,null,null]}
, stations =
[ [37.776439, -122.394322]
, [37.757674, -122.392636]
, [37.709544, -122.401318]
, [37.657013, -122.405516]
, [37.624256, -122.408444]
, [37.600006, -122.386534]
, [37.587466, -122.363233]
, [37.579719, -122.345266]
, [37.568209, -122.323933]
, [37.552346, -122.308916]
, [37.537503, -122.298001]
, [37.520504, -122.276075]
, [37.507361, -122.260365]
, [37.485412, -122.231957]
, [37.464349, -122.198106]
, [37.454604, -122.182518]
, [37.443070, -122.164900]
, [37.437895, -122.155513]
, [37.428835, -122.142703]
, [37.406163, -122.105787]
, [37.393879, -122.076327]
, [37.377589, -122.030116]
, [37.371578, -121.996982]
, [37.352915, -121.936376]
, [37.342170, -121.914998]
, [37.330196, -121.901985]
, [37.311680, -121.882087]
, [37.284359, -121.841589]
, [37.252801, -121.797369]
, [37.129081, -121.650721]
, [37.085775, -121.610809]
, [37.003084, -121.567091]
]
;

function fakeMany(schedules, name) {
  var track = '', sep = '{';
  schedules.forEach(function addTrack(t) {
    track += sep + JSON.stringify(name +'-'+ t.id) +':'+ json(fake(t), '');
    sep = ',';
  });
  return track +'}\n';
}

function fake(schedule) {
  var skips = schedule.stops.map(nil)
    , stop1 = skips.indexOf(false)
    , stopN = skips.lastIndexOf(false)
    , first = schedule.stops[stop1]
    , last  = schedule.stops[stopN]
    , track = []
    , t_res = 10 // one gps readout every 10s
    , stop  = stop1, stop_t, stop_coord
    , next,          next_t, next_coord
    , step, steps
    ;

  for (stop = stop1;
       -1 !== (next = skips.indexOf(false, stop + 1));
       stop = next, stop_t = next_t) {
    stop_coord = stations[stop];
    next_coord = stations[next];
    stop_t = stop_t || schedule.stops[stop].s;
    next_t = schedule.stops[next].s;
    if (next_t < stop_t) next_t += 24 * 60 * 60; // end-of-day wrap-around
    steps = Math.ceil((next_t - stop_t) / t_res);
    if (window.names) console.log(schedule.stops[stop].t +' in '+ names[stop]);
    for (step = 0; step < steps; step++) {
    //track = track.concat(readingBetween(stop_coord, next_coord, step, steps));
      track.push(readingBetween(stop_coord, next_coord, step, steps));
    }
  }

  return track;
}

function I(i) { return i; }
function nil(v) { return v === null; }

function readingBetween(p1, p2, step, steps) {
  var y1 = p1[0], y2 = p2[0], dy = y2 - y1
    , x1 = p1[1], x2 = p2[1], dx = x2 - x1
    , fuzz = Math.min(dy, dx) / steps * NOISE_LEVEL
    , at = step / steps
    , rx = x1 + dx * at + fuzz * (Math.random() - 0.5)
    , ry = y1 + dy * at + fuzz * (Math.random() - 0.5)
    ;
  return [ry, rx];
}

function json(t, n) {
  var js = '', sep = '[', nl = n === undefined ? '\n' : n, prec = PRECISION;
  t.forEach(function(pair) {
    js += sep + '['+ pair[0].toFixed(prec) +','+ pair[1].toFixed(prec) +']'+ nl;
    sep = ',';
  });
  return js +']\n';
}
