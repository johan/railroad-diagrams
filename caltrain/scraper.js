// visit http://www.caltrain.com/schedules/weekdaytimetable.html
//    or http://www.caltrain.com/schedules/weekendtimetable.html
// in Chrome, open the javascript console, paste this code in it
// to let you export mostly well-formed schedules via copy(n()),
// copy(s()), which puts the JSON on your clipboard for pasting.

function s() { return json(south); }
function n() { return json(north); }

function weekend(schedule) {
  schedule.forEach(function dropShuttles(train) {
    train.stops.splice(-2); // drop the SJ and Tamien shuttle stops
  });
  schedule.forEach(function addMissingStations(train) {//Stanford, College Park,
    // Tamien, Capitol, Blossom Hill, Morgan Hill, San Martin and Gilroy
    [17, 24, 27, 28, 29, 30, 31, 32].forEach(function addNonStop(at) {
      train.stops.splice(at, 0, null); // inject a null (=non-)stop here
    });
  });
  return schedule;
}

function weekday(schedule) {
  schedule.forEach(function addMissingStations(train) {
    [6, 14, 17].forEach(function addNonStop(at) { // Broadway,Atherton,Stanford
      train.stops.splice(at, 0, null); // inject a null (=non-)stop here
    });
  });
  return schedule;
}

function colorTable(legend) {
  var col_to_type = {};
  legend.forEach(function(td) {
    var col = td.getAttribute('bgcolor');
    if (!col_to_type[col])
      col_to_type[col] = td.textContent.trim().replace(/\d+\s*|-.*/g, '');
  });
  return col_to_type;
}

function trains(root, reverse) {
  function text(node) { return node.textContent.trim().replace(/\s+/i, ' '); }
  function holds_numbers(node) {
    return /\d/.test(node.textContent);
  }
  function column(n) {
    return $$('tr > td:nth-of-type('+ n +')', root);
  }
  function schedule(th, n) {
    var type  = legend[th.getAttribute('bgcolor')] || 'Local'
      , times = column(n+1).map(parse_time)
      ;
    if (reverse) times = times.reverse(); // since SF should always be times[0]
    return { id: parseInt(th.textContent, 10)
           , type: type
           , stops: times
           };
  }
  $x('//table[@summary="Weekend and Holiday Southbound service"]'
    +'/tbody/tr[2]/td').forEach(function make_td_headers_ths(td) {
    var th = document.createElement('th');
    th.setAttribute('style',   td.getAttribute('style'));
    th.setAttribute('bgcolor', td.getAttribute('bgcolor'));
    while (td.firstChild) th.appendChild(td.firstChild);
    td.parentNode.replaceChild(th, td);
  });
  var trains = [].concat( $$('tr:first-child > th', root)
                        , $$('tr + tr th[bgcolor="#000000"]', root)
                        ).filter(holds_numbers).map(schedule)

//  , stations = $$('th:first-of-type a[href^="/stations"],'
//                 +'th:first-of-type +th a[href^="/stations"]', root).map(text)
    ;
//if (reverse) stations = stations.reverse(); // match up order with names array

// add null holes for stations missing from this page -- weekdays are missing
// the Broadway, Atherton and Stanford stations, weekends are missing Stanford
// and mostly everything from College Park and beyond -- we need to compensate
  return fixup ? fixup(trains) : trains;
}

function $$(s, r) { return [].slice.call((r||document).querySelectorAll(s),0); }
function $(s, r)  { return (r||document).querySelector(s); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function parse_time(td) {
  var time = td.textContent.trim()
    , ispm = !!$('strong', td)
    ,  hmm = /(\d+):(\d+)/.exec(time)
    , h, m
    ;
  if (!hmm) return null;
  h = Number(hmm[1]);
  m = Number(hmm[2]);
  if (12 === h)
    h += 12 * !ispm;
  else
    h += 12 * ispm;
  h = h % 24;
  return { t: pad(h % 24)+':'+pad(m), s: (h * 60 + m) * 60  };
}

function json(data) {
  return JSON.stringify(data).
           replace(/(,\{"id)/g,'\n$1').
           replace(/\]$/, '\n]\n');
}

function $x(p, r) {
  var doc = document, found, out = [], next;
  if (r && 'object' === typeof r)
    doc = (r.nodeType === document.DOCUMENT_NODE) ? r : r.ownerDocument;
  found = doc.evaluate(p, r || doc, null, 0, null);
  switch (found.resultType) {
    case found.STRING_TYPE:  return found.stringValue;
    case found.NUMBER_TYPE:  return found.numberValue;
    case found.BOOLEAN_TYPE: return found.booleanValue;
    default:
      while ((next = found.iterateNext()))
        out.push(next);
      return out;
  }
}

// for instance, show(north[12])
function show(train) {
  function stops(n, i) {
    var s = train.stops[i];
    return (s === null ? '--:--' : s ? s.t : '!!!!!!') + ' ' + n;
  }
  return train.id +':\n'+ names.map(stops).join('\n');
}

var legend = colorTable($$('table[width="650"] td').concat(
                        $$('table[cellpadding="4"] td')).slice(0, 4))
  , fixers = { weekendtimetable: weekend, weekdaytimetable: weekday }
  , fixup  = fixers[location.pathname.match(/(\w+)\.html$/)[1]]
  , south  = trains($('table[summary*="Southbound"] > tbody'))
  , north  = trains($('table[summary*="Northbound"] > tbody'), 'reverse')
  , names  = ["San Francisco", "22nd Street", "Bayshore", "So. San Francisco", "San Bruno", "Millbrae", "Broadway", "Burlingame", "San Mateo", "Hayward Park", "Hillsdale", "Belmont", "San Carlos", "Redwood City", "Atherton", "Menlo Park", "Palo Alto", "Stanford", "California Ave", "San Antonio", "Mountain View", "Sunnyvale", "Lawrence", "Santa Clara", "College Park", "San Jose", "Tamien", "Capitol", "Blossom Hill", "Morgan Hill", "San Martin", "Gilroy"]
  ;
