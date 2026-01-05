// example\three\mvt_globe.js

import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	AmbientLight,
	DirectionalLight,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	SphereGeometry
} from 'three';
import {
	TilesRenderer,
	GlobeControls,
} from '3d-tiles-renderer';
import { VectorTilesPlugin } from '../../src/three/plugins/VectorTilesPlugin.js';
import { CAMERA_FRAME } from '../../src/three/renderer/math/Ellipsoid.js';
import { DebugTilesPlugin, TilesFadePlugin, UpdateOnChangePlugin, } from '3d-tiles-renderer/plugins';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { MVTBatchedPlugin } from '../../src/three/plugins/batched/MVTBatchedPlugin.js';

let scene, renderer, camera, controls, tiles;

// Get API Key
const apiKey = localStorage.getItem( 'mapbox_key' ) || prompt( 'Enter Mapbox API Key' );
if ( apiKey ) localStorage.setItem( 'mapbox_key', apiKey );

// Params for GUI
const params = {
	useBatchedMesh: false,
};

init();
render();

function init() {

	// 1. Renderer Setup
	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setAnimationLoop( render );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111 );
	document.body.appendChild( renderer.domElement );

	// 2. Scene Setup
	scene = new Scene();

	// 3. Camera
	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.001, 10000 );

	// Lights
	const dirLight = new DirectionalLight( 0xffffff );
	dirLight.position.set( 1, 1, 1 );
	scene.add( dirLight );
	scene.add( new AmbientLight( 0x444444 ) );

	// 4. Tiles Renderer
	tiles = new TilesRenderer();

	// Register Standard Plugins
	tiles.registerPlugin( new UpdateOnChangePlugin() );
	// tiles.registerPlugin( new TilesFadePlugin() ); // Disable fade if using batching for now, as batching handles visibility instantly

	// --- REGISTER MVT PLUGIN ---
	tiles.registerPlugin( new VectorTilesPlugin( {
		// Mapbox URL
		url: `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${apiKey}`,

		// Filter layers to keep it simple for now
		filter: ( feature, layerName ) => {

			return true;

			const props = feature.properties;

			if ( layerName === 'water' ) {

				return true;

			}

			// 1. Administrative Borders
			if ( layerName === 'admin' ) {

				// admin_level 0 = Country Borders
				// admin_level 1 = First level (States, Provinces)
				// Use <= 0 if you ONLY want Country borders.
				// Use <= 1 if you want Countries + States.
				return props.admin_level <= 0;

			}

			// 2. Labels (Countries & Cities)
			if ( layerName === 'place_label' ) {

				// A. Keep Country Labels
				if ( props.class === 'country' ) {

					return true;

				}

				// B. Keep Major Cities
				// Keep only "Major" cities (Rank 1 to 4)
				// Adjust this number:
				// < 4 = Very sparse (Paris, London, NYC)
				// < 6 = Good balance (Includes Lyon, Manchester, etc.)
				// < 10 = Crowded (Includes Bareilly, etc.)
				if ( props.symbolrank <= 3 ) {

					return true;

				}

				// console.log('props.class', props.class)

				// A specialized case: State/Province labels (optional)
				// if ( props.class === 'state' ) return true;

				return false;

			}

			// 3. Clutter Removal
			// Return false for roads, water, buildings, pois, etc.
			return false;

		},
		center: true,
		shape: 'ellipsoid',
		levels: 15,
		tileDimension: 512
	} ) );

	// --- REGISTER BATCHED PLUGIN ---
	if ( params.useBatchedMesh ) {

		const batchPlugin = new MVTBatchedPlugin( {
			renderer: renderer,
			discardOriginalContent: true, // CRITICAL: Deletes original meshes to save RAM
			instanceCount: 250, // Start small, it auto-expands
			expandPercent: 0.25,
			vertexCount: 10000, // Adjust based on your polygon density
			indexCount: 30000, // Adjust based on your polygon density
		} );
		tiles.registerPlugin( batchPlugin );

	}

	tiles.lruCache.minSize = 900;
	tiles.lruCache.maxSize = 1300;
	tiles.parseQueue.maxJobs = 3;

	// CRITICAL: Align Ellipsoid (Z-Up) to Three.js Scene (Y-Up)
	tiles.group.rotation.x = - Math.PI / 2;



	tiles.setCamera( camera );
	tiles.group.updateMatrixWorld();
	scene.add( tiles.group );

	// 5. Globe Controls
	controls = new GlobeControls( scene, camera, renderer.domElement );
	controls.enableDamping = true;
	controls.setEllipsoid( tiles.ellipsoid, tiles.group );
	controls.camera.position.set( 0, 0, 1.75 * 1e7 );
	controls.camera.quaternion.identity();
	// Zoom out enough to see the globe structure
	controls.minDistance = 150;
	controls.maxDistance = 1.5 * 1e7;


	window.addEventListener( 'resize', onWindowResize, false );

	// 6. GUI (Optional: To debug batching)
	const gui = new GUI();
	const folder = gui.addFolder( 'Performance' );
	folder.add( params, 'useBatchedMesh' ).name( 'Use Batched Mesh' ).onChange( () => {

		location.reload(); // Reload needed to re-register plugins cleanly

	} );

	// Add a stats readout
	const statsObj = { batches: 0, instances: 0 };
	folder.add( statsObj, 'batches' ).listen().disable();
	folder.add( statsObj, 'instances' ).listen().disable();

	tiles.addEventListener( 'update-before', () => {

		const plugin = tiles.getPluginByName( 'MVT_BATCHED_PLUGIN' );
		if ( plugin && plugin.batchedMesh ) {

			statsObj.batches = 1; // It's one global batch
			statsObj.instances = plugin.batchedMesh.instanceCount;

		} else {

			statsObj.batches = 0;
			statsObj.instances = 0;

		}

	} );

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}

function render() {

	controls.update();
	camera.updateMatrixWorld();

	tiles.setCamera( camera );
	tiles.setResolutionFromRenderer( camera, renderer );
	tiles.update();

	renderer.render( scene, camera );

}
