// MVT File Format
// https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md

import { LoaderBase } from './LoaderBase.js';
import { VectorTile } from '@mapbox/vector-tile';
import { Points } from '@react-three/drei';
import Protobuf from 'pbf';
import { BufferGeometry, DefaultLoadingManager, Float32BufferAttribute, Group, PointsMaterial } from 'three';

export class MVTLoaderBase extends LoaderBase {

	constructor( manager = DefaultLoadingManager ) {

		super();
		this.manager = manager;
		// Default red dots for debugging
		this.defaultPointsMaterial = new PointsMaterial( { color: 0xff0000, size: 20, sizeAttenuation: false } );

	}

	parse( buffer ) {

		const pbf = new Protobuf( buffer );
		const vectorTile = new VectorTile( pbf );

		// Return a structure consistent with PNTSLoaderBase/B3DMLoaderBase
		return Promise.resolve( {
			vectorTile
		} );

	}

}
