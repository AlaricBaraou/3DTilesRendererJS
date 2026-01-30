import { PMTiles } from 'pmtiles';

export class PMTilesSource {

	constructor( url ) {

		this.instance = new PMTiles( url );

	}

	async getTileBuffer( z, x, y, signal ) {

		const response = await this.instance.getZxy( z, x, y, signal );
		if ( ! response ) {

			return null;

		}

		return response.data;

	}

}
