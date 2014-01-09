$.simpleSlides('setTransitions',{

	fade : function( settings ) {
		var op = parseFloat(settings.slideB.css('opacity'));
		// reset opacity to 0
		if ( op === 1 ) {
			settings.slideB.css( {opacity:0} );
		}
		// set the opacity based on the percentage
		if ( settings.percent > 0 ) {
			settings.slideB.css( {opacity:settings.percent} );
		}
		// animate to full opacity
		settings.slideB.animate({
			opacity: 1
		}, settings.duration);
	},

	slideLeft : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.container.innerWidth();
		}else {
			var mv = parseInt(settings.slideB.css('left'));
		}
		// start slide B to the right
		settings.slideB.css('left', mv + 'px')
		// animate slide B to slide in moving left
		.animate({
			left: '-=' + mv
		}, settings.duration);
		// check for slide A
		if( settings.slideA ) {
			// start slide A on to the left of slide B
			settings.slideA.css('left',
				( mv - settings.container.innerWidth() ) + 'px')
			// animate slide A to slide out moving left
			.animate({
				left: '-=' + mv
			}, settings.duration);
		}
	},

	slideLeftOver : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.container.innerWidth();
		}else {
			var mv = parseInt(settings.slideB.css('left'));
		}
		// start slide B to the right
		settings.slideB.css('left', mv + 'px')
		// animate slide B to slide in moving left
		.animate({
			left: '-=' + mv
		}, settings.duration);
	},

	slideRight : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.slideB.innerWidth();
		}else {
			var mv = Math.abs(parseInt(settings.slideB.css('left')));
		}
		// start slide B to the left
		settings.slideB.css('left',-mv+'px')
		// animate slide B to slide in moving right
		.animate({
			left: '+=' + mv
		}, settings.duration);
		// check for slide A
		if ( settings.slideA ) {
			// start slide A to the right of slide B
			settings.slideA.css('left',
				( -mv+settings.slideB.outerWidth() ) + 'px')
			// animate slide A to move out to the right
			.animate({
				left: '+=' + settings.container.innerWidth()
			}, settings.duration);
		}
	},

	slideRightOver : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.slideB.innerWidth();
		}else {
			var mv = Math.abs(parseInt(settings.slideB.css('left')));
		}
		// start slide B to the left
		settings.slideB.css('left',-mv+'px')
		// animate slide B to slide in moving right
		.animate({
			left: '+=' + mv
		}, settings.duration);
	},

	slideUp : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.container.innerHeight();
		}else {
			var mv = parseInt(settings.container.innerHeight() *
				( 1 - settings.percent ));
		}
		// start slide B at the top
		settings.slideB.css('top', mv + 'px')
		// animate slide B to slide in moving down
		.animate({
			top: '-=' + mv
		}, settings.duration);
		// check for slide A
		if( settings.slideA ) {
			// start slide A at the bottom of slide B
			settings.slideA.css('top',
				( mv-settings.container.innerHeight() ) + 'px')
			// animate slide A to move down and out
			.animate({
				top: '-=' + mv
			}, settings.duration);
		}
	},

	slideUpOver : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.container.innerHeight();
		}else {
			var mv = parseInt(settings.container.innerHeight() *
				( 1 - settings.percent ));
		}
		// start slide B at the top
		settings.slideB.css('top', mv + 'px')
		// animate slide B to slide in moving down
		.animate({
			top: '-=' + mv
		}, settings.duration);
	},

	slideDown : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.slideB.innerHeight();
		}else {
			var mv = parseInt(settings.slideB.innerHeight() *
				( 1 - settings.percent ));
		}
		// start slide B at the bottom
		settings.slideB.css('top', -mv + 'px')
		// animate slide B to slide in moving up
		.animate({
			top: '+=' + mv
		}, settings.duration);
		// check for slide A
		if ( settings.slideA ) {
			// start slide A on top of slide B
			settings.slideA.css('top',
				( -mv+settings.slideA.outerHeight()) + 'px')
			// animate slide A to slide up and out
			.animate({
				top: '+=' + mv
			}, settings.duration);
		}
	},

	slideDownOver : function( settings ) {
		// set the amount to move based on the percentage
		if ( settings.percent === 0 ) {
			var mv = settings.slideB.innerHeight();
		}else {
			var mv = parseInt(settings.slideB.innerHeight() *
				( 1 - settings.percent ));
		}
		// start slide B at the bottom
		settings.slideB.css('top', -mv + 'px')
		// animate slide B to slide in moving up
		.animate({
			top: '+=' + mv
		}, settings.duration);
	}

});
