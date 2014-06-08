!function(){
  var d3 = {version: "3.4.6"}; // semver
function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
}

d3.functor = d3_functor;
var abs = Math.abs;
d3.geom = {};
var π = Math.PI,
    τ = 2 * π,
    halfπ = π / 2,
    ε = 1e-6,
    ε2 = ε * ε,
    d3_radians = π / 180,
    d3_degrees = 180 / π;

function d3_sgn(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
function d3_cross2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function d3_acos(x) {
  return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
}

function d3_asin(x) {
  return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
}

function d3_sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function d3_cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function d3_tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

function d3_haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}
function d3_geom_pointX(d) {
  return d[0];
}

function d3_geom_pointY(d) {
  return d[1];
}

/**
 * Computes the 2D convex hull of a set of points using the monotone chain
 * algorithm:
 * http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain)
 *
 * The runtime of this algorithm is O(n log n), where n is the number of input
 * points. However in practice it outperforms other O(n log n) hulls.
 *
 * @param vertices [[x1, y1], [x2, y2], ...]
 * @returns polygon [[x1, y1], [x2, y2], ...]
 */
d3.geom.hull = function(vertices) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY;

  if (arguments.length) return hull(vertices);

  function hull(data) {
    // Hull of < 3 points is not well-defined
    if (data.length < 3) return [];

    var fx = d3_functor(x),
        fy = d3_functor(y),
        i,
        n = data.length,
        points = [], // of the form [[x0, y0, 0], ..., [xn, yn, n]]
        flippedPoints = [];

    for (i = 0 ; i < n; i++) {
      points.push([+fx.call(this, data[i], i), +fy.call(this, data[i], i), i]);
    }

    // sort ascending by x-coord first, y-coord second
    points.sort(d3_geom_hullOrder);

    // we flip bottommost points across y axis so we can use the upper hull routine on both
    for (i = 0; i < n; i++) flippedPoints.push([points[i][0], -points[i][1]]);

    var upper = d3_geom_hullUpper(points),
        lower = d3_geom_hullUpper(flippedPoints);

    // construct the polygon, removing possible duplicate endpoints
    var skipLeft = lower[0] === upper[0],
        skipRight  = lower[lower.length - 1] === upper[upper.length - 1],
        polygon = [];

    // add upper hull in r->l order
    // then add lower hull in l->r order
    for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
    for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);

    return polygon;
  }

  hull.x = function(_) {
    return arguments.length ? (x = _, hull) : x;
  };

  hull.y = function(_) {
    return arguments.length ? (y = _, hull) : y;
  };

  return hull;
};

// finds the 'upper convex hull' (see wiki link above)
// assumes points arg has >=3 elements, is sorted by x, unique in y
// returns array of indices into points in left to right order
function d3_geom_hullUpper(points) {
  var n = points.length,
      hull = [0, 1],
      hs = 2; // hull size

  for (var i = 2; i < n; i++) {
    while (hs > 1 && d3_cross2d(points[hull[hs-2]], points[hull[hs-1]], points[i]) <= 0) --hs;
    hull[hs++] = i;
  }

  // we slice to make sure that the points we 'popped' from hull don't stay behind
  return hull.slice(0, hs);
}

// comparator for ascending sort by x-coord first, y-coord second
function d3_geom_hullOrder(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};

d3.geom.polygon = function(coordinates) {
  d3_subclass(coordinates, d3_geom_polygonPrototype);
  return coordinates;
};

var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];

d3_geom_polygonPrototype.area = function() {
  var i = -1,
      n = this.length,
      a,
      b = this[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = this[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area * .5;
};

d3_geom_polygonPrototype.centroid = function(k) {
  var i = -1,
      n = this.length,
      x = 0,
      y = 0,
      a,
      b = this[n - 1],
      c;

  if (!arguments.length) k = -1 / (6 * this.area());

  while (++i < n) {
    a = b;
    b = this[i];
    c = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  return [x * k, y * k];
};

// The Sutherland-Hodgman clipping algorithm.
// Note: requires the clip polygon to be counterclockwise and convex.
d3_geom_polygonPrototype.clip = function(subject) {
  var input,
      closed = d3_geom_polygonClosed(subject),
      i = -1,
      n = this.length - d3_geom_polygonClosed(this),
      j,
      m,
      a = this[n - 1],
      b,
      c,
      d;

  while (++i < n) {
    input = subject.slice();
    subject.length = 0;
    b = this[i];
    c = input[(m = input.length - closed) - 1];
    j = -1;
    while (++j < m) {
      d = input[j];
      if (d3_geom_polygonInside(d, a, b)) {
        if (!d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (d3_geom_polygonInside(c, a, b)) {
        subject.push(d3_geom_polygonIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }

  return subject;
};

function d3_geom_polygonInside(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
}

// Intersect two infinite lines cd and ab.
function d3_geom_polygonIntersect(c, d, a, b) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Returns true if the polygon is closed.
function d3_geom_polygonClosed(coordinates) {
  var a = coordinates[0],
      b = coordinates[coordinates.length - 1];
  return !(a[0] - b[0] || a[1] - b[1]);
}

var d3_geom_voronoiEdges,
    d3_geom_voronoiCells,
    d3_geom_voronoiBeaches,
    d3_geom_voronoiBeachPool = [],
    d3_geom_voronoiFirstCircle,
    d3_geom_voronoiCircles,
    d3_geom_voronoiCirclePool = [];


function d3_geom_voronoiBeach() {
  d3_geom_voronoiRedBlackNode(this);
  this.edge =
  this.site =
  this.circle = null;
}

function d3_geom_voronoiCreateBeach(site) {
  var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach;
  beach.site = site;
  return beach;
}

function d3_geom_voronoiDetachBeach(beach) {
  d3_geom_voronoiDetachCircle(beach);
  d3_geom_voronoiBeaches.remove(beach);
  d3_geom_voronoiBeachPool.push(beach);
  d3_geom_voronoiRedBlackNode(beach);
}

function d3_geom_voronoiRemoveBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = {x: x, y: y},
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  d3_geom_voronoiDetachBeach(beach);

  var lArc = previous;
  while (lArc.circle
      && abs(x - lArc.circle.x) < ε
      && abs(y - lArc.circle.cy) < ε) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  d3_geom_voronoiDetachCircle(lArc);

  var rArc = next;
  while (rArc.circle
      && abs(x - rArc.circle.x) < ε
      && abs(y - rArc.circle.cy) < ε) {
    next = rArc.N;
    disappearing.push(rArc);
    d3_geom_voronoiDetachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  d3_geom_voronoiDetachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);

  d3_geom_voronoiAttachCircle(lArc);
  d3_geom_voronoiAttachCircle(rArc);
}

function d3_geom_voronoiAddBeach(site) {
  var x = site.x,
      directrix = site.y,
      lArc,
      rArc,
      dxl,
      dxr,
      node = d3_geom_voronoiBeaches._;

  while (node) {
    dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
    if (dxl > ε) node = node.L; else {
      dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
      if (dxr > ε) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -ε) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -ε) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  var newArc = d3_geom_voronoiCreateBeach(site);
  d3_geom_voronoiBeaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    d3_geom_voronoiDetachCircle(lArc);
    rArc = d3_geom_voronoiCreateBeach(lArc.site);
    d3_geom_voronoiBeaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
    return;
  }

  if (!rArc) { // && lArc
    newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  d3_geom_voronoiDetachCircle(lArc);
  d3_geom_voronoiDetachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite.x,
      ay = lSite.y,
      bx = site.x - ax,
      by = site.y - ay,
      rSite = rArc.site,
      cx = rSite.x - ax,
      cy = rSite.y - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = {x: (cy * hb - by * hc) / d + ax, y: (bx * hc - cx * hb) / d + ay};

  d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
  rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
  d3_geom_voronoiAttachCircle(lArc);
  d3_geom_voronoiAttachCircle(rArc);
}

function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site.x,
      rfocy = site.y,
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site.x,
      lfocy = site.y,
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function d3_geom_voronoiRightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site.y === directrix ? site.x : Infinity;
}

function d3_geom_voronoiCell(site) {
  this.site = site;
  this.edges = [];
}

d3_geom_voronoiCell.prototype.prepare = function() {
  var halfEdges = this.edges,
      iHalfEdge = halfEdges.length,
      edge;

  while (iHalfEdge--) {
    edge = halfEdges[iHalfEdge].edge;
    if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
  }

  halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
  return halfEdges.length;
};

function d3_geom_voronoiCloseCells(extent) {
  var x0 = extent[0][0],
      x1 = extent[1][0],
      y0 = extent[0][1],
      y1 = extent[1][1],
      x2,
      y2,
      x3,
      y3,
      cells = d3_geom_voronoiCells,
      iCell = cells.length,
      cell,
      iHalfEdge,
      halfEdges,
      nHalfEdges,
      start,
      end;

  while (iCell--) {
    cell = cells[iCell];
    if (!cell || !cell.prepare()) continue;
    halfEdges = cell.edges;
    nHalfEdges = halfEdges.length;
    iHalfEdge = 0;
    while (iHalfEdge < nHalfEdges) {
      end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
      start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
      if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
        halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end,
            abs(x3 - x0) < ε && y1 - y3 > ε ? {x: x0, y: abs(x2 - x0) < ε ? y2 : y1}
            : abs(y3 - y1) < ε && x1 - x3 > ε ? {x: abs(y2 - y1) < ε ? x2 : x1, y: y1}
            : abs(x3 - x1) < ε && y3 - y0 > ε ? {x: x1, y: abs(x2 - x1) < ε ? y2 : y0}
            : abs(y3 - y0) < ε && x3 - x0 > ε ? {x: abs(y2 - y0) < ε ? x2 : x0, y: y0}
            : null), cell.site, null));
        ++nHalfEdges;
      }
    }
  }
}

function d3_geom_voronoiHalfEdgeOrder(a, b) {
  return b.angle - a.angle;
}
function d3_geom_voronoiCircle() {
  d3_geom_voronoiRedBlackNode(this);
  this.x =
  this.y =
  this.arc =
  this.site =
  this.cy = null;
}

function d3_geom_voronoiAttachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite.x,
      by = cSite.y,
      ax = lSite.x - bx,
      ay = lSite.y - by,
      cx = rSite.x - bx,
      cy = rSite.y - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -ε2) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d,
      cy = y + by;

  var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle;
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = cy + Math.sqrt(x * x + y * y); // y bottom
  circle.cy = cy;

  arc.circle = circle;

  var before = null,
      node = d3_geom_voronoiCircles._;

  while (node) {
    if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
      if (node.L) node = node.L;
      else { before = node.P; break; }
    } else {
      if (node.R) node = node.R;
      else { before = node; break; }
    }
  }

  d3_geom_voronoiCircles.insert(before, circle);
  if (!before) d3_geom_voronoiFirstCircle = circle;
}

function d3_geom_voronoiDetachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
    d3_geom_voronoiCircles.remove(circle);
    d3_geom_voronoiCirclePool.push(circle);
    d3_geom_voronoiRedBlackNode(circle);
    arc.circle = null;
  }
}

// Liang–Barsky line clipping.
function d3_geom_clipLine(x0, y0, x1, y1) {
  return function(line) {
    var a = line.a,
        b = line.b,
        ax = a.x,
        ay = a.y,
        bx = b.x,
        by = b.y,
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay,
        r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    if (t0 > 0) line.a = {x: ax + t0 * dx, y: ay + t0 * dy};
    if (t1 < 1) line.b = {x: ax + t1 * dx, y: ay + t1 * dy};
    return line;
  };
}

function d3_geom_voronoiClipEdges(extent) {
  var edges = d3_geom_voronoiEdges,
      clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]),
      i = edges.length,
      e;
  while (i--) {
    e = edges[i];
    if (!d3_geom_voronoiConnectEdge(e, extent)
        || !clip(e)
        || (abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε)) {
      e.a = e.b = null;
      edges.splice(i, 1);
    }
  }
}

function d3_geom_voronoiConnectEdge(edge, extent) {
  var vb = edge.b;
  if (vb) return true;

  var va = edge.a,
      x0 = extent[0][0],
      x1 = extent[1][0],
      y0 = extent[0][1],
      y1 = extent[1][1],
      lSite = edge.l,
      rSite = edge.r,
      lx = lSite.x,
      ly = lSite.y,
      rx = rSite.x,
      ry = rSite.y,
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!va) va = {x: fx, y: y0};
      else if (va.y >= y1) return;
      vb = {x: fx, y: y1};
    } else {
      if (!va) va = {x: fx, y: y1};
      else if (va.y < y0) return;
      vb = {x: fx, y: y0};
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!va) va = {x: (y0 - fb) / fm, y: y0};
        else if (va.y >= y1) return;
        vb = {x: (y1 - fb) / fm, y: y1};
      } else {
        if (!va) va = {x: (y1 - fb) / fm, y: y1};
        else if (va.y < y0) return;
        vb = {x: (y0 - fb) / fm, y: y0};
      }
    } else {
      if (ly < ry) {
        if (!va) va = {x: x0, y: fm * x0 + fb};
        else if (va.x >= x1) return;
        vb = {x: x1, y: fm * x1 + fb};
      } else {
        if (!va) va = {x: x1, y: fm * x1 + fb};
        else if (va.x < x0) return;
        vb = {x: x0, y: fm * x0 + fb};
      }
    }
  }

  edge.a = va;
  edge.b = vb;
  return true;
}
function d3_geom_voronoiEdge(lSite, rSite) {
  this.l = lSite;
  this.r = rSite;
  this.a = this.b = null; // for border edges
}

function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
  var edge = new d3_geom_voronoiEdge(lSite, rSite);
  d3_geom_voronoiEdges.push(edge);
  if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
  if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
  d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
  d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
  return edge;
}

function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
  var edge = new d3_geom_voronoiEdge(lSite, null);
  edge.a = va;
  edge.b = vb;
  d3_geom_voronoiEdges.push(edge);
  return edge;
}

function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
  if (!edge.a && !edge.b) {
    edge.a = vertex;
    edge.l = lSite;
    edge.r = rSite;
  } else if (edge.l === rSite) {
    edge.b = vertex;
  } else {
    edge.a = vertex;
  }
}

function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
  var va = edge.a,
      vb = edge.b;
  this.edge = edge;
  this.site = lSite;
  this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x)
      : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y)
      : Math.atan2(va.x - vb.x, vb.y - va.y);
};

d3_geom_voronoiHalfEdge.prototype = {
  start: function() { return this.edge.l === this.site ? this.edge.a : this.edge.b; },
  end: function() { return this.edge.l === this.site ? this.edge.b : this.edge.a; }
};
function d3_geom_voronoiRedBlackTree() {
  this._ = null; // root node
}

function d3_geom_voronoiRedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

d3_geom_voronoiRedBlackTree.prototype = {

  insert: function(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) after = after.L;
        after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = d3_geom_voronoiRedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          d3_geom_voronoiRedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;
    else if (!right) next = left;
    else next = d3_geom_voronoiRedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;
      else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) { node.C = false; return; }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          d3_geom_voronoiRedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          d3_geom_voronoiRedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          d3_geom_voronoiRedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if ((sibling.L && sibling.L.C)
          || (sibling.R && sibling.R.C)) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          d3_geom_voronoiRedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }

};

function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function d3_geom_voronoiRedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function d3_geom_voronoiRedBlackFirst(node) {
  while (node.L) node = node.L;
  return node;
}

function d3_geom_voronoi(sites, bbox) {
  var site = sites.sort(d3_geom_voronoiVertexOrder).pop(),
      x0,
      y0,
      circle;

  d3_geom_voronoiEdges = [];
  d3_geom_voronoiCells = new Array(sites.length);
  d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree;
  d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree;

  while (true) {
    circle = d3_geom_voronoiFirstCircle;
    if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
      if (site.x !== x0 || site.y !== y0) {
        d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
        d3_geom_voronoiAddBeach(site);
        x0 = site.x, y0 = site.y;
      }
      site = sites.pop();
    } else if (circle) {
      d3_geom_voronoiRemoveBeach(circle.arc);
    } else {
      break;
    }
  }

  if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);

  var diagram = {cells: d3_geom_voronoiCells, edges: d3_geom_voronoiEdges};

  d3_geom_voronoiBeaches =
  d3_geom_voronoiCircles =
  d3_geom_voronoiEdges =
  d3_geom_voronoiCells = null;

  return diagram;
};

function d3_geom_voronoiVertexOrder(a, b) {
  return b.y - a.y || b.x - a.x;
}

d3.geom.voronoi = function(points) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY,
      fx = x,
      fy = y,
      clipExtent = d3_geom_voronoiClipExtent;

  // @deprecated; use voronoi(data) instead.
  if (points) return voronoi(points);

  function voronoi(data) {
    var polygons = new Array(data.length),
        x0 = clipExtent[0][0],
        y0 = clipExtent[0][1],
        x1 = clipExtent[1][0],
        y1 = clipExtent[1][1];

    d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
      var edges = cell.edges,
          site = cell.site,
          polygon = polygons[i] = edges.length ? edges.map(function(e) { var s = e.start(); return [s.x, s.y]; })
              : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [[x0, y1], [x1, y1], [x1, y0], [x0, y0]]
              : [];
      polygon.point = data[i];
    });

    return polygons;
  }

  function sites(data) {
    return data.map(function(d, i) {
      return {
        x: Math.round(fx(d, i) / ε) * ε,
        y: Math.round(fy(d, i) / ε) * ε,
        i: i
      };
    });
  }

  voronoi.links = function(data) {
    return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
      return edge.l && edge.r;
    }).map(function(edge) {
      return {
        source: data[edge.l.i],
        target: data[edge.r.i]
      };
    });
  };

  voronoi.triangles = function(data) {
    var triangles = [];

    d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
      var site = cell.site,
          edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder),
          j = -1,
          m = edges.length,
          e0,
          s0,
          e1 = edges[m - 1].edge,
          s1 = e1.l === site ? e1.r : e1.l;

      while (++j < m) {
        e0 = e1;
        s0 = s1;
        e1 = edges[j].edge;
        s1 = e1.l === site ? e1.r : e1.l;
        if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
          triangles.push([data[i], data[s0.i], data[s1.i]]);
        }
      }
    });

    return triangles;
  };

  voronoi.x = function(_) {
    return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
  };

  voronoi.y = function(_) {
    return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
  };

  voronoi.clipExtent = function(_) {
    if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
    clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
    return voronoi;
  };

  // @deprecated; use clipExtent instead.
  voronoi.size = function(_) {
    if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
    return voronoi.clipExtent(_ && [[0, 0], _]);
  };

  return voronoi;
};

var d3_geom_voronoiClipExtent = [[-1e6, -1e6], [1e6, 1e6]];

function d3_geom_voronoiTriangleArea(a, b, c) {
  return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
}

// @deprecated; use d3.geom.voronoi triangles instead.
d3.geom.delaunay = function(vertices) {
  return d3.geom.voronoi().triangles(vertices);
};

d3.geom.quadtree = function(points, x1, y1, x2, y2) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY,
      compat;

  // For backwards-compatibility.
  if (compat = arguments.length) {
    x = d3_geom_quadtreeCompatX;
    y = d3_geom_quadtreeCompatY;
    if (compat === 3) {
      y2 = y1;
      x2 = x1;
      y1 = x1 = 0;
    }
    return quadtree(points);
  }

  function quadtree(data) {
    var d,
        fx = d3_functor(x),
        fy = d3_functor(y),
        xs,
        ys,
        i,
        n,
        x1_,
        y1_,
        x2_,
        y2_;

    if (x1 != null) {
      x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
    } else {
      // Compute bounds, and cache points temporarily.
      x2_ = y2_ = -(x1_ = y1_ = Infinity);
      xs = [], ys = [];
      n = data.length;
      if (compat) for (i = 0; i < n; ++i) {
        d = data[i];
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        xs.push(d.x);
        ys.push(d.y);
      } else for (i = 0; i < n; ++i) {
        var x_ = +fx(d = data[i], i),
            y_ = +fy(d, i);
        if (x_ < x1_) x1_ = x_;
        if (y_ < y1_) y1_ = y_;
        if (x_ > x2_) x2_ = x_;
        if (y_ > y2_) y2_ = y_;
        xs.push(x_);
        ys.push(y_);
      }
    }

    // Squarify the bounds.
    var dx = x2_ - x1_,
        dy = y2_ - y1_;
    if (dx > dy) y2_ = y1_ + dx;
    else x2_ = x1_ + dy;

    // Recursively inserts the specified point p at the node n or one of its
    // descendants. The bounds are defined by [x1, x2] and [y1, y2].
    function insert(n, d, x, y, x1, y1, x2, y2) {
      if (isNaN(x) || isNaN(y)) return; // ignore invalid points
      if (n.leaf) {
        var nx = n.x,
            ny = n.y;
        if (nx != null) {
          // If the point at this leaf node is at the same position as the new
          // point we are adding, we leave the point associated with the
          // internal node while adding the new point to a child node. This
          // avoids infinite recursion.
          if ((abs(nx - x) + abs(ny - y)) < .01) {
            insertChild(n, d, x, y, x1, y1, x2, y2);
          } else {
            var nPoint = n.point;
            n.x = n.y = n.point = null;
            insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
            insertChild(n, d, x, y, x1, y1, x2, y2);
          }
        } else {
          n.x = x, n.y = y, n.point = d;
        }
      } else {
        insertChild(n, d, x, y, x1, y1, x2, y2);
      }
    }

    // Recursively inserts the specified point [x, y] into a descendant of node
    // n. The bounds are defined by [x1, x2] and [y1, y2].
    function insertChild(n, d, x, y, x1, y1, x2, y2) {
      // Compute the split point, and the quadrant in which to insert p.
      var sx = (x1 + x2) * .5,
          sy = (y1 + y2) * .5,
          right = x >= sx,
          bottom = y >= sy,
          i = (bottom << 1) + right;

      // Recursively insert into the child node.
      n.leaf = false;
      n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());

      // Update the bounds as we recurse.
      if (right) x1 = sx; else x2 = sx;
      if (bottom) y1 = sy; else y2 = sy;
      insert(n, d, x, y, x1, y1, x2, y2);
    }

    // Create the root node.
    var root = d3_geom_quadtreeNode();

    root.add = function(d) {
      insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
    };

    root.visit = function(f) {
      d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
    };

    // Insert all points.
    i = -1;
    if (x1 == null) {
      while (++i < n) {
        insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
      }
      --i; // index of last insertion
    } else data.forEach(root.add);

    // Discard captured fields.
    xs = ys = data = d = null;

    return root;
  }

  quadtree.x = function(_) {
    return arguments.length ? (x = _, quadtree) : x;
  };

  quadtree.y = function(_) {
    return arguments.length ? (y = _, quadtree) : y;
  };

  quadtree.extent = function(_) {
    if (!arguments.length) return x1 == null ? null : [[x1, y1], [x2, y2]];
    if (_ == null) x1 = y1 = x2 = y2 = null;
    else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], y2 = +_[1][1];
    return quadtree;
  };

  quadtree.size = function(_) {
    if (!arguments.length) return x1 == null ? null : [x2 - x1, y2 - y1];
    if (_ == null) x1 = y1 = x2 = y2 = null;
    else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
    return quadtree;
  };

  return quadtree;
};

function d3_geom_quadtreeCompatX(d) { return d.x; }
function d3_geom_quadtreeCompatY(d) { return d.y; }

function d3_geom_quadtreeNode() {
  return {
    leaf: true,
    nodes: [],
    point: null,
    x: null,
    y: null
  };
}

function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
  if (!f(node, x1, y1, x2, y2)) {
    var sx = (x1 + x2) * .5,
        sy = (y1 + y2) * .5,
        children = node.nodes;
    if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
    if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
    if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
    if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
  }
}

d3.geom.quadtree = function(points, x1, y1, x2, y2) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY,
      compat;

  // For backwards-compatibility.
  if (compat = arguments.length) {
    x = d3_geom_quadtreeCompatX;
    y = d3_geom_quadtreeCompatY;
    if (compat === 3) {
      y2 = y1;
      x2 = x1;
      y1 = x1 = 0;
    }
    return quadtree(points);
  }

  function quadtree(data) {
    var d,
        fx = d3_functor(x),
        fy = d3_functor(y),
        xs,
        ys,
        i,
        n,
        x1_,
        y1_,
        x2_,
        y2_;

    if (x1 != null) {
      x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
    } else {
      // Compute bounds, and cache points temporarily.
      x2_ = y2_ = -(x1_ = y1_ = Infinity);
      xs = [], ys = [];
      n = data.length;
      if (compat) for (i = 0; i < n; ++i) {
        d = data[i];
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        xs.push(d.x);
        ys.push(d.y);
      } else for (i = 0; i < n; ++i) {
        var x_ = +fx(d = data[i], i),
            y_ = +fy(d, i);
        if (x_ < x1_) x1_ = x_;
        if (y_ < y1_) y1_ = y_;
        if (x_ > x2_) x2_ = x_;
        if (y_ > y2_) y2_ = y_;
        xs.push(x_);
        ys.push(y_);
      }
    }

    // Squarify the bounds.
    var dx = x2_ - x1_,
        dy = y2_ - y1_;
    if (dx > dy) y2_ = y1_ + dx;
    else x2_ = x1_ + dy;

    // Recursively inserts the specified point d at the node n or one of its
    // descendants. The bounds are defined by [x1, x2] and [y1, y2].
    function insert(n, d, x, y, x1, y1, x2, y2) {
      if (isNaN(x) || isNaN(y)) return; // ignore invalid points
      if (n.leaf) {
        var nx = n.x,
            ny = n.y;
        if (nx != null) {
          // If the point at this leaf node is at the same position as the new
          // point we are adding, we leave the point associated with the
          // internal node while adding the new point to a child node. This
          // avoids infinite recursion.
          if ((abs(nx - x) + abs(ny - y)) < .01) {
            return insertChild(n, d, x, y, x1, y1, x2, y2);
          } else {
            var nPoint = n.point;
            n.x = n.y = n.point = null;
            insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
            return insertChild(n, d, x, y, x1, y1, x2, y2);
          }
        } else {
          n.x = x, n.y = y, n.point = d;
          return n;
        }
      } else {
        return insertChild(n, d, x, y, x1, y1, x2, y2);
      }
    }

    // Recursively inserts the specified point [x, y] into a descendant of node
    // n. The bounds are defined by [x1, x2] and [y1, y2].
    function insertChild(n, d, x, y, x1, y1, x2, y2) {
      // Compute the split point, and the quadrant in which to insert p.
      var sx = (x1 + x2) * .5,
          sy = (y1 + y2) * .5,
          right = x >= sx,
          bottom = y >= sy,
          i = (bottom << 1) + right;

      // Recursively insert into the child node.
      n.leaf = false;
      n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode(n));

      // Update the bounds as we recurse.
      if (right) x1 = sx; else x2 = sx;
      if (bottom) y1 = sy; else y2 = sy;
      return insert(n, d, x, y, x1, y1, x2, y2);
    }

    // Create the root node.
    var root = d3_geom_quadtreeNode(null);

    root.add = function(d) {
      return insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
    };

    root.remove = function(d) {
      var targetNode = null;

      function matchTargetNode(n, x1, y1, x2, y2) {
        if (n.leaf && d[0] === n.point[0] && d[1] === n.point[1]) {
          targetNode = n;
        }

        // If the target is outside the rect, don't search the children of this 
        // node.
        return targetNode || (d[0] < x1 || d[0] > x2 || d[1] < y1 || d[1] > y2);
      }

      d3_geom_quadtreeVisit(matchTargetNode, root, x1_, y1_, x2_, y2_);

      if (targetNode) {
        d3_geom_removeNodeFromParent(targetNode);
        d3_geom_pruneNode(targetNode.parent);
      }
    };

    root.visit = function(f) {
      d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
    };

    customVisitFunctions.forEach(function addCustomVisitFn(nameAndFn) {
      root[nameAndFn[0]] = function callCustomVisit() {
        nameAndFn[1](root, x1_,  y1_, x2_, y2_);
      };
    });

    // Insert all points.
    i = -1;
    if (x1 == null) {
      while (++i < n) {
        insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
      }
      --i; // index of last insertion
    } else data.forEach(root.add);

    // Discard captured fields.
    xs = ys = data = d = null;

    return root;
  }

  quadtree.x = function(_) {
    return arguments.length ? (x = _, quadtree) : x;
  };

  quadtree.y = function(_) {
    return arguments.length ? (y = _, quadtree) : y;
  };

  quadtree.extent = function(_) {
    if (!arguments.length) return x1 == null ? null : [[x1, y1], [x2, y2]];
    if (_ == null) x1 = y1 = x2 = y2 = null;
    else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], y2 = +_[1][1];
    return quadtree;
  };

  quadtree.size = function(_) {
    if (!arguments.length) return x1 == null ? null : [x2 - x1, y2 - y1];
    if (_ == null) x1 = y1 = x2 = y2 = null;
    else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
    return quadtree;
  };

  var customVisitFunctions = [];

  function addVisitFn(nameAndFn) {
    var fn = nameAndFn[1];
    function customVisit(node, x1, y1, x2, y2) {
      if (!fn(node, x1, y1, x2, y2)) {
        var sx = (x1 + x2) * 0.5,
            sy = (y1 + y2) * 0.5,
            children = node.nodes;
        if (children[0]) customVisit(children[0], x1, y1, sx, sy);
        if (children[1]) customVisit(children[1], sx, y1, x2, sy);
        if (children[2]) customVisit(children[2], x1, sy, sx, y2);
        if (children[3]) customVisit(children[3], sx, sy, x2, y2);
      }
    }
    customVisitFunctions.push(['visit_' + nameAndFn[0], customVisit]);
  }

  quadtree.visitFunctions = function(_) {
    _.forEach(addVisitFn);
    return quadtree;
  };

  return quadtree;
};

function d3_geom_quadtreeCompatX(d) { return d.x; }
function d3_geom_quadtreeCompatY(d) { return d.y; }

function d3_geom_quadtreeNode(p) {
  return {
    leaf: true,
    nodes: [],
    point: null,
    x: null,
    y: null,
    parent: p
  };
}

function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
  if (!f(node, x1, y1, x2, y2)) {
    var sx = (x1 + x2) * 0.5,
        sy = (y1 + y2) * 0.5,
        children = node.nodes;
    if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
    if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
    if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
    if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
  }
}

function d3_geom_removeNodeFromParent(n) {
  if (n.parent) {
    var nodeIndex = n.parent.nodes.indexOf(n);
    delete n.parent.nodes[nodeIndex];
  }
}

function d3_geom_pruneNode(n) {
  // If the node is a childless non-leaf, remove it.
  if (!n.leaf && !n.nodes[0] && !n.nodes[1] && !n.nodes[2] && !n.nodes[3]) {
    d3_geom_removeNodeFromParent(n);
  }
}

  if (typeof define === "function" && define.amd) {
    define(d3);
  } else if (typeof module === "object" && module.exports) {
    module.exports = d3;
  } else {
    this.d3 = d3;
  }
}();
