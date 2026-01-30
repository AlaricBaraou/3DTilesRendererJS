export class TileFetcher {

	fetchOptions: RequestInit;

	constructor( options?: {
		fetchOptions?: RequestInit,
	} );

	fetchTile( x: number, y: number, z: number, signal?: AbortSignal ): Promise<ArrayBuffer | null>;
	init(): Promise<Record<string, any>>;
	getUrl( x: number, y: number, z: number ): string;

}
