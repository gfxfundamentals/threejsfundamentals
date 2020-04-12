/**
 * @author mrdoob / http://mrdoob.com/
 */

class FlakesTexture {

	constructor( width = 512, height = 512 ) {

		var canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;

		var context = canvas.getContext( '2d' );
		context.fillStyle = 'rgb(127,127,255)';
		context.fillRect( 0, 0, width, height );

		for ( var i = 0; i < 4000; i ++ ) {

			var x = Math.random() * width;
			var y = Math.random() * height;
			var r = Math.random() * 3 + 3;

			var nx = Math.random() * 2 - 1;
			var ny = Math.random() * 2 - 1;
			var nz = 1.5;

			var l = Math.sqrt( nx * nx + ny * ny + nz * nz );

			nx /= l; ny /= l; nz /= l;

			context.fillStyle = 'rgb(' + ( nx * 127 + 127 ) + ',' + ( ny * 127 + 127 ) + ',' + ( nz * 255 ) + ')';
			context.beginPath();
			context.arc( x, y, r, 0, Math.PI * 2 );
			context.fill();

		}

		return canvas;

	}

}

export { FlakesTexture };
