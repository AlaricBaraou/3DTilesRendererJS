import { BatchedMesh, BoxGeometry, ConeGeometry, DoubleSide, FrontSide, MeshBasicMaterial, REVISION, SphereGeometry } from 'three';
import { ExpandingBatchedMesh } from './ExpandingBatchedMesh.js';


export class MVTBatchedPlugin {

    constructor( options = {} ) {

        if ( parseInt( REVISION ) < 170 ) {

            throw new Error( 'MVTBatchedPlugin: Three.js revision 170 or higher required.' );

        }

        const defaults = {
            instanceCount: 500,
            vertexCount: 5000,
            indexCount: 10000,
            expandPercent: 0.5,
            maxInstanceCount: Infinity,
            renderer: null,
            material: new MeshBasicMaterial( { color: 0xffffff, wireframe: false, side: FrontSide } ),
        };

        this.options = { ...defaults, ...options };
        this.name = 'MVT_BATCHED_PLUGIN';
        this.priority = - 1;

        this.batchedMesh = null;
        this.tiles = null;
        this._tileToInstanceId = new Map();
        this._onDisposeModel = null;
        this.maxInstanceCount = this.options.maxInstanceCount;

        // Debug / Stats tracking
        this.maxVerticesSeen = 0;
        this.maxIndicesSeen = 0;

    }

    init( tiles ) {

        this._onDisposeModel = ( { scene, tile } ) => {

            this.removeSceneFromBatchedMesh( scene, tile );

        };

        // register events
        tiles.addEventListener( 'dispose-model', this._onDisposeModel );
        this.tiles = tiles;

    }

    dispose() {

        this.tiles.removeEventListener( 'dispose-model', this._onDisposeModel );
        if ( this.batchedMesh ) {

            this.batchedMesh.geometry.dispose();
            this.batchedMesh.material.dispose();
            this.batchedMesh.removeFromParent();
            this.batchedMesh = null;

        }

    }

    initBatchedMesh( referenceMesh ) {

        if ( this.batchedMesh ) return;

        const { instanceCount, vertexCount, indexCount, expandPercent, maxInstanceCount, material } = this.options;
        const tiles = this.tiles;

        const batchedMesh = new ExpandingBatchedMesh(
            instanceCount,
            instanceCount * vertexCount,
            instanceCount * indexCount,
            material.clone()
        );

        batchedMesh.name = 'MVT_Global_Batch';
        batchedMesh.frustumCulled = false;
        batchedMesh.expandPercent = expandPercent;
        batchedMesh.maxInstanceExpansionSize = maxInstanceCount;

        tiles.group.add( batchedMesh );
        batchedMesh.updateMatrixWorld();

        this.batchedMesh = batchedMesh;

    }

    setTileVisible( tile, visible ) {

        const scene = tile.cached.scene;

        // 1. Ensure content is batched
        if ( visible ) {

            this.addSceneToBatchedMesh( scene, tile );

            console.log( 'Vector Tile batched:' );

        }

        // 2. Manage visibility
        if ( this._tileToInstanceId.has( tile ) ) {

            const instanceIds = this._tileToInstanceId.get( tile );

            // A. Toggle Batched Polygons
            instanceIds.forEach( instanceId => {

                this.batchedMesh.setVisibleAt( instanceId, visible );

            } );

            // TODO: this should be handled by the base tiles renderer
            const tiles = this.tiles;
            if ( visible ) {

                tiles.visibleTiles.add( tile );

            } else {

                tiles.visibleTiles.delete( tile );

            }

            // dispatch the event that is blocked otherwise
            tiles.dispatchEvent( {
                type: 'tile-visibility-change',
                scene,
                tile,
                visible,
            } );


            // always return false because original scene still has points/lines
            return false;

        }

        return false;

    }

    addSceneToBatchedMesh( scene, tile ) {

        if ( this._tileToInstanceId.has( tile ) ) {

            return;

        }

        // find the meshes in the scene
        const meshes = [];
        scene.traverse( c => {

            if ( c.isMesh ) {

                meshes.push( c );

            }

        } );

        if ( meshes.length === 0 ) return;

        // don't add the geometry if it doesn't have the right attributes
        let hasCorrectAttributes = true;
        meshes.forEach( mesh => {

            if ( this.batchedMesh && hasCorrectAttributes ) {

                const attrs = mesh.geometry.attributes;
                const batchedAttrs = this.batchedMesh.geometry.attributes;
                for ( const key in batchedAttrs ) {

                    if ( ! ( key in attrs ) ) {

                        // console.warn('MVTBatchedPlugin: Mesh geometry does not have the correct attributes to be batched. Skipping batching for this tile.');
                        // console.log('Missing attribute:', key, 'in mesh:', mesh);

                        // hasCorrectAttributes = false;
                        // return;

                    }

                }

            }

        } );

        const canAddMeshes = ! this.batchedMesh || this.batchedMesh.instanceCount + meshes.length <= this.maxInstanceCount;
        if ( hasCorrectAttributes && canAddMeshes ) {

            this.initBatchedMesh( meshes[ 0 ] );

            scene.updateMatrixWorld();

            const instanceIds = [];
            this._tileToInstanceId.set( tile, instanceIds );

            meshes.forEach( mesh => {

                const { geometry, material } = mesh;

                // Ensure the mesh's local transform is up to date
                mesh.updateMatrix();

                const geoVertCount = geometry.attributes.position.count;
                const geoIndexCount = geometry.index ? geometry.index.count : 0;

                // --- TRACKING MAX COUNTS ---
                if ( geoVertCount > this.maxVerticesSeen ) {

                    this.maxVerticesSeen = geoVertCount;
                    console.log( `[MVT] New Max Vertices: ${this.maxVerticesSeen} (Mesh: ${mesh.name})` );

                }

                if ( geoIndexCount > this.maxIndicesSeen ) {

                    this.maxIndicesSeen = geoIndexCount;
                    console.log( `[MVT] New Max Indices: ${this.maxIndicesSeen} (Mesh: ${mesh.name})` );

                }
                // ---------------------------

                // --- DEBUG LOG START ---
                if ( geoVertCount > this.options.vertexCount || geoIndexCount > this.options.indexCount ) {

                    console.error( '[MVT_BATCH_ERROR] Geometry too large for fixed reservation!' );
                    console.table( {
                        MeshName: mesh.name,
                        GeoVertices: geoVertCount,
                        ReservedVertices: this.options.vertexCount,
                        GeoIndices: geoIndexCount,
                        ReservedIndices: this.options.indexCount
                    } );

                }

                const segments = 32 + Math.random() * 32; // Randomize for variety
                const geometryId = this.batchedMesh.addGeometry(
                    geometry,
                    this.options.vertexCount,
                    this.options.indexCount
                );

                const instanceId = this.batchedMesh.addInstance( geometryId );
                instanceIds.push( instanceId );

                // Use the relative matrix instead of matrixWorld
                this.batchedMesh.setMatrixAt( instanceId, scene.matrix );

                this.batchedMesh.setColorAt( instanceId, material.color );
                this.batchedMesh.setVisibleAt( instanceId, true );

                if ( mesh.parent ) {

                mesh.parent.remove( mesh );

                }

                if ( geometry ) geometry.dispose();
                if ( material ) material.dispose();

            } );

        } else {

            console.warn( 'MVTBatchedPlugin: Cannot add meshes to batched mesh. Either attribute mismatch or max instance count exceeded.' );
            console.log( 'Has correct attributes:', hasCorrectAttributes, 'instance count:', this.batchedMesh ? this.batchedMesh.instanceCount : 0, 'meshes to add:', meshes.length, 'max instance count:', this.maxInstanceCount );

        }

    }

    removeSceneFromBatchedMesh( scene, tile ) {

        if ( this._tileToInstanceId.has( tile ) ) {

            const instanceIds = this._tileToInstanceId.get( tile );
            this._tileToInstanceId.delete( tile );
            instanceIds.forEach( instanceId => {

                console.log( 'Removing instance from batched mesh', instanceId );

                this.batchedMesh.deleteInstance( instanceId );

            } );

        }



    }

    raycastTile( tile, scene, raycaster, intersects ) {

        // If we want raycasting to hit Points/Lines, we must allow it.
        // Returning 'false' lets the renderer proceed to raycast the 'scene' (Points/Lines).
        // Since we removed the Meshes from 'scene', there is no double-raycasting.
        return false;

    }

}