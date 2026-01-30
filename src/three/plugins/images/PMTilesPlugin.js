import { EllipsoidProjectionTilesPlugin } from './EllipsoidProjectionTilesPlugin.js';
import { PMTilesImageSource } from './sources/PMTilesImageSource.js';

export class PMTilesPlugin extends EllipsoidProjectionTilesPlugin {

	constructor( options = {} ) {

		const { ...rest } = options;
		super( rest );

		this.name = 'PMTILES_PLUGIN';
		this.imageSource = new PMTilesImageSource( options );

	}

	// Intercept pmtiles:// URLs and fetch from the PMTiles archive
	fetchData( url, options ) {

		if ( url.startsWith( 'pmtiles://' ) ) {

			const parts = url.split( '/' );
			const y = parseInt( parts.pop() );
			const x = parseInt( parts.pop() );
			const z = parseInt( parts.pop() );

			return this.imageSource.instance.getZxy( z, x, y, options?.signal )
				.then( res => {

					if ( ! res || ! res.data ) {

						return new ArrayBuffer( 0 );

					}

					// res.data is ArrayBuffer per PMTiles API
					return res.data;

				} );

		}

		return null;

	}

}
