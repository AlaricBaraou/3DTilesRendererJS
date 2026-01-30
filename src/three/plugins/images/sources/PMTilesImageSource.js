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

	// Override fetchItem to fetch directly from PMTiles archive (bypasses plugin fetchData chain)
	fetchItem( tokens, signal ) {

		const [ x, y, level ] = tokens;

		return this.instance.getZxy( level, x, y, signal )
			.then( res => {

				if ( ! res || ! res.data ) {

					return this._createEmptyTexture();

				}

				// res.data is ArrayBuffer per PMTiles API
				return this.processBufferToTexture( res.data );

			} );

	}

}
