// Iterates over vector tile features in sorted layer order
export class VectorTileIterator {

	constructor( styler ) {

		this.styler = styler;

	}

	getFeatures( vectorTile ) {

		const results = [];
		const layerNames = Object.keys( vectorTile.layers );
		const sortedLayers = this.styler.sortLayers( layerNames );

		for ( const layerName of sortedLayers ) {

			const layer = vectorTile.layers[ layerName ];

			for ( let i = 0; i < layer.length; i ++ ) {

				const feature = layer.feature( i );

				if ( this.styler.shouldIncludeFeature( feature, layerName ) ) {

					results.push( {
						feature,
						layerName,
						layer,
						geometry: feature.loadGeometry(),
						type: feature.type, // 1=Point, 2=Line, 3=Polygon
					} );

				}

			}

		}

		return results;

	}

}
