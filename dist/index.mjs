// src/common.ts
async function delay(ms) {
  if (typeof window !== "undefined") {
    return new Promise((exec) => window.setTimeout(exec, ms));
  } else {
    return new Promise((exec) => exec());
  }
}

// src/lib/clustering.ts
var Vector = class _Vector {
  constructor(values, weight = 1) {
    this.values = values;
    this.weight = weight;
  }
  tag;
  distanceTo(p) {
    let sumSquares = 0;
    for (let i = 0; i < this.values.length; i++) {
      sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
    }
    return Math.sqrt(sumSquares);
  }
  /**
   *  Calculates the weighted average of the given points
   */
  static average(pts) {
    if (pts.length === 0) {
      throw Error("Can't average 0 elements");
    }
    const dims = pts[0].values.length;
    const values = [];
    for (let i = 0; i < dims; i++) {
      values.push(0);
    }
    let weightSum = 0;
    for (const p of pts) {
      weightSum += p.weight;
      for (let i = 0; i < dims; i++) {
        values[i] += p.weight * p.values[i];
      }
    }
    for (let i = 0; i < values.length; i++) {
      values[i] /= weightSum;
    }
    return new _Vector(values);
  }
};
var KMeans = class {
  constructor(points, k, random, centroids = null) {
    this.points = points;
    this.k = k;
    this.random = random;
    if (centroids != null) {
      this.centroids = centroids;
      for (let i = 0; i < this.k; i++) {
        this.pointsPerCategory.push([]);
      }
    } else {
      this.initCentroids();
    }
  }
  currentIteration = 0;
  pointsPerCategory = [];
  centroids = [];
  currentDeltaDistanceDifference = 0;
  initCentroids() {
    for (let i = 0; i < this.k; i++) {
      this.centroids.push(this.points[Math.floor(this.points.length * this.random.next())]);
      this.pointsPerCategory.push([]);
    }
  }
  step() {
    for (let i = 0; i < this.k; i++) {
      this.pointsPerCategory[i] = [];
    }
    for (const p of this.points) {
      let minDist = Number.MAX_VALUE;
      let centroidIndex = -1;
      for (let k = 0; k < this.k; k++) {
        const dist = this.centroids[k].distanceTo(p);
        if (dist < minDist) {
          centroidIndex = k;
          minDist = dist;
        }
      }
      this.pointsPerCategory[centroidIndex].push(p);
    }
    let totalDistanceDiff = 0;
    for (let k = 0; k < this.pointsPerCategory.length; k++) {
      const cat = this.pointsPerCategory[k];
      if (cat.length > 0) {
        const avg = Vector.average(cat);
        const dist = this.centroids[k].distanceTo(avg);
        totalDistanceDiff += dist;
        this.centroids[k] = avg;
      }
    }
    this.currentDeltaDistanceDifference = totalDistanceDiff;
    this.currentIteration++;
  }
};

// src/lib/colorconversion.ts
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p2 + (q2 - p2) * 6 * t;
      }
      if (t < 1 / 2) {
        return q2;
      }
      if (t < 2 / 3) {
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      }
      return p2;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}
function lab2rgb(lab) {
  let y = (lab[0] + 16) / 116, x = lab[1] / 500 + y, z = y - lab[2] / 200, r, g, b;
  x = 0.95047 * (x * x * x > 8856e-6 ? x * x * x : (x - 16 / 116) / 7.787);
  y = 1 * (y * y * y > 8856e-6 ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * (z * z * z > 8856e-6 ? z * z * z : (z - 16 / 116) / 7.787);
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057;
  r = r > 31308e-7 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 31308e-7 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 31308e-7 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
  return [
    Math.max(0, Math.min(1, r)) * 255,
    Math.max(0, Math.min(1, g)) * 255,
    Math.max(0, Math.min(1, b)) * 255
  ];
}
function rgb2lab(rgb) {
  let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// src/structs/typedarrays.ts
var Uint8Array2D = class {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.arr = new Uint8Array(width * height);
  }
  arr;
  get(x, y) {
    return this.arr[y * this.width + x];
  }
  set(x, y, value) {
    this.arr[y * this.width + x] = value;
  }
  matchAllAround(x, y, value) {
    const idx = y * this.width + x;
    return x - 1 >= 0 && this.arr[idx - 1] === value && (y - 1 >= 0 && this.arr[idx - this.width] === value) && (x + 1 < this.width && this.arr[idx + 1] === value) && (y + 1 < this.height && this.arr[idx + this.width] === value);
  }
};

// src/random.ts
var Random = class {
  seed;
  constructor(seed) {
    if (typeof seed === "undefined") {
      this.seed = (/* @__PURE__ */ new Date()).getTime();
    } else {
      this.seed = seed;
    }
  }
  next() {
    const x = Math.sin(this.seed++) * 1e4;
    return x - Math.floor(x);
  }
};

// src/colorreductionmanagement.ts
var ColorMapResult = class {
  imgColorIndices;
  colorsByIndex;
  width;
  height;
};
var ColorReducer = class _ColorReducer {
  /**
   *  Creates a map of the various colors used
   */
  static createColorMap(kmeansImgData) {
    const imgColorIndices = new Uint8Array2D(kmeansImgData.width, kmeansImgData.height);
    let colorIndex = 0;
    const colors = {};
    const colorsByIndex = [];
    let idx = 0;
    for (let j = 0; j < kmeansImgData.height; j++) {
      for (let i = 0; i < kmeansImgData.width; i++) {
        const r = kmeansImgData.data[idx++];
        const g = kmeansImgData.data[idx++];
        const b = kmeansImgData.data[idx++];
        const a = kmeansImgData.data[idx++];
        let currentColorIndex;
        const color = r + "," + g + "," + b;
        if (typeof colors[color] === "undefined") {
          currentColorIndex = colorIndex;
          colors[color] = colorIndex;
          colorsByIndex.push([r, g, b]);
          colorIndex++;
        } else {
          currentColorIndex = colors[color];
        }
        imgColorIndices.set(i, j, currentColorIndex);
      }
    }
    const result = new ColorMapResult();
    result.imgColorIndices = imgColorIndices;
    result.colorsByIndex = colorsByIndex;
    result.width = kmeansImgData.width;
    result.height = kmeansImgData.height;
    return result;
  }
  /**
   *  Applies K-means clustering on the imgData to reduce the colors to
   *  k clusters and then output the result to the given outputImgData
   */
  static async applyKMeansClustering(imgData, outputImgData, ctx, settings, onUpdate = null) {
    const vectors = [];
    let idx = 0;
    let vIdx = 0;
    const bitsToChopOff = 2;
    const pointsByColor = {};
    for (let j = 0; j < imgData.height; j++) {
      for (let i = 0; i < imgData.width; i++) {
        let r = imgData.data[idx++];
        let g = imgData.data[idx++];
        let b = imgData.data[idx++];
        const a = imgData.data[idx++];
        r = r >> bitsToChopOff << bitsToChopOff;
        g = g >> bitsToChopOff << bitsToChopOff;
        b = b >> bitsToChopOff << bitsToChopOff;
        const color = `${r},${g},${b}`;
        if (!(color in pointsByColor)) {
          pointsByColor[color] = [j * imgData.width + i];
        } else {
          pointsByColor[color].push(j * imgData.width + i);
        }
      }
    }
    for (const color of Object.keys(pointsByColor)) {
      const rgb = color.split(",").map((v) => parseInt(v));
      let data;
      if (settings.kMeansClusteringColorSpace === 0 /* RGB */) {
        data = rgb;
      } else if (settings.kMeansClusteringColorSpace === 1 /* HSL */) {
        data = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      } else if (settings.kMeansClusteringColorSpace === 2 /* LAB */) {
        data = rgb2lab(rgb);
      } else {
        data = rgb;
      }
      const weight = pointsByColor[color].length / (imgData.width * imgData.height);
      const vec = new Vector(data, weight);
      vec.tag = rgb;
      vectors[vIdx++] = vec;
    }
    const random = new Random(settings.randomSeed === 0 ? (/* @__PURE__ */ new Date()).getTime() : settings.randomSeed);
    const kmeans = new KMeans(vectors, settings.kMeansNrOfClusters, random);
    let curTime = (/* @__PURE__ */ new Date()).getTime();
    kmeans.step();
    while (kmeans.currentDeltaDistanceDifference > settings.kMeansMinDeltaDifference) {
      kmeans.step();
      if ((/* @__PURE__ */ new Date()).getTime() - curTime > 500) {
        curTime = (/* @__PURE__ */ new Date()).getTime();
        await delay(0);
        if (onUpdate != null) {
          _ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, false);
          onUpdate(kmeans);
        }
      }
    }
    _ColorReducer.updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, true);
    if (onUpdate != null) {
      onUpdate(kmeans);
    }
  }
  /**
   *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
   */
  static updateKmeansOutputImageData(kmeans, settings, pointsByColor, imgData, outputImgData, restrictToSpecifiedColors) {
    for (let c = 0; c < kmeans.centroids.length; c++) {
      const centroid = kmeans.centroids[c];
      for (const v of kmeans.pointsPerCategory[c]) {
        let rgb;
        if (settings.kMeansClusteringColorSpace === 0 /* RGB */) {
          rgb = centroid.values;
        } else if (settings.kMeansClusteringColorSpace === 1 /* HSL */) {
          const hsl = centroid.values;
          rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
        } else if (settings.kMeansClusteringColorSpace === 2 /* LAB */) {
          const lab = centroid.values;
          rgb = lab2rgb(lab);
        } else {
          rgb = centroid.values;
        }
        rgb = rgb.map((v2) => Math.floor(v2));
        if (restrictToSpecifiedColors) {
          if (settings.kMeansColorRestrictions.length > 0) {
            let minDistance = Number.MAX_VALUE;
            let closestRestrictedColor = null;
            for (const color of settings.kMeansColorRestrictions) {
              const centroidLab = rgb2lab(rgb);
              let restrictionLab;
              if (typeof color === "string") {
                restrictionLab = rgb2lab(settings.colorAliases[color]);
              } else {
                restrictionLab = rgb2lab(color);
              }
              const distance = Math.sqrt((centroidLab[0] - restrictionLab[0]) * (centroidLab[0] - restrictionLab[0]) + (centroidLab[1] - restrictionLab[1]) * (centroidLab[1] - restrictionLab[1]) + (centroidLab[2] - restrictionLab[2]) * (centroidLab[2] - restrictionLab[2]));
              if (distance < minDistance) {
                minDistance = distance;
                closestRestrictedColor = color;
              }
            }
            if (closestRestrictedColor !== null) {
              if (typeof closestRestrictedColor === "string") {
                rgb = settings.colorAliases[closestRestrictedColor];
              } else {
                rgb = closestRestrictedColor;
              }
            }
          }
        }
        let pointRGB = v.tag;
        const pointColor = `${Math.floor(pointRGB[0])},${Math.floor(pointRGB[1])},${Math.floor(pointRGB[2])}`;
        for (const pt of pointsByColor[pointColor]) {
          const ptx = pt % imgData.width;
          const pty = Math.floor(pt / imgData.width);
          let dataOffset = (pty * imgData.width + ptx) * 4;
          outputImgData.data[dataOffset++] = rgb[0];
          outputImgData.data[dataOffset++] = rgb[1];
          outputImgData.data[dataOffset++] = rgb[2];
        }
      }
    }
  }
  /**
   *  Builds a distance matrix for each color to each other
   */
  static buildColorDistanceMatrix(colorsByIndex) {
    const colorDistances = new Array(colorsByIndex.length);
    for (let j = 0; j < colorsByIndex.length; j++) {
      colorDistances[j] = new Array(colorDistances.length);
    }
    for (let j = 0; j < colorsByIndex.length; j++) {
      for (let i = j; i < colorsByIndex.length; i++) {
        const c1 = colorsByIndex[j];
        const c2 = colorsByIndex[i];
        const distance = Math.sqrt((c1[0] - c2[0]) * (c1[0] - c2[0]) + (c1[1] - c2[1]) * (c1[1] - c2[1]) + (c1[2] - c2[2]) * (c1[2] - c2[2]));
        colorDistances[i][j] = distance;
        colorDistances[j][i] = distance;
      }
    }
    return colorDistances;
  }
  static async processNarrowPixelStripCleanup(colormapResult) {
    const colorDistances = _ColorReducer.buildColorDistanceMatrix(colormapResult.colorsByIndex);
    let count = 0;
    const imgColorIndices = colormapResult.imgColorIndices;
    for (let j = 1; j < colormapResult.height - 1; j++) {
      for (let i = 1; i < colormapResult.width - 1; i++) {
        const top = imgColorIndices.get(i, j - 1);
        const bottom = imgColorIndices.get(i, j + 1);
        const left = imgColorIndices.get(i - 1, j);
        const right = imgColorIndices.get(i + 1, j);
        const cur = imgColorIndices.get(i, j);
        if (cur !== top && cur !== bottom && cur !== left && cur !== right) {
        } else if (cur !== top && cur !== bottom) {
          const topColorDistance = colorDistances[cur][top];
          const bottomColorDistance = colorDistances[cur][bottom];
          imgColorIndices.set(i, j, topColorDistance < bottomColorDistance ? top : bottom);
          count++;
        } else if (cur !== left && cur !== right) {
          const leftColorDistance = colorDistances[cur][left];
          const rightColorDistance = colorDistances[cur][right];
          imgColorIndices.set(i, j, leftColorDistance < rightColorDistance ? left : right);
          count++;
        }
      }
    }
    console.log(count + " pixels replaced to remove narrow pixel strips");
  }
};

// src/structs/point.ts
var Point = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  distanceTo(pt) {
    return Math.abs(pt.x - this.x) + Math.abs(pt.y - this.y);
  }
  distanceToCoord(x, y) {
    return Math.abs(x - this.x) + Math.abs(y - this.y);
  }
};

// src/facetmanagement.ts
var OrientationEnum = /* @__PURE__ */ ((OrientationEnum2) => {
  OrientationEnum2[OrientationEnum2["Left"] = 0] = "Left";
  OrientationEnum2[OrientationEnum2["Top"] = 1] = "Top";
  OrientationEnum2[OrientationEnum2["Right"] = 2] = "Right";
  OrientationEnum2[OrientationEnum2["Bottom"] = 3] = "Bottom";
  return OrientationEnum2;
})(OrientationEnum || {});
var PathPoint = class extends Point {
  constructor(pt, orientation) {
    super(pt.x, pt.y);
    this.orientation = orientation;
  }
  getWallX() {
    let x = this.x;
    if (this.orientation === 0 /* Left */) {
      x -= 0.5;
    } else if (this.orientation === 2 /* Right */) {
      x += 0.5;
    }
    return x;
  }
  getWallY() {
    let y = this.y;
    if (this.orientation === 1 /* Top */) {
      y -= 0.5;
    } else if (this.orientation === 3 /* Bottom */) {
      y += 0.5;
    }
    return y;
  }
  getNeighbour(facetResult) {
    switch (this.orientation) {
      case 0 /* Left */:
        if (this.x - 1 >= 0) {
          return facetResult.facetMap.get(this.x - 1, this.y);
        }
        break;
      case 2 /* Right */:
        if (this.x + 1 < facetResult.width) {
          return facetResult.facetMap.get(this.x + 1, this.y);
        }
        break;
      case 1 /* Top */:
        if (this.y - 1 >= 0) {
          return facetResult.facetMap.get(this.x, this.y - 1);
        }
        break;
      case 3 /* Bottom */:
        if (this.y + 1 < facetResult.height) {
          return facetResult.facetMap.get(this.x, this.y + 1);
        }
        break;
    }
    return -1;
  }
  toString() {
    return this.x + "," + this.y + " " + this.orientation;
  }
};
var Facet = class {
  /**
   *  The id of the facet, is always the same as the actual index of the facet in the facet array
   */
  id;
  color;
  pointCount = 0;
  borderPoints;
  neighbourFacets;
  /**
   * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
   * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
   * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
   * (over 50% on test images)
   */
  neighbourFacetsIsDirty = false;
  bbox;
  borderPath;
  borderSegments;
  labelBounds;
  getFullPathFromBorderSegments(useWalls) {
    const newpath = [];
    const addPoint = (pt) => {
      if (useWalls) {
        newpath.push(new Point(pt.getWallX(), pt.getWallY()));
      } else {
        newpath.push(new Point(pt.x, pt.y));
      }
    };
    let lastSegment = null;
    for (const seg of this.borderSegments) {
      if (lastSegment != null) {
        if (lastSegment.reverseOrder) {
          addPoint(lastSegment.originalSegment.points[0]);
        } else {
          addPoint(lastSegment.originalSegment.points[lastSegment.originalSegment.points.length - 1]);
        }
      }
      for (let i = 0; i < seg.originalSegment.points.length; i++) {
        const idx = seg.reverseOrder ? seg.originalSegment.points.length - 1 - i : i;
        addPoint(seg.originalSegment.points[idx]);
      }
      lastSegment = seg;
    }
    return newpath;
  }
};
var FacetResult = class {
  facetMap;
  facets;
  width;
  height;
};
export {
  ColorMapResult,
  ColorReducer,
  Facet,
  FacetResult,
  OrientationEnum,
  PathPoint
};
