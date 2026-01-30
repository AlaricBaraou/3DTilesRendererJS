import { MVTImageSource } from './MVTImageSource.js';
import { ProjectionScheme } from '../utils/ProjectionScheme.js';
import { PMTiles } from 'pmtiles';

export class PMTilesImageSource extends MVTImageSource {

	constructor( options = {} ) {

		super( options );
		this.pmtilesUrl = options.url.replace( /^pmtiles:\/\//, '' );
		this.instance = new PMTiles( this.pmtilesUrl );
		this.tiling.flipY = true;

	}

	getUrl( x, y, level ) {

		return `pmtiles://${level}/${x}/${y}`;

	}

	async init() {

		const header = await this.instance.getHeader();
		this.tiling.setProjection( new ProjectionScheme( 'EPSG:3857' ) );
		this.tiling.generateLevels( header.maxZoom, this.tiling.projection.tileCountX, this.tiling.projection.tileCountY, {
			tilePixelWidth: this.tileDimension,
			tilePixelHeight: this.tileDimension,
		} );

	}

	async fetchInternal( url, options ) {

		console.log( 'Success! Intercepted virtual URL:', url );

		const parts = url.split( '/' );
		const y = parseInt( parts.pop() );
		const x = parseInt( parts.pop() );
		const z = parseInt( parts.pop() );

		try {

			const res = await this.instance.getZxy( z, x, y, options.signal );


			if ( ! res ) {

				console.log( 'PMTiles: Tile not found in archive:', { z, x, y } );
				return new ArrayBuffer( 0 );

			}

			console.log( 'PMTiles: Tile found in archive:', { z, x, y }, res, res.data, res.data.buffer, typeof res.data );

			return res.data;

		} catch ( e ) {

			if ( e.name === 'AbortError' ) throw e;
			console.error( 'PMTiles Fetch Error:', e );
			return null;

		}

	}

}
