import { EllipsoidProjectionTilesPlugin } from './EllipsoidProjectionTilesPlugin.js';
import { PMTilesImageSource } from './sources/PMTilesImageSource.js';

export class PMTilesPlugin extends EllipsoidProjectionTilesPlugin {

	constructor( options = {} ) {

		const { ...rest } = options;
		super( rest );

		this.name = 'PMTILES_PLUGIN';
		this.imageSource = new PMTilesImageSource( options );

	}

	fetchData( url, options ) {

		if ( url.startsWith( 'pmtiles://' ) ) {

			return this.imageSource.fetchInternal( url, options );

		}

		return null;

	}

}
