import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	AmbientLight,
	DirectionalLight,
	MathUtils,
} from 'three';
import {
	TilesRenderer,
	GlobeControls,
} from '3d-tiles-renderer';
import {
	ImageOverlayPlugin,
	UpdateOnChangePlugin,
	MVTOverlay,
	MVTTilesPlugin
} from '3d-tiles-renderer/plugins';

import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, renderer, camera, controls, tiles;

const apiKey = localStorage.getItem( 'mapbox_key' ) || prompt( 'Enter Mapbox API Key' );
if ( apiKey ) localStorage.setItem( 'mapbox_key', apiKey );

init();
render();

function init() {

	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setAnimationLoop( render );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111 );
	document.body.appendChild( renderer.domElement );

	scene = new Scene();

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 100, 1e8 );

	// Lights are less critical for Unlit image overlays, but good to have
	const dirLight = new DirectionalLight( 0xffffff );
	dirLight.position.set( 1, 1, 1 );
	scene.add( dirLight );
	scene.add( new AmbientLight( 0x444444 ) );

	tiles = new TilesRenderer();
	tiles.registerPlugin( new UpdateOnChangePlugin() );

	const BLANK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

	tiles.registerPlugin( new MVTTilesPlugin( {
		center: true,
		shape: 'ellipsoid',
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

	// Globe setup
	tiles.group.rotation.x = - Math.PI / 2;
	tiles.errorTarget = 4;
	tiles.setCamera( camera );
	tiles.group.updateMatrixWorld();
	scene.add( tiles.group );

	controls = new GlobeControls( scene, camera, renderer.domElement );
	controls.enableDamping = true;
	controls.setEllipsoid( tiles.ellipsoid, tiles.group );
	controls.camera.position.set( 0, 0, 1.5 * 1e7 );
	controls.minDistance = 1000;
	controls.maxDistance = 2 * 1e7;

	window.addEventListener( 'resize', onWindowResize, false );

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
