/**
 * @author donmccurdy / https://www.donmccurdy.com/
 */

import {
	Triangle
} from "../../../build/three.module.js";

/**
 * Utility class for sampling weighted random points on the surface of a mesh.
 *
 * Building the sampler is a one-time O(n) operation. Once built, any number of
 * random samples may be selected in O(logn) time. Memory usage is O(n).
 *
 * References:
 * - http://www.joesfer.com/?p=84
 * - https://stackoverflow.com/a/4322940/1314762
 */
var MeshSurfaceSampler = ( function () {

	var _face = new Triangle();

	function MeshSurfaceSampler( mesh ) {

		var geometry = mesh.geometry;

		if ( ! geometry.isBufferGeometry || geometry.attributes.position.itemSize !== 3 ) {

			throw new Error( 'THREE.MeshSurfaceSampler: Requires BufferGeometry triangle mesh.' );

		}

		if ( geometry.index ) {

			console.warn( 'THREE.MeshSurfaceSampler: Converting geometry to non-indexed BufferGeometry.' );

			geometry = geometry.toNonIndexed();

		}

		this.geometry = geometry;

		this.positionAttribute = this.geometry.getAttribute( 'position' );
		this.weightAttribute = null;

		this.distribution = null;

	}

	MeshSurfaceSampler.prototype = {

		constructor: MeshSurfaceSampler,

		setWeightAttribute: function ( name ) {

			this.weightAttribute = name ? this.geometry.getAttribute( name ) : null;

			return this;

		},

		build: function () {

			var positionAttribute = this.positionAttribute;
			var weightAttribute = this.weightAttribute;

			var faceWeights = new Float32Array( positionAttribute.count / 3 );

			// Accumulate weights for each mesh face.

			for ( var i = 0; i < positionAttribute.count; i += 3 ) {

				var faceWeight = 1;

				if ( weightAttribute ) {

					faceWeight = weightAttribute.getX( i )
						+ weightAttribute.getX( i + 1 )
						+ weightAttribute.getX( i + 2 );

				}

				_face.a.fromBufferAttribute( positionAttribute, i );
				_face.b.fromBufferAttribute( positionAttribute, i + 1 );
				_face.c.fromBufferAttribute( positionAttribute, i + 2 );
				faceWeight *= _face.getArea();

				faceWeights[ i / 3 ] = faceWeight;

			}

			// Store cumulative total face weights in an array, where weight index
			// corresponds to face index.

			this.distribution = new Float32Array( positionAttribute.count / 3 );

			var cumulativeTotal = 0;

			for ( var i = 0; i < faceWeights.length; i ++ ) {

				cumulativeTotal += faceWeights[ i ];

				this.distribution[ i ] = cumulativeTotal;

			}

			return this;

		},

		sample: function ( targetPosition, targetNormal ) {

			var cumulativeTotal = this.distribution[ this.distribution.length - 1 ];

			var faceIndex = this.binarySearch( Math.random() * cumulativeTotal );

			return this.sampleFace( faceIndex, targetPosition, targetNormal );

		},

		binarySearch: function ( x ) {

			var dist = this.distribution;
			var start = 0;
			var end = dist.length - 1;

			var index = - 1;

			while ( start <= end ) {

				var mid = Math.floor( ( start + end ) / 2 );

				if ( mid === 0 || dist[ mid - 1 ] <= x && dist[ mid ] > x ) {

					index = mid;

					break;

				} else if ( x < dist[ mid ] ) {

					end = mid - 1;

				} else {

					start = mid + 1;

				}

			}

			return index;

		},

		sampleFace: function ( faceIndex, targetPosition, targetNormal ) {

			var u = Math.random();
			var v = Math.random();

			if ( u + v > 1 ) {

				u = 1 - u;
				v = 1 - v;

			}

			_face.a.fromBufferAttribute( this.positionAttribute, faceIndex * 3 );
			_face.b.fromBufferAttribute( this.positionAttribute, faceIndex * 3 + 1 );
			_face.c.fromBufferAttribute( this.positionAttribute, faceIndex * 3 + 2 );

			targetPosition
				.set( 0, 0, 0 )
				.addScaledVector( _face.a, u )
				.addScaledVector( _face.b, v )
				.addScaledVector( _face.c, 1 - ( u + v ) );

			_face.getNormal( targetNormal );

			return this;

		}

	};

	return MeshSurfaceSampler;

} )();

export { MeshSurfaceSampler };
