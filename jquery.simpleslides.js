/**
*	@name						Simple Slides
*	@descripton					Turns the elements inside a div into slides
*							with assigned transitions, handles image loading, and can act 
*							as a slideshow. 
*	@version					0.1.0
*	@requires					Jquery 1.4+
*
*	@author						Ben Gullotti
*	@author-email					ben@bengullotti.com
*
*	@license					MIT License - http://www.opensource.org/licenses/mit-license.php
*/

(function($) {
	
	//helpers
	
	var helpers = {

		appendImage : function(jQel,img) {
			if(typeof img === 'string') {
				jQel.append('<img src="'+img+'" />');
			}else if(typeof img === 'object' && typeof img.src === 'string') {
				$('<img/>',img).appendTo(jQel);
			}else {
				$.error('Simple Slides Error: invalid image. Specify '+
					'src as a string or object property.');
			}
		},

		getAttributes : function(el) {
			var attributes = {};
			for (var i=0, attrs=el.attributes, l=attrs.length; i<l; i++){
				attributes[attrs.item(i).nodeName] = attrs.item(i).nodeValue;
			}

			return attributes;
		},

		wrapElement : function(jQel) {
			var wrapper = $('<div></div>').insertAfter(jQel);
			jQel.remove();
			wrapper.append(jQel);
			wrapper.css({
				'width':'100%',
				'height':'100%',
				'position':'relative',
				'top':'0px',
				'left':'0px',
				'display':'block',
				'z-index':0
			});
			jQel.css({
				'display':'block',
				'position':'relative',
				'top':'0px',
				'left':'0px'
			});

			return wrapper;
		}
	};

	//filters
	
	var filters = {

		methods : function(method) {
			//filter out the uninitialized
			var filtered = this.filter(function() {
				if($(this).data('SimpleSlides.global') === null) {
					$.error('Simple Slides Error: method "'+method+'" was called on an element '+
					'which has not initialized the plugin');

					return false;
				}

				return true;
			});
			
			//check filtered before proceeding
			if(filtered.length === 0) {return false;}

			//apply filter to specific methods
			if(typeof filters[method] === 'function') {
				filters[method].apply(filtered, Array.prototype.slice.call( arguments, 1 ));
			}else {
				methods[method].apply(filtered, Array.prototype.slice.call( arguments, 1 ));
			}
		},

		goTo : function(slide) {
			//check slide
			if(typeof slide === 'undefined') {
				$.error('Simple Slides Error: method goTo expects second argument the '+
						'slide #.');
				return false;
			}
			//convert to integer
			if(typeof slide !== 'number') {slide = parseInt(slide);}

			var filtered = this.filter(function() {
				//global settings
				var settings = $(this).data('SimpleSlides.global');
				var state = settings.state.getState();
				//check load or pause
				if(state === 'load' || state === 'pause-in' || state === 'pause-tr') {return false;}
				//check overflow
				if(!settings.overflow) {
				       if(state === 'play-tr' || state === 'stop-tr') {return false;}
				}else {
					//check queue
					if(settings.transitions.length >= settings.maxOverflow || settings.transitions.length+1 >= settings.total) {return false;}
				}
				//check current slide
				if(slide === settings.slide) {
					$.error('Simple Slides Error: method goTo() called for current slide #'+slide);

					return false;
				}
				//check slide range
				if(slide < 0 || slide >= settings.total) {
					$.error('Simple Slides Error: slide parameter ('+slide+') passed to goTo() '+
					'must be a number greater than 0 and less than the total slides ('+settings.total+')');
					
					return false;
				}
				//check if slide is currently in use
				if($(this).children().eq(slide).css('visibility') === 'visible') {return false;}
				//check reset play
				if(state === 'play-in') {settings.timer.reset();}

				return true;
			});

			//check filtered before proceeding
			if(filtered.length === 0) {return false;}

			//Go To
			methods.goTo.call(filtered,slide);
		}
	};

	//classes
	
	var SimpleSlide = function (id,index) {
		this.id = id;
		this.index = index;
	};

	SimpleSlide.prototype = {

		getContainer : function () {
			return $('.simpleSlides'+this.id);
		},
		
		getWrapper : function () {
			return $('.simpleSlides'+this.id).children().eq(this.index);
		},

		getSlide : function () {
			return $('.simpleSlides'+this.id).children().eq(this.index).children().first();
		}
	};
	
	//state management object

	var State = function() {
		this.isPlaying = false;
		this.isPaused = false;
		this.isTransit = false;
		this.isLoading = false;
	};

	State.prototype = {
		
		getState : function() {
			//state 0: loading
			if(this.isLoading) {return 'load';}
			//state 1: playing between transitions
			if(this.isPlaying && !this.isPaused && !this.isTransit) {return 'play-in';}
			//state 2: playing during transitions
			if(this.isPlaying && !this.isPaused) {return 'play-tr';}
			//state 3: paused between transitions
			if(this.isPlaying && this.isPaused && !this.isTransit) {return 'pause-in';}
			//state 4: paused during transitions
			if(this.isPlaying && this.isPaused) {return 'pause-tr';}
			//state 5: stopped between transitions
			if(!this.isTransit) {return 'stop-in';}
			//state 6: stopped during transitions
			return 'stop-tr';
		},

		setState : function(state) {
			switch(state) {
				case 'load':
					this.isLoading = true;
					break;
				case 'noload':
					this.isLoading = false;
					break;
				case 'play':
					this.isPlaying = true;
					this.isPaused = false;
					break;
				case 'pause':
					this.isPlaying = true;
					this.isPaused = true;
					break;
				case 'stop':
					this.isPlaying = false;
					this.isPaused = false;
					break;
				case 'tr':
					this.isTransit = true;
					break;
				case 'no-tr':
					this.isTransit = false;
					break;
			}
		}
	};

	//loader object

	var Loader = function() {
		this.loader = false;
		this.slide = false;
		this.total = 0;
		this.count = 0;
		this.duration = 500;
	};

	Loader.prototype = {

		showLoader : function() {
			if(!this.loader) {return false;}
			this.loader.getWrapper().css('visibility','hidden');
			var op = parseFloat(this.loader.getSlide().css('opacity'));
			var duration = this.duration * (1 - op);
			this.loader.getSlide().animate({
				opacity: 1
			}, duration);
		},

		hideLoader : function() {
			if(!this.loader) {return false;}
			this.loader.getSlide().stop();
			var op = parseFloat(this.loader.getSlide().css('opacity'));
			var duration = this.duration * op;
			var wrapper = this.loader.getWrapper();
			this.loader.getSlide().stop().animate({
				opacity: 0
			},duration,function(){
				wrapper.css('visibility','hidden');
			});
		},

		loadImage : function(jQimg) {
			this.showLoader();
			//get attributes
			var attributes = helpers.getAttributes(jQimg.get(0));
			//replace image with an empty image
			var imgPlaceHolder = $('<img/>');
			jQimg.replaceWith(imgPlaceHolder);

			//load image
			var parent = this;
			imgPlaceHolder.load(function(){
				parent.count++;
				if(parent.count === parent.total) {
					parent.reset();
					parent.hideLoader();
					parent.slide.getWrapper().data('SimpleSlides.loaded', true);
					parent.slide.getContainer().data('SimpleSlides.global').state.setState('noload');
					methods.goTo.call(parent.slide.getContainer(),parent.slide.index);
				}
			});

			//replace attributes
			imgPlaceHolder.attr(attributes);
		},

		load : function(slide) {
			this.slide = slide;
			//set state
			this.slide.getContainer().data('SimpleSlides.global').state.setState('load');
			//slide images
			var slideImgs = this.slide.getWrapper().find('img');
			if(slideImgs.length) {
				//total images to load
				this.total = slideImgs.length;
				//load images
				var parent = this;
				slideImgs.each(function() {
					parent.loadImage($(this));
				});
			}else {
				this.slide.getWrapper().data('SimpleSlides.loaded', true);
				this.slide.getContainer().data('SimpleSlides.global').state.setState('noload');
				methods.goTo.call(this.slide.getContainer(),this.slide.index);
			}
		},

		reset : function() {
			//unbind load events
			this.slide.getWrapper().find('img').unbind('load');
			//reset settings
			this.count = 0;
			this.total = 0;
			this.hideLoader();
		}

	};

	//timer object
	
	var Timer = function() {
		var parent = this;

		function _counting() {
			parent.count+=parent.increment;
			if(parent.count >= parent.duration) {
				var callback = parent.callback;
				//reset timer
				parent.reset();
				if(callback) {callback();}
			}else {
				parent.counting();
			}
		}

		this.timeout = null;
		this.increment = 50;
		this.callback = false;
		this.isTiming = false;
		this.isCounting = false;
		this.duration = 0;
		this.count = 0;

		this.counting = function() {
			this.timeout = setTimeout(function(){_counting();},this.increment);
		};
	};

	Timer.prototype = {
		percent : function() {
			return Math.round(this.count / this.duration * 1000) / 1000;
		},
	

		start : function() {
			if(this.isCounting) {return false;}
			
			if(typeof arguments[0] === 'number') {this.duration = arguments[0];}
			if(typeof arguments[1] === 'function') {this.callback = arguments[1];}
			this.isTiming = true;
			this.isCounting = true;
			this.counting();

			return true;
		},
	
		stop : function() {
			if(this.isCounting) {
				this.isCounting = false;
				clearTimeout(this.timeout);

				return true;
			}

			return false;
		},
	
		reset : function() {
			this.stop();
			this.isTiming = false;
			this.callback = false;
			this.count = 0;
			this.duration = 0;
		}
	};
	
	//transition object
	
	var Transition = function() {
		//default
		if(typeof arguments[0] === 'object') {
			this.timer = arguments[0];
		}else {
			this.timer = new Timer();
		}
		this.ssA = false;
		this.ssB = false;
		this.animation = 'fade';
		this.duration = 1000;
		this.queue = 1;
		this.overflow = false;
		this.callback = false;
	};

	Transition.prototype = {

		setProperties : function () {
			var parent = this;
			if(typeof arguments[0] === 'object') {
				$.each(arguments[0], function(key, value) {
					if(typeof parent[key] !== 'undefined') {
						parent[key] = value;
					}
				});
			}
		},
		
		animate : function() {
			var pc = this.timer.percent();
			var settings = {
				'container':this.ssA.getContainer(),
				'slideA':this.ssA.getSlide(),
				'slideB':this.ssB.getSlide(),
				'duration':(pc===0) ? this.duration : this.duration * (1 - pc),
				'percent':pc,
				'overflow':this.overflow
			};
			//start transition
			Transition.animation(this.animation,settings);
		},
		
		start : function() {
			if(this.timer.isCounting) {return false;}
			this.setProperties(arguments[0]);

			//start timer & animate
			if(this.timer.isTiming) {
				this.timer.start();
			}else {
				//queue index
				this.ssB.getWrapper().css('z-index',this.queue);
				//display
				this.ssB.getWrapper().css('visibility','visible');
				this.timer.start(this.duration,this.callback);
			}

			this.animate();

			return true;
		},
	
		stop : function() {
			this.timer.stop();
			this.ssA.getWrapper().find('*').stop(true);
			this.ssB.getWrapper().find('*').stop(true);

			return true;
		},

		reset : function() {
			this.timer.reset();
			//slides
			this.stop();
			this.ssA.getSlide().css({
				'top':'0px',
				'left':'0px'
			});
			this.ssB.getSlide().css({
				'top':'0px',
				'left':'0px'
			});
			this.ssA.getWrapper().css({
				'visibility':'hidden',
				'z-index':0
			});
			this.ssB.getWrapper().css('z-index',0);
			//properties
			this.ssA = false;
			this.ssB = false;
			this.animation = 'fade';
			this.duration = 1000;
			this.queue = 1;
			this.overflow = false;
			this.callback = false;
		}

	};

	//static methods
	
	Transition.animation = function(animate,settings) {

		var presetTransitions = {

			fade : function(settings) {
				var op = parseFloat(settings.slideB.css('opacity'));
				if(op === 1) {settings.slideB.css({opacity:0});}
				if(settings.percent > 0) {settings.slideB.css({opacity:settings.percent});}
				settings.slideB.animate({
					opacity: 1
				}, settings.duration);
			},

			slideLeft : function(settings) {
				var mv = (settings.percent===0) ? settings.container.innerWidth() : parseInt(settings.slideB.css('left'));
				settings.slideB.css('left',mv+'px');
				settings.slideB.animate({
					left: '-='+mv
				}, settings.duration);
				if(settings.slideA) {
					settings.slideA.css('left',(mv-settings.container.innerWidth())+'px');
					settings.slideA.animate({
						left: '-='+mv
					}, settings.duration);
				}
			},

			slideLeftOver : function(settings) {
				var mv = (settings.percent===0) ? settings.container.innerWidth() : parseInt(settings.slideB.css('left'));
				settings.slideB.css('left',mv+'px');
				settings.slideB.animate({
					left: '-='+mv
				}, settings.duration);
			},

			slideRight : function(settings) {
				var mv = (settings.percent===0) ? settings.slideB.innerWidth() : Math.abs(parseInt(settings.slideB.css('left')));
				settings.slideB.css('left',-mv+'px');
				settings.slideB.animate({
					left: '+='+mv
				}, settings.duration);
				if(settings.slideA) {
					settings.slideA.css('left',(-mv+settings.slideB.outerWidth())+'px');
					settings.slideA.animate({
						left: '+='+mv
					}, settings.duration);
				}
			},

			slideRightOver : function(settings) {
				var mv = (settings.percent===0) ? settings.slideB.innerWidth() : Math.abs(parseInt(settings.slideB.css('left')));
				settings.slideB.css('left',-mv+'px');
				settings.slideB.animate({
					left: '+='+mv
				}, settings.duration);
			},

			slideUp : function(settings) {
				var mv = (settings.percent===0) ? settings.container.innerHeight() : 
						parseInt(settings.container.innerHeight() * (1 - settings.percent));
				settings.slideB.css('top',mv+'px');
				settings.slideB.animate({
					top: '-='+mv
				}, settings.duration);
				if(settings.slideA) {
					settings.slideA.css('top',(mv-settings.container.innerHeight())+'px');
					settings.slideA.animate({
						top: '-='+mv
					}, settings.duration);
				}
			},

			slideUpOver : function(settings) {
				var mv = (settings.percent===0) ? settings.container.innerHeight() : 
						parseInt(settings.container.innerHeight() * (1 - settings.percent));
				settings.slideB.css('top',mv+'px');
				settings.slideB.animate({
					top: '-='+mv
				}, settings.duration);
			},

			slideDown : function(settings) {
				var mv = (settings.percent===0) ? settings.slideB.innerHeight() : 
						parseInt(settings.slideB.innerHeight() * (1 - settings.percent));
				settings.slideB.css('top',-mv+'px');
				settings.slideB.animate({
					top: '+='+mv
				}, settings.duration);
				if(settings.slideA) {
					settings.slideA.css('top',(-mv+settings.slideA.outerHeight())+'px');
					settings.slideA.animate({
						top: '+='+mv
					}, settings.duration);
				}
			},

			slideDownOver : function(settings) {
				var mv = (settings.percent===0) ? settings.slideB.innerHeight() : 
						parseInt(settings.slideB.innerHeight() * (1 - settings.percent));
				settings.slideB.css('top',-mv+'px');
				settings.slideB.animate({
					top: '+='+mv
				}, settings.duration);
			}

		};
		
		if(typeof animate === 'string') {
			//if overflow is set, Over transitions must be implemented
			if(settings.overflow === true) {
				var index = animate.indexOf('Over');
				if(index === -1) {
					animate += 'Over';
				}
			}
			if(typeof presetTransitions[animate] === 'function') {
				presetTransitions[animate](settings);
			}else {
				presetTransitions.fade(settings);
			}
		}else if(typeof animate === 'function') {
			animate(settings);
		}else {
			$.error('Simple Slides Error: invalid transition. Transitions must '+
					'be of type string or function.');
		}
	};

	//publicly accessible methods $('div').simpleSlides('methodName')

	var methods = {

		init : function( options ) {
			
			//setup
			$(this).css('overflow','hidden');

			// Create some defaults, extending them with any options that were provided
			var settings = $.extend( true, {
				'json'  : false,
				'loader' : false,
				'slide' : 0,
				'transition' : {
					'default':{
						'duration':1000,
						'animation':'fade'
					}
				},
				'duration' : 2000,
				'autostart' : false,
				'overflow' : false,
				'maxOverflow' : 5
			}, options,
			//private settings
			{
				'id' : Math.round((Math.random() - 0.00001) * 100000),
				'total' : 0,
				'state' : new State(),
				'timer' : new Timer()
			});
			//transition queue
			settings.transitions = [new Transition(settings.timer)];
			
			return this.each(function(){
				
				//append json
				if(settings.json) {
					for(var i=0;i<settings.json.length;i++) {
						helpers.appendImage($(this),settings.json[i]);
					}
				}
				//delete json
				delete settings.json;

				//set total slides
				settings.total = $(this).children().length;

				//search for a loader image with class name "simpleSlides.loader"
				if($(this).children('.simpleSlides.loader').length === 0) {
					if(settings.loader) {
						//add loader class
						if(typeof settings.loader === 'string') {
							settings.loader = {
								'img':settings.loader,
								'class':'.simpleSlides.loader'
							};
						}else if(typeof settings.loader === 'object') {
							var className = ' .simpleSlides.loader';
							if(typeof settings.loader.class === 'string') {
								settings.loader.class += className;
							}else {
								settings.loader.class = className;
							}
						}
						//append loader
						helpers.appendImage($(this),settings.loader);
					}
				}else {
					settings.total -= 1;
				}

				//add loader object
				settings.loader = new Loader();

				//check start slide
				if(settings.slide >= settings.total || settings.slide < 0) {
					settings.slide = 0;
				}
				
				//stack & wrap children
				var wrapper = helpers.wrapElement($(this).children().first());
				//data loaded
				wrapper.data('SimpleSlides.loaded',false);
				//stack properties
				var heightInc = wrapper.height();
				var height = 0;
				//wrap remaining elements
				$(this).children().not(':eq(0)').each(function() {
					height+=heightInc;
					wrapper = helpers.wrapElement($(this));
					wrapper.css('top',-height+'px');
					wrapper.data('SimpleSlides.loaded',false);
				});
				//hide all but the starting slide
				$(this).children().not(':eq('+settings.slide+')').css('visibility','hidden');

				//set the class id
				$(this).addClass('simpleSlides'+settings.id);
				//save persistent data
				$(this).data('SimpleSlides.global', settings);
				
				//auto play
				if(settings.autostart) {
					methods.play.call($(this));
				}
			});
		},
		
		play : function() {
			
			this.each(function(){
				//current jQuery object
				var container = $(this);
				//retrieve global settings
				var settings = container.data('SimpleSlides.global');
				var state = settings.state.getState();
				//set play state
				settings.state.setState('play');
				//play states
				switch(state) {
					case 'pause-in': //paused between transitions
						settings.timer.start();
						break;
					case 'pause-tr': //paused during transitions
						for(var i=0;i<settings.transitions.length;i++) {
							settings.transitions[i].start();
						}
						break;
					case 'stop-in': //stopped between transitions
						settings.timer.start(settings.duration,function(){
							methods.next.call(container);
						});
						break;
				}
			});
		},
			
		pause : function() {
			
			this.each(function(){
				//retrieve global settings
				var settings = $(this).data('SimpleSlides.global');
				var state = settings.state.getState();

				//enter pause
				if(state !== 'load' && state !== 'stop-in' && state !== 'stop-tr') {
					settings.state.setState('pause');
				}

				switch(state) {
					case 'play-in': //playing between transitions
						settings.timer.stop();
						break;
					case 'play-tr': // playing during transitions
						for(var i=0;i<settings.transitions.length;i++) {
							settings.transitions[i].stop();
						}
						break;
				}
			});
		},
		 
		stop : function() {
			
			this.each(function(){
				//global settings
				var settings = $(this).data('SimpleSlides.global');
				var state = settings.state.getState();
				//check pause
				if(state === 'pause-in' || state === 'pause-tr') {return false;}
				//check play
				if(state === 'play-in') {settings.timer.reset();}
				//set state
				settings.state.setState('stop');
			});
		},

		previous: function() {
			
			this.each(function(){
				//retrieve global settings
				var settings = $(this).data('SimpleSlides.global');
				//inrement slide
				var previous = (settings.slide===0) ? settings.total - 1 :
									settings.slide - 1;
									
				//filter goTo
				filters.goTo.call($(this),previous);
			});
		},

		next: function() {
			
			this.each(function(){
				//retrieve global settings
				var settings = $(this).data('SimpleSlides.global');
				//inrement slide
				var next = (settings.total===settings.slide+1) ? 0 :
									settings.slide + 1;
									
				//filter goTo
				filters.goTo.call($(this),next);
			});
		},
			
		goTo : function(slide) {
			
			this.each(function(){
				//retrieve global settings
				var settings = $(this).data('SimpleSlides.global');
				var state = settings.state.getState();
				//get slide objects
				var ssA = new SimpleSlide(settings.id,settings.slide);
				var ssB = new SimpleSlide(settings.id,slide);
				//load slide
				if(!ssB.getWrapper().data('SimpleSlides.loaded')) {
					settings.loader.load(ssB);
					return false;
				}

				//transition settings
				var stransition=(typeof settings.transition[slide]==='undefined') ? settings.transition.default:
							settings.transition[slide];
				if(typeof stransition === 'string' || typeof stransition === 'function') {
					stransition = {
						'animation':stransition,
						'duration':settings.transition.default.duration
					};
				}else if(typeof stransition === 'object') {
					if(typeof stransition.duration === 'undefined') {
						stransition.duration = settings.transition.default.duration;
					}
					if(typeof stransition.animation === 'undefined') {
						stransition.animation = settings.transition.default.animation;
					}
				}
				//queue transition
				if(state === 'play-tr' || state === 'stop-tr') {
					var ntransition=new Transition();
					settings.transitions.push(ntransition);
				}
				//set current slide
				settings.slide = slide;
				//enter transition state
				settings.state.setState('tr');
				//start transition
				settings.transitions[settings.transitions.length-1].start(
					{
						'ssA':ssA,
						'ssB':ssB,
						'animation':stransition.animation,
						'duration':stransition.duration,
						'queue':settings.transitions.length,
						'overflow':settings.overflow,
						'callback':function(){
							//finish transitions
							if(settings.slide === ssB.getWrapper().index()) {
								//exit transition
								settings.state.setState('no-tr');
								//reset transition queue
								for(var i=0; i < settings.transitions.length; i++) {
									settings.transitions[i].reset();
								}
								settings.transitions.length = 1;
								//play next slide
								if(settings.state.getState() === 'play-in') {
									settings.state.setState('stop');
									methods.play.call(ssB.getContainer());
								}
							}
						}
					}
				);
			});
		},

		destroy : function() {
			
			this.each(function(){
				//retrieve global settings
				var settings = $(this).data('SimpleSlides.global');
				//reset transitions 
				for(var i=0; i < settings.transitions.length; i++) {
					settings.transitions[i].reset();
				}
				//reset global timer
				settings.timer.reset();
				//clear child data
				$(this).children().each(function() {
					$(this).removeData('SimpleSlides.loaded');
				});
				//clear global data
				$(this).removeData('SimpleSlides.global');
			});
		}
	};
	
	//jQuery plugin

	$.fn.simpleSlides = function( method ) {
		//call the methods from the methods variable
		if ( methods[method] ) {
			filters.methods.apply( this, arguments );
			return this;
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.simpleSlides' );
		}
	};

})(jQuery);
