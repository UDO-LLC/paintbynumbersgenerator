type RGB = number[];
interface IMap<T> {
    [key: string]: T;
}

declare class Random {
    private seed;
    constructor(seed?: number);
    next(): number;
}

declare class Vector {
    values: number[];
    weight: number;
    tag: any;
    constructor(values: number[], weight?: number);
    distanceTo(p: Vector): number;
    /**
     *  Calculates the weighted average of the given points
     */
    static average(pts: Vector[]): Vector;
}
declare class KMeans {
    private points;
    k: number;
    private random;
    currentIteration: number;
    pointsPerCategory: Vector[][];
    centroids: Vector[];
    currentDeltaDistanceDifference: number;
    constructor(points: Vector[], k: number, random: Random, centroids?: Vector[] | null);
    private initCentroids;
    step(): void;
}

declare enum ClusteringColorSpace {
    RGB = 0,
    HSL = 1,
    LAB = 2
}
declare class Settings {
    kMeansNrOfClusters: number;
    kMeansMinDeltaDifference: number;
    kMeansClusteringColorSpace: ClusteringColorSpace;
    kMeansColorRestrictions: Array<RGB | string>;
    colorAliases: {
        [key: string]: RGB;
    };
    narrowPixelStripCleanupRuns: number;
    removeFacetsSmallerThanNrOfPoints: number;
    removeFacetsFromLargeToSmall: boolean;
    maximumNumberOfFacets: number;
    nrOfTimesToHalveBorderSegments: number;
    resizeImageIfTooLarge: boolean;
    resizeImageWidth: number;
    resizeImageHeight: number;
    randomSeed: number;
}

declare class Uint32Array2D {
    private width;
    private height;
    private arr;
    constructor(width: number, height: number);
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): void;
}
declare class Uint8Array2D {
    private width;
    private height;
    private arr;
    constructor(width: number, height: number);
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): void;
    matchAllAround(x: number, y: number, value: number): boolean;
}

/**
 * Color reduction management of the process: clustering to reduce colors & creating color map
 */

declare class ColorMapResult {
    imgColorIndices: Uint8Array2D;
    colorsByIndex: RGB[];
    width: number;
    height: number;
}
declare class ColorReducer {
    /**
     *  Creates a map of the various colors used
     */
    static createColorMap(kmeansImgData: ImageData): ColorMapResult;
    /**
     *  Applies K-means clustering on the imgData to reduce the colors to
     *  k clusters and then output the result to the given outputImgData
     */
    static applyKMeansClustering(imgData: ImageData, outputImgData: ImageData, ctx: CanvasRenderingContext2D, settings: Settings, onUpdate?: ((kmeans: KMeans) => void) | null): Promise<void>;
    /**
     *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
     */
    static updateKmeansOutputImageData(kmeans: KMeans, settings: Settings, pointsByColor: IMap<number[]>, imgData: ImageData, outputImgData: ImageData, restrictToSpecifiedColors: boolean): void;
    /**
     *  Builds a distance matrix for each color to each other
     */
    static buildColorDistanceMatrix(colorsByIndex: RGB[]): number[][];
    static processNarrowPixelStripCleanup(colormapResult: ColorMapResult): Promise<void>;
}

/**
 *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
 */
declare class PathSegment {
    points: PathPoint[];
    neighbour: number;
    constructor(points: PathPoint[], neighbour: number);
}
/**
 * Facet boundary segment describes the matched segment that is shared between 2 facets
 * When 2 segments are matched, one will be the original segment and the other one is removed
 * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
 * the correct continuity of its entire oborder path
 */
declare class FacetBoundarySegment {
    originalSegment: PathSegment;
    neighbour: number;
    reverseOrder: boolean;
    constructor(originalSegment: PathSegment, neighbour: number, reverseOrder: boolean);
}

declare class BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    get width(): number;
    get height(): number;
}

declare class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    distanceTo(pt: Point): number;
    distanceToCoord(x: number, y: number): number;
}

/**
 * Facet management from the process, anything from construction, reduction and border tracing etc.
 */

declare enum OrientationEnum {
    Left = 0,
    Top = 1,
    Right = 2,
    Bottom = 3
}
/**
 * PathPoint is a point with an orientation that indicates which wall border is set
 */
declare class PathPoint extends Point {
    orientation: OrientationEnum;
    constructor(pt: Point, orientation: OrientationEnum);
    getWallX(): number;
    getWallY(): number;
    getNeighbour(facetResult: FacetResult): number;
    toString(): string;
}
/**
 *  A facet that represents an area of pixels of the same color
 */
declare class Facet {
    /**
     *  The id of the facet, is always the same as the actual index of the facet in the facet array
     */
    id: number;
    color: number;
    pointCount: number;
    borderPoints: Point[];
    neighbourFacets: number[] | null;
    /**
     * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
     * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
     * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
     * (over 50% on test images)
     */
    neighbourFacetsIsDirty: boolean;
    bbox: BoundingBox;
    borderPath: PathPoint[];
    borderSegments: FacetBoundarySegment[];
    labelBounds: BoundingBox;
    getFullPathFromBorderSegments(useWalls: boolean): Point[];
}
/**
 *  Result of the facet construction, both as a map and as an array.
 *  Facets in the array can be null when they've been deleted
 */
declare class FacetResult {
    facetMap: Uint32Array2D;
    facets: Array<Facet | null>;
    width: number;
    height: number;
}

export { ColorMapResult, ColorReducer, Facet, FacetResult, OrientationEnum, PathPoint };
