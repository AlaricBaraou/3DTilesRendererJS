# 3DTilesRendererJS - Claude Code Guide

## Project Overview

**3DTilesRendererJS** is a Three.js renderer implementation for the [3D Tiles specification](https://github.com/CesiumGS/3d-tiles), an OGC standard for streaming massive geospatial 3D datasets. This NASA-AMMOS project supports rendering geographic and geometric tile data including Mars terrain, Google Photorealistic Tiles, and various map tile formats.

- **Package**: `3d-tiles-renderer` (npm)
- **License**: Apache-2.0

## Build Commands

```bash
npm install          # Install dependencies
npm start            # Dev server at http://localhost:5173
npm run build-lib    # Build library to /build
npm test             # TypeScript check + Vitest
npm run lint         # ESLint + TypeScript
```

## Directory Structure

```
src/
├── core/                    # Framework-agnostic implementations
│   ├── plugins/             # Base plugin classes
│   └── renderer/
│       ├── loaders/         # Format loaders: B3DM, I3DM, PNTS, CMPT, MVT
│       ├── tiles/           # Tile traversal algorithms
│       └── utilities/       # BatchTable, PriorityQueue, LRUCache
├── three/                   # Three.js-specific implementations
│   ├── plugins/             # Three.js plugins
│   │   ├── images/          # Image overlay plugins (TMS, XYZ, WMTS, WMS, MVT, PMTiles)
│   │   │   └── sources/     # Image source implementations
│   │   ├── gltf/            # GLTF extensions & metadata
│   │   └── batched/         # Batched rendering optimization
│   └── renderer/
│       ├── loaders/         # Three.js tile format loaders
│       ├── tiles/           # TilesRenderer & TilesGroup
│       ├── controls/        # GlobeControls, EnvironmentControls
│       └── math/            # Ellipsoid, OBB, GeoUtils
├── r3f/                     # React Three Fiber components
└── plugins.js               # Plugin re-exports

example/                     # Three.js and R3F examples
test/                        # Vitest unit tests
```

## Architecture

### Main Classes

- **TilesRenderer** (`src/three/renderer/tiles/TilesRenderer.js`) - Main Three.js rendering class
- **TilesRendererBase** (`src/core/renderer/tiles/TilesRendererBase.js`) - Framework-agnostic core

### Plugin System

Plugins extend functionality through lifecycle hooks:

```javascript
class MyPlugin extends TilesPlugin {
  constructor() {
    super();
    this.name = 'MY_PLUGIN';
  }
  preprocessURL( url ) { }
  postProcess( tile ) { }
  onLoadModel( { scene, tile } ) { }
  onDisposeModel( { scene, tile } ) { }
}
```

### Tile Formats Supported

- **B3DM** - Batched 3D Model
- **I3DM** - Instanced 3D Model
- **PNTS** - Point Cloud
- **CMPT** - Composite
- **MVT** - Mapbox Vector Tiles (in development)
- **Quantized Mesh** - Terrain mesh

## Code Style

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Naming**: Long descriptive names preferred (`isHierarchicallyVisible` not `isVis`)
- **Private members**: Underscore prefix (`this._internalState`)
- **Comments**: Explain WHY, not WHAT

## Key Technologies

- **three**: ^0.170.0 (required peer dependency)
- **vite**: Build tool
- **vitest**: Test runner
- **typescript**: Type checking (JSDoc-based)

## Module Exports

- `3d-tiles-renderer` - Full library
- `3d-tiles-renderer/core` - Core only
- `3d-tiles-renderer/three` - Three.js implementation
- `3d-tiles-renderer/r3f` - React Three Fiber
- `3d-tiles-renderer/three/plugins` - Three.js plugins
