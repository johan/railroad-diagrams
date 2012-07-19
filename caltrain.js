var data = gps_log.map(function(c) { return c[0]; })
  , pt   = 20
  , pr   = 20
  , pl   = 120
  , pb   = 20
  , w    = 800 - (pl + pr)
  , h    = 700 - (pt + pb)
  , min  = d3.min(data)
  , max  = d3.max(data)
  , T    = schedule.stops.filter(function I(i) { return i; })
  , t0   = T[0].s
  , tn   = T[T.length-1].s
  , x    = d3.scale.linear().domain([t0, tn]).range([0, w])
  , y    = d3.scale.linear().domain([min, max]).range([h, 0])
  , vis
  , x_ticks
  , y_ticks
  , stops
  ;

vis = d3.select('#chart')
  .style('margin', '20px auto')
  .style('width', w + 'px')
  .append('svg:svg')
  .attr('width', w + (pl + pr))
  .attr('height', h + pt + pb)
  .attr('class', 'viz')
  .append('svg:g')
  .attr('transform', 'translate(' + pl + ',' + pt + ')')
  ;

vis.selectAll('path.line')
  .data([data])
  .enter()
    .append('svg:path')
      .attr('d', d3.svg.line().x(function(d, i) { return x(t0 + i * 10); })
                              .y(function(d, i) { return y(d); }))
  ;

function stationInfo(stop, i) { // stop: {"t":"08:15","s":29700}
  if (!stop) return null;
  var station = stations[i];
  return { name: station.name
         , lat:  station.latlng[0]
         , time: stop.t
         , seconds: stop.s
         };
}

function I(i) { return i; }

stops = schedule.stops.map(stationInfo).filter(I);

// vertical axis
y_ticks = vis.selectAll('.ticky')
  .data(stops)
  .enter()
    .append('svg:g')
    .attr('transform', function(d) {
      return 'translate(0, ' + y(d.lat) + ')';
    })
    .attr('class', 'ticky')
  ;
y_ticks.append('svg:line')
  .attr('y1', 0)
  .attr('y2', 0)
  .attr('x1', 0)
  .attr('x2', w);
y_ticks.append('svg:text').text(function(d) { return d.name; })
  .attr('text-anchor', 'end')
  .attr('dy', 2)
  .attr('dx', -10)
  ;

// horizontal axis
x_ticks = vis.selectAll('.tickx')
  .data(stops)
  .enter()
    .append('svg:g')
      .attr('transform', function(d, i) {
        return 'translate(' + x(d.seconds) + ', 0)';
      })
      .attr('class', function(d, i) {
        return 'tickx' + (i ? i == stops.length - 1 ? ' final' : '' : ' first');
      })
  ;
x_ticks.append('svg:line')
  .attr('y1', h)
  .attr('y2', 0)
  .attr('x1', 0)
  .attr('x2', 0)
  ;
x_ticks.append('svg:text')
  .text(function(d, i) { return d.time; })
  .attr('y', h)
  .attr('dy', 15)
  .attr('dx', -13)
  ;
x_ticks.append('svg:text')
  .text(function(d, i) { return d.time; })
  .attr('y', 0)
  .attr('dy', -12)
  .attr('dx', -13)
  ;

vis.selectAll('.point')
  .data(stops)
  .enter()
    .append('svg:circle')
      .attr('class', function(d, i) {
        return 'point'+ (d === max ? ' max' : '');
      })
      .attr('r', function(d, i) {
        return d === max ? 6 : 4;
      })
      .attr('cx', function(d, i) { return x(d.seconds); })
      .attr('cy', function(d, i) { return y(d.lat); })
  .on('mouseover', hilight)
  .on('mouseout', unhilight)
  .on('click', function(d, i) { return console.log(d, i); })
  ;

function hilight(d, i) {
  function focus(D, I) { return I === i; }
  x_ticks.classed('focus', focus);
  y_ticks.classed('focus', focus);
  return d3.select(this).attr('r', 8);
}

function unhilight(d, i) {
  x_ticks.classed('focus', false);
  y_ticks.classed('focus', false);
  return d3.select(this).attr('r', 4);
}
