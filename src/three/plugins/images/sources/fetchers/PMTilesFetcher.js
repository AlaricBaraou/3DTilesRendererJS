import { TileFetcher } from './TileFetcher.js';
import { PMTiles } from 'pmtiles';

export class PMTilesFetcher extends TileFetcher {

	constructor( options = {} ) {

		super( options );
		this.pmtilesUrl = options.url.replace( /^pmtiles:\/\//, '' );
		this.instance = new PMTiles( this.pmtilesUrl );
		this.header = null;

	}

	async init() {

		this.header = await this.instance.getHeader();
		return {
			maxZoom: this.header.maxZoom,
			minZoom: this.header.minZoom || 0
		};

	}

	getUrl( x, y, z ) {

		return `pmtiles://${z}/${x}/${y}`;

	}

	async fetchTile( x, y, z, signal ) {

		try {

			const res = await this.instance.getZxy( z, x, y, signal );

			if ( ! res ) {

				return new ArrayBuffer( 0 );

			}

			return res.data;

		} catch ( e ) {

			if ( e.name === 'AbortError' ) throw e;
			console.error( 'PMTiles Fetch Error:', e );
			return null;

		}

	}

}
