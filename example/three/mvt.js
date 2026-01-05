import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	GridHelper,
	AxesHelper,
	Box3,
	Vector3,
	MathUtils,
	TextureLoader, // <--- Added
	PlaneGeometry, // <--- Added
	MeshBasicMaterial, // <--- Added
	Mesh, // <--- Added
	DoubleSide // <--- Added
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MVTLoader } from '../../src/three/renderer/loaders/MVTLoader.js';

let scene, renderer, camera, controls;

init();
render();

function init() {

	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111 );
	document.body.appendChild( renderer.domElement );

	scene = new Scene();
	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.set( 2048, 4000, 4000 );

	// 1. GRID & AXES
	const grid = new GridHelper( 4096, 8, 0xff0000, 0x444444 );
	grid.position.set( 2048, 0, 2048 );
	scene.add( grid );

	const axes = new AxesHelper( 500 );
	scene.add( axes );

	// 2. REFERENCE IMAGE (Expected Output)
	const textureLoader = new TextureLoader();
	textureLoader.load( './expected.png', ( texture ) => {

		// MVT coordinates 0,0 are usually top-left.
		// Three.js textures are bottom-left by default.
		// We might need to flip the texture depending on how the PNG was saved.
		// texture.flipY = false; // Toggle this if the image looks upside down

		const geometry = new PlaneGeometry( 4096, 4096 );
		const material = new MeshBasicMaterial( {
			// map: texture,
			side: DoubleSide,
			transparent: true,
			opacity: 0.5 // Make it semi-transparent to see the lines on top
		} );

		const plane = new Mesh( geometry, material );

		// Rotate to lie flat (matching the MVT data rotation)
		plane.rotation.x = - Math.PI / 2;

		// Position at the center of the tile (2048, 2048)
		// Y = -5 to put it slightly below the lines/points
		plane.position.set( 2048, - 5, 2048 );

		scene.add( plane );

	} );

	// 3. CONTROLS
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 2048, 0, 2048 );
	controls.update();

	// 4. MVT LOADER
	const loader = new MVTLoader();
	console.log( 'Loading MVT...' );

	// Optional: test the filter
	// loader.filter = ( feature, layerName ) => layerName === 'road';

	loader.loadAsync( '../data/14-8801-5371.vector.pbf' )
		.then( result => {

			console.log( 'MVT Loaded:', result );
			const group = result.scene;

			// Align MVT data to flat plane
			group.rotation.x = - Math.PI / 2;
			group.scale.set( 1, 1, 1 );

			scene.add( group );

		} )
		.catch( err => console.error( err ) );

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}

function render() {

	requestAnimationFrame( render );
	renderer.render( scene, camera );

}
