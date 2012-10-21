var KDTree = (function() {
  var AXIS_Y = 0
    , AXIS_X = 1
    , K      = 2
    ;

  /**
   * accessor functions for the x and y coordinates of a point, whether that be
   * an { x: x, y: y } Object or a [y, x] lat/long pair.
   */
  function x(point) { return 'x' in point ? point.x : point[1]; }
  function y(point) { return 'y' in point ? point.y : point[0]; }

  /**
   * Represents a node within a kd-tree. This is an internal class only.
   * @param points Array of 2d {x:?, y:?} point objects.
   * @returns {KDTree} A balanced KDTree.
   */
  function KDTreeNode(point) {
    this.point = point;
    this.leftChild = null;
    this.rightChild = null;
  }

  /**
   * KDTree class that represents a kd-tree data structure
   * @param points Array of 2d {x:?, y:?} point objects
   * @returns {KDTree} A balanced KDTree
   */
  function KDTree(points) {

    var bounds = { minX: Infinity, maxX: -Infinity
                 , minY: Infinity, maxY: -Infinity
                 }
      , point, i, _x, _y;

    for (i = 0; point = points[i]; i++) {
      bounds.minX = Math.min(bounds.minX, _x = x(point));
      bounds.minY = Math.min(bounds.minY, _y = y(point));
      bounds.maxX = Math.max(bounds.maxX, _x);
      bounds.maxY = Math.max(bounds.maxY, _y);
    }

    this.rootNode = createKDTree_(points, 0, bounds);
  };

  /**
   * Internal recursive function to create a balanced kd-tree datastructure.
   * @param points Array of 2d {x:?, y:?} point objects
   * @param depth depth of the current level that is being constructed
   * @param boundingRect rectangle that bounds all points in the current subtree
   * @returns the root KDTreeNode
   */
  function createKDTree_(points, depth, boundingRect) {
    if (!points.length) return null;

    // select axis based on depth. Axis will cycle between AXIS_X & AXIS_Y.
    var axis = depth % K;

    // sort point list as we need to choose the median point as pivot element
    points.sort(function (a, b) {
      return axis == AXIS_X ? x(a) - x(b) : y(a) - y(b);
    });

    var medianIndex = Math.floor(points.length / 2);
    var node = new KDTreeNode(points[medianIndex]);
    node.boundingRect = boundingRect;

    // calculate bounding rectangles for the two child nodes.
    var leftChildBoundingRect =
      { minX: boundingRect.minX
      , maxX: axis == AXIS_X ? x(node.point) : boundingRect.maxX
      , minY: boundingRect.minY
      , maxY: axis == AXIS_Y ? y(node.point) : boundingRect.maxY
      };

    var rightChildBoundingRect =
      { minX: axis == AXIS_X ? x(node.point) : boundingRect.minX
      , maxX: boundingRect.maxX
      , minY: axis == AXIS_Y ? y(node.point) : boundingRect.minY
      , maxY: boundingRect.maxY
      };

    // recursively create subtrees
    // TODO: do in place instead of splicing, boo slow & waste of memory...
    node.leftChild  = createKDTree_( points.slice(0, medianIndex)
                                   , depth + 1
                                   , leftChildBoundingRect
                                   );
    node.rightChild = createKDTree_( points.slice(medianIndex + 1)
                                   , depth + 1
                                   , rightChildBoundingRect
                                   );

    return node;
  }

  /**
   * Finds the nearest neighbour to a point within the k-d tree
   * @param searchCoord search point {x:?, y:?} to find nearest neighbours for
   * @param opt_consideredPoints if an empty Array is passed, all points visited
   * are added to it
   * @returns the nearest neighbour {x:?, y:?} to that was found in the tree
   */
  KDTree.prototype.getNearestNeighbour = function( searchCoord
                                                 , opt_consideredPoints
                                                 ) {
    var results = []
      , point;
    this.getNearestNeighbours_( this.rootNode, searchCoord, 0, results, 1
                              , opt_consideredPoints
                              );
    ;
    return results[0] && results[0].node.point || null;
  };

  /**
   * Finds `maxResults` nearest neighbours to a point within the k-d tree.
   * @param searchCoord search point {x:?, y:?} to find nearest neighbours for
   * @param maxResults maximum number of nearest neighbours to find
   * @param opt_consideredPoints if an empty Array is passed, all points visited
   * are added to it
   * @returns Array of the nearest neighbours {x:?, y:?} found in the tree
   */
  KDTree.prototype.getNearestNeighbours = function( searchCoord, maxResults
                                                  , opt_consideredPoints ) {
    var results = [];
    this.getNearestNeighbours_( this.rootNode, searchCoord, 0, results
                              , maxResults, opt_consideredPoints );

    // extract the point {x:?, y:?} objects from KDTreeNode objects and put them in the return array.
    // Naturally this will result in a slower search for large values of maxResults & we also
    // lose the intermediate squared distances that were calculated from each point
    // to the search point. These will need to be calculated again if desired by
    // users of this tree. If greater efficiency is desired we could probably
    // return the internal search node objects that retain this info. It somewhat
    // complicates the public API interface though so I'll accept this inefficiency for now.
    var points = [];
    for (var i = 0; i < results.length; ++i) {
      points.push(results[i].node.point);
    }

    return points;
  };

  /**
   * Finds a specified number of nearest neighbour(s) to a point within the k-d tree. This is an internal
   * recursive function that performs the bulk of the search.
   * @param currNode A KDTreeNode representing the current node being examined in the search.
   * @param searchCoord search point {x:?, y:?} to find nearest neighbours for
   * @param depth depth  at which currNode resides within the tree (root is 0,
   * its two children 1, et c)
   * @param results An array the will get filled with the nearest neighbour results as the search progresses.
   * @param maxResults The maximum number of nearest neighbours to find
   * @param opt_consideredPoints Optional empty array which if defined will hold a list of all points visited in the search.
   */
  KDTree.prototype.getNearestNeighbours_ = function( currNode, searchCoord
                                                   , depth , results, maxResults
                                                   , opt_consideredPoints ) {
    if (opt_consideredPoints) {
      opt_consideredPoints.push(currNode.point);
    }
    if (searchCoord.length) { // [y, x]
      searchCoord = { y: searchCoord[0], x: searchCoord[1] };
    }

    var axis = depth % K;
    var currNodeDistanceToDesiredCoord = getSquaredEuclidianDistance(
      x(searchCoord), y(searchCoord), x(currNode.point), y(currNode.point));
    var bestSeen = { node: currNode, distance: currNodeDistanceToDesiredCoord };
    insertResult_(results, bestSeen, maxResults);
    var searchNodeSplittingCoord = axis == AXIS_X ? x(searchCoord)    : y(searchCoord);
    var currNodeSplittingCoord   = axis == AXIS_X ? x(currNode.point) : y(currNode.point);

    var searchLeft    = searchNodeSplittingCoord < currNodeSplittingCoord;
    var targetChild   = searchLeft ? currNode.leftChild  : currNode.rightChild;
    var oppositeChild = searchLeft ? currNode.rightChild : currNode.leftChild;

    // search target subtree
    if (targetChild) {
      this.getNearestNeighbours_(targetChild, searchCoord, depth + 1, results, maxResults, opt_consideredPoints);
    }

    // check opposite subtree iff current node is better than best seen distance
    // in the splitting plane
    if (oppositeChild) {
      // find nearest point to searchCoord on the perimeter of the oppositeChild
      // boundingRect. This gives us the shortest possible distance to a point
      // in the oppositeChild subtree.
      var toX, toY;
      if (axis == AXIS_X) {
        toX = x(currNode.point);
        toY = Math.min( Math.max( oppositeChild.boundingRect.minY
                                , y(searchCoord)
                                )
                      , oppositeChild.boundingRect.maxY
                      );
      }
      else {
        toY = y(currNode.point);
        toX = Math.min( Math.max( oppositeChild.boundingRect.minX
                                , x(searchCoord)
                                )
                      , oppositeChild.boundingRect.maxX
                      );
      }

      var squaredDist = getSquaredEuclidianDistance( x(searchCoord)
                                                   , y(searchCoord), toX, toY );
      if (squaredDist <= results[results.length - 1].distance) {
        // right side could contain a better node, need to check.
        this.getNearestNeighbours_( oppositeChild, searchCoord, depth + 1
                                  , results, maxResults, opt_consideredPoints );
      }
    }
  };

  /**
   * inserts a result into the results array if it is better than an current
   * result or if max results have not yet been reached.
   * @param results sorted array of current best nearest neighbour KDTreeNodes
   * @param insertNode KDTreeNode to insert into the results array if it's better
   * than a node currently in the array, or if the results array is not yet full
   * @param maxResults maximum size that the results array is allowed to reach
   */
  function insertResult_(results, insertNode, maxResults) {
    // results list is sorted nearest-farthest
    var insertIndex;
    for (insertIndex = results.length - 1; insertIndex >= 0; --insertIndex) {
      var nearestNeighbourNode = results[insertIndex];
      if (insertNode.distance > nearestNeighbourNode.distance) {
        break;
      }
    }

    results.splice(insertIndex + 1, 0, insertNode);
    if (results.length > maxResults) {
      results.pop();
    }
  }

  /**
   * returns the squared distance between two points
   */
  function getSquaredEuclidianDistance(x1, y1, x2, y2) {
    var dx = x1 - x2, dy = y1 - y2;
    return dx * dx + dy * dy;
  }

  return KDTree;
})();
