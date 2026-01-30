import { TileFetcher } from './TileFetcher.js';
import { PMTiles } from 'pmtiles';

export class PMTilesFetcher extends TileFetcher {

	readonly pmtilesUrl: string;
	readonly instance: PMTiles;
	header: any | null;

	constructor( options: {
		url: string,
		fetchOptions?: RequestInit,
	} );

	init(): Promise<{ maxZoom: number, minZoom: number }>;

}
