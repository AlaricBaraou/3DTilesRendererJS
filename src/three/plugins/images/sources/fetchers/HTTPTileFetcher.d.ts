import { TileFetcher } from './TileFetcher.js';

export class HTTPTileFetcher extends TileFetcher {

	urlTemplate: string;

	constructor( options?: {
		url?: string,
		fetchOptions?: RequestInit,
		fetchData?: ( url: string, options: RequestInit ) => Promise<Response>,
	} );

}
