import { TileFetcher } from './TileFetcher.js';

export class HTTPTileFetcher extends TileFetcher {

	constructor( options = {} ) {

		super( options );
		this.urlTemplate = options.url;
		this._fetch = options.fetchData || ( ( ...args ) => fetch( ...args ) );

	}

	getUrl( x, y, z ) {

		return this.urlTemplate
			.replace( /{\s*z\s*}/gi, z )
			.replace( /{\s*x\s*}/gi, x )
			.replace( /{\s*(y|reverseY|-\s*y)\s*}/gi, y );

	}

	async fetchTile( x, y, z, signal ) {

		const url = this.getUrl( x, y, z );
		const response = await this._fetch( url, { ...this.fetchOptions, signal } );
		return response.arrayBuffer();

	}

}
