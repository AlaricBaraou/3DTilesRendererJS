import { MVTImageSource } from './MVTImageSource.js';
import { PMTilesFetcher } from './fetchers/PMTilesFetcher.js';
import { ProjectionScheme } from '../utils/ProjectionScheme.js';

export class PMTilesImageSource extends MVTImageSource {

	constructor( options = {} ) {

		super( options );

		// Use composed fetcher
		this._fetcher = new PMTilesFetcher( { url: options.url } );
		this.tiling.flipY = true;

	}

	get pmtilesUrl() {

		return this._fetcher.pmtilesUrl;

	}

	get instance() {

		return this._fetcher.instance;

	}

	getUrl( x, y, level ) {

		return this._fetcher.getUrl( x, y, level );

	}

	async init() {

		const metadata = await this._fetcher.init();
		this.tiling.setProjection( new ProjectionScheme( 'EPSG:3857' ) );
		this.tiling.generateLevels( metadata.maxZoom, this.tiling.projection.tileCountX, this.tiling.projection.tileCountY, {
			tilePixelWidth: this.tileDimension,
			tilePixelHeight: this.tileDimension,
		} );

	}

	async fetchInternal( url, options ) {

		const parts = url.split( '/' );
		const y = parseInt( parts.pop() );
		const x = parseInt( parts.pop() );
		const z = parseInt( parts.pop() );

		return this._fetcher.fetchTile( x, y, z, options.signal );

	}

}
