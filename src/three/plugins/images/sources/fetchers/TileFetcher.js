// Abstract interface for fetching tile data
export class TileFetcher {

	constructor( options = {} ) {

		this.fetchOptions = options.fetchOptions || {};

	}

	// Override in subclasses
	async fetchTile( x, y, z, signal ) {

		throw new Error( 'TileFetcher.fetchTile must be implemented' );

	}

	async init() {

		// Optional initialization - override in subclasses
		return {};

	}

	getUrl( x, y, z ) {

		throw new Error( 'TileFetcher.getUrl must be implemented' );

	}

}
