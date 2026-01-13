import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
} from 'three';
import { TilesRenderer, GlobeControls, EnvironmentControls } from '3d-tiles-renderer';
import { DebugTilesPlugin, TilesFadePlugin, UpdateOnChangePlugin, XYZTilesPlugin, } from '3d-tiles-renderer/plugins';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { MVTTilesPlugin } from '../../src/three/plugins/images/EPSGTilesPlugin';

let controls, scene, renderer;
let tiles, camera;

const params = {

	errorTarget: 1,
	planar: false,

};

// throttled render function
const scheduleRender = throttle( render );

init();
render();

function init() {

	// renderer
	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111 );

	document.body.appendChild( renderer.domElement );

	// scene
	scene = new Scene();

	// set up cameras and ortho / perspective transition
	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.001, 10000 );

	initTiles();

	// events
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );

	// gui initialization
	const gui = new GUI();
	gui.add( params, 'planar' ).onChange( initTiles );
	gui.add( params, 'errorTarget', 1, 40 ).onChange( () => {

		tiles.getPluginByName( 'UPDATE_ON_CHANGE_PLUGIN' ).needsUpdate = true;
		scheduleRender();

	} );

	gui.open();

}

function initTiles() {

	if ( tiles ) {

		tiles.dispose();

	}

	if ( controls ) {

		controls.dispose();

	}

	// tiles
	tiles = new TilesRenderer();
	// tiles.registerPlugin( new TilesFadePlugin( { maximumFadeOutTiles: 200 } ) );
	tiles.registerPlugin( new UpdateOnChangePlugin() );
	// tiles.registerPlugin( new DebugTilesPlugin( {
	// 		enabled: true,
	// 		displayBoxBounds: true, // Shows the bounding box of the tile (Calculated by XYZ scheme)
	// 		displaySphereBounds: true, // <--- Enable this
	// 		displayRegionBounds: true, // <--- Enable this (Crucial for Geo tiles)
	// 		colorMode: DebugTilesPlugin.ColorModes.RANDOM_COLOR, // Random colors for loaded meshes
	// 		displayParentBounds: false,
	// 	} ) );
	const apiKey =
			"pk.eyJ1IjoiYWxhcmljYiIsImEiOiJjbTk4NGJoeW4wMnJ6MnJvZ2l6am5ldDNxIn0.qflHGE_i0rbp8PLuIWT7ug"

	tiles.registerPlugin( new MVTTilesPlugin( {
		center: true,
		shape: 'planar',
		url: `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${apiKey}`,
		// Filter: Exactly what you had before
		filter: ( feature, layerName ) => {

			const props = feature.properties;

			// Example: Only countries and major water
			// if ( layerName === 'water' ) return true;
			// if ( layerName === 'admin' && props.admin_level <= 0 ) return true; // Countries
			// return false;

			if ( layerName === 'water' ) {

				return true;

			}

			// 1. Administrative Borders
			if ( layerName === 'admin' ) {

				// admin_level 0 = Country Borders
				// admin_level 1 = First level (States, Provinces)
				// Use <= 0 if you ONLY want Country borders.
				// Use <= 1 if you want Countries + States.
				return props.admin_level <= 1;

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

		}
	} ) );

	tiles.lruCache.minSize = 900;
	tiles.lruCache.maxSize = 1300;
	tiles.parseQueue.maxJobs = 3;
	tiles.setCamera( camera );
	scene.add( tiles.group );

	if ( params.planar ) {

		// create the controls
		controls = new EnvironmentControls( scene, camera, renderer.domElement );
		controls.enableDamping = true;
		controls.minDistance = 1e-4;
		controls.maxDistance = 5;
		controls.cameraRadius = 0;
		controls.fallbackPlane.normal.set( 0, 0, 1 );
		controls.up.set( 0, 0, 1 );
		controls.camera.position.set( 0, 0, 2 );
		controls.camera.quaternion.identity();

		// reset the camera
		camera.near = 1e-4;
		camera.far = 10;
		camera.updateProjectionMatrix();

	} else {

		// init tiles
		tiles.group.rotation.x = - Math.PI / 2;

		// create the controls
		controls = new GlobeControls( scene, camera, renderer.domElement );
		controls.setEllipsoid( tiles.ellipsoid, tiles.group );
		controls.enableDamping = true;
		controls.camera.position.set( 0, 0, 1.75 * 1e7 );
		controls.camera.quaternion.identity();
		controls.minDistance = 150;

	}

	// listen to events to call render() on change
	controls.addEventListener( 'change', scheduleRender );
	controls.addEventListener( 'end', scheduleRender );
	tiles.addEventListener( 'needs-render', scheduleRender );
	tiles.addEventListener( 'needs-update', scheduleRender );

	render();

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	scheduleRender();

}

function render() {

	controls.update();
	camera.updateMatrixWorld();

	tiles.errorTarget = params.errorTarget;
	tiles.setCamera( camera );
	tiles.setResolutionFromRenderer( camera, renderer );
	tiles.update();

	renderer.render( scene, camera );

}

function throttle( callback ) {

	let scheduled = false;
	return () => {

		if ( ! scheduled ) {

			scheduled = true;
			requestAnimationFrame( () => {

				scheduled = false;
				callback();

			} );

		}

	};

}
