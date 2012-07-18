// visit http://www.caltrain.com/schedules/weekdaytimetable.html
//    or http://www.caltrain.com/schedules/weekendtimetable.html
// in Chrome, open the javascript console, paste this code in it
// to let you export mostly well-formed schedules via copy(n()),
// copy(s()), which puts the JSON on your clipboard for pasting.

var legend = colorTable($$('table[width="650"] td').concat(
                        $$('table[cellpadding="4"] td')).slice(0, 4))
  , south  = trains($('table[summary*="Southbound"] > tbody'))
  , north  = trains($('table[summary*="Northbound"] > tbody'), 'reverse')
  ;

function s() { return JSON.stringify(south).replace(/(,\{"id)/g,'\n$1'); }
function n() { return JSON.stringify(north).replace(/(,\{"id)/g,'\n$1'); }

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
  var trains = $$('tr:first-child > th', root).concat(
               $$('tr + tr th[bgcolor="#000000"]', root)).filter(holds_numbers)
    ;
  return trains.map(schedule);
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
