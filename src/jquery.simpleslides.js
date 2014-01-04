/**
* @name             Simple Slides
* @descripton       Turns the elements inside a div into slides with assigned
*                   transitions, handles image loading, and can act as a
*                   slideshow.
* @version          0.2.4
* @requires         Jquery 1.6+
*                   https://github.com/YodaPop/jquery-simple-timer
*                   https://github.com/YodaPop/jquery-simple-image-load
*                   https://github.com/moappi/jquery.json2html
*
* @author           Ben Gullotti
* @author-email     ben@bengullotti.com
* @author-site      https://github.com/YodaPop
*
* @license          MIT License -
*                   http://www.opensource.org/licenses/mit-license.php
*/

(function($) {

	// private

	/**
	 * An object containing the public properties used for the plugin's default
	 * settings.
	 *
	 * @property _settings
	 * @type Object
	 * @private
	 **/
	var _settings = {
		json                :   false,
		loader              :   false,
		slide               :   0,
		transitions         :   {
			onDefault       :   {
				duration            :   0,
				animation           :   'none'
			}
		},
		duration            :   1000,
		autostart           :   false,
		overlay             :   false,
		maxOverlay          :   5,
		onStartTransition   :   false,
		onEndTransition     :   false,
	};

	// classes

	/**
	 * A class used to track the state of the slideshow
	 *
	 * @class State
	 * @constructor
	 **/
	var State = function() {
		// defaults
		this.isPlaying          = false;
		this.isPaused           = false;
		this.isTransitioning    = false;
		this.isLoading          = false;
	};

	State.prototype = {

		/**
		 * Get the state of the slides.
		 *
		 * @class State
		 * @method getState
		 * @return {String} The state of the slides
		 **/
		getState : function() {
			// state 0: loading
			if( this.isLoading ) {
				return 'loading';
			}
			// state 1: playing between transitions
			if( this.isPlaying && !this.isPaused && !this.isTransitioning ) {
				return 'play-interval';
			}
			// state 2: playing during transitions
			if( this.isPlaying && !this.isPaused ) {
				return 'play-transition';
			}
			// state 3: paused between transitions
			if( this.isPlaying && this.isPaused && !this.isTransitioning ) {
				return 'pause-interval';
			}
			// state 4: paused during transitions
			if( this.isPlaying && this.isPaused ) {
				return 'pause-transition';
			}
			// state 5: stopped between transitions
			if( !this.isTransitioning ) {
				return 'stop-interval';
			}
			// state 6: stopped during transitions
			return 'stop-transition';
		},

		/**
		 * Set the state of the slides.
		 *
		 * @class State
		 * @method setState
		 * @param {String} state The state of the slides
		 **/
		setState : function( state ) {
			switch( state ) {
				case 'loading':
					this.isLoading = true;
					break;
				case 'not-loading':
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
				case 'transitioning':
					this.isTransitioning = true;
					break;
				case 'not-transitioning':
					this.isTransitioning = false;
					break;
			}
		}
	};

	/**
	 * A class used to encapsulate common calls to the slides, wrappers, and the
	 * container.
	 *
	 * @class SimpleSlide
	 * @param {Object} The slide wrapper as a jQuery object
	 * @constructor
	 **/
	var SimpleSlide = function ( jQwrapper ) {
		this.jQwrapper = jQwrapper;
	};

	SimpleSlide.prototype = {

		/**
		 * Gets the index of the slide wrapper
		 *
		 * @method getIndex
		 * @return {Number} A number representing the index of the slide wrapper
		 * relative to its sibling slides.
		 **/
		getIndex : function() {
			return this.jQwrapper.index();
		},

		/**
		 * Gets the container of the slide wrapper
		 *
		 * @method getContainer
		 * @return {Object} The container jQuery object
		 **/
		getContainer : function () {
			return this.jQwrapper.parent();
		},

		/**
		 * Gets the wrapper of the slide
		 *
		 * @method getWrapper
		 * @return {Object} The slide wrapper jQuery object
		 **/
		getWrapper : function () {
			return this.jQwrapper;
		},

		/**
		 * Gets the slide
		 *
		 * @method getSlide
		 * @return {Object} The slide jQuery object
		 **/
		getSlide : function () {
			return this.jQwrapper.children().first();
		}
	};

	/**
	 * Handles the creation, retrieval, and method calls for an array of
	 * transitions.
	 *
	 * @class Queue
	 * @param {Object} transitions The transitions object set when the
	 * plugin was initialized.
	 * @constructor
	 **/
	var Queue = function ( transitions ) {
		this._transitions = transitions;
		this._queue = [];
	};

	Queue.prototype = {

		/**
		 * Calls the method passed as a string on all of the transitions in the
		 * queue.
		 *
		 * @method _call
		 * @param {Mixed} method The name of the method
		 * @private
		 **/
		_call : function ( method ) {
			for ( var i = 0; i < this._queue.length; i++ ) {
				this._queue[i][method]();
			}
		},

		/**
		 * Adds a transition to the queue based on the string or object given.
		 * If no string is given, the default transition is used.
		 *
		 * @method add
		 * @param {Mixed} name The name or index of the transition
		 * @param {Object} settings The transitions settings
		 * @return {Object} The Queue object
		 * @chainable
		 **/
		add : function ( name, settings ) {
			// add queue setting
			$.extend(settings, {
				queue   :   this._queue.length + 1
			});
			// merge settings
			settings = $.extend({}, this._transitions.
				getSettings(settings.slide, name), settings);
			// new Transition
			var transition = new Transition(settings);
			// add the transition settings to the queue
			this._queue.push(transition);

			return this;
		},

		/**
		 * Clears the queue of all transitions.
		 *
		 * @method clear
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		clear : function () {
			this._queue.length = 0;

			return this;
		},

		/**
		 * Starts all of the transitions in the queue.
		 *
		 * @method start
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		start : function () {
			this._call('start');

			return this;
		},

		/**
		 * Stops all of the transitions in the queue.
		 *
		 * @method stop
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		stop : function () {
			this._call('stop');

			return this;
		},

		/**
		 * Resets all of the transitions in the queue.
		 *
		 * @method reset
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		reset : function () {
			this._call('reset');

			return this;
		},

	};

	/**
	 * Handles the transition settings object and the creation of transitions
	 * based on those settings. Transition settings are key -> value
	 * pairs. The keys represent the name of the transition such as "onDefault",
	 * "onNext", and "onPrevious". The values represent the transition and timer
	 * settings.
	 *
	 * @class TransitionSettings
	 * @param {Object} transitions The transition settings object passed when
	 * the plugin is initialized.
	 * @constructor
	 **/
	var Transitions = function ( transitions ) {
		// set onDefault settings
		this._ts = {};
		this._ts.onDefault = _settings.transitions.onDefault;
		// initialize the transition settings
		this._init(transitions);
	};

	Transitions.prototype = {

		/**
		 * Initializes the Queue by setting the default transition along with
		 * the transitions passed using the transitions property when the plugin
		 * is initialized.
		 *
		 * @method init
		 * @param {Mixed} transition The name of the transition or an object
		 * with key transition names/indexes and value transition settings
		 * @private
		 **/
		_init : function ( transitions ) {
			if ( typeof transitions === 'object' ) {
				// set the onDefault transition settings
				if ( transitions['animation'] || transitions['duration'] ) {
					this.add('onDefault', transitions);
				}else {
					// add all transitions
					for ( transition in transitions ) {
						this.add(transition, transitions[transition]);
					}
				}
			}else if ( typeof transitions === 'string' ) {
				// set the onDefault animation setting
				this._ts.onDefault.animation = transitions;
			}
		},

		/**
		 * Retrieves the transition settings of the given name. If the name or
		 * the index of the transition settings does not exist, the "onDefault"
		 * transition settings are returned.
		 *
		 * @method getSettings
		 * @param {Number} slide The slide index
		 * @param {String} animation The name of the animation.
		 * @return {Object} An object containing the transition settings
		 **/
		getSettings : function ( slide, animation ) {
			// override animation
			if ( this._ts[animation] ) {
				if ( animation == 'onDefault' || animation == 'onNext' ||
					 animation == 'onPrevious' ) {
					if ( this._ts[slide] ) {
						// slide specific settings
						return this._ts[slide];
					}
				}
				return this._ts[animation];
			}
			// no override
			if ( this._ts[slide] ) {
				// slide specific settings
				return this._ts[slide];
			}else {
				// default settings
				return this._ts.onDefault;
			}
		},

		/**
		 * Adds a transition to the transition settings object based on the
		 * name and settings given. If the transition name already exists, the
		 * settings for that transition will be overridden.
		 *
		 * @method add
		 * @param {Mixed} name The name or index of the transition
		 * @param {Object} settings The transition settings
		 * @return {Object} The TransitionSettings object
		 * @chainable
		 **/
		add : function ( name, settings ) {
			// default settings
			this._ts[name] = $.extend({},_settings.transitions.onDefault);
			// extend over
			this._ts[name] = helpers.extendOver(this._ts[name], settings);

			return this;
		},

		/**
		 * Clears all transitions except for the "onDefault" transition.
		 *
		 * @method clear
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		clear : function () {
			// get default
			var onDefault = this._ts.onDefault;
			// clear the object
			this._ts = {};
			// add the default
			this._ts['onDefault'] = onDefault;

			return this;
		},

	};

	/**
	 * A class that handles a transition between 2 slides. Settings may include
	 * settings for the SimpleTimer plugin.
	 *
	 * @class Transition
	 * @constructor
	 **/
	var Transition = function( options ) {
		// default settings
		this.settings = {
			ssA         :   false,
			ssB         :   false,
			animation   :   'none',
			queue       :   1,
			overlay     :   false,
			onStart     :   false,
			onEnd       :   false,
		};
		// update
		this.update(options);
	};

	Transition.prototype = {

		/**
		 * Updates the object's animation property.
		 *
		 * @class Transition
		 * @method setAnimation
		 * @param {Mixed} animation A string or function.
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		setAnimation : function( animation ) {
			// Simple Slides settings
			var settings = ssA.getContainer().data('SimpleSlides.settings');
			// apply animation to settings
			this.settings.animation = options;
		},

		/**
		 * Updates the object's settings. Settings may include settings for the
		 * Simple Timer plugin.
		 *
		 * @class Transition
		 * @method update
		 * @param {Mixed} options A string, function, or object. A string or
		 * function will be used to set an animation. An object will be used to
		 * override the current settings.
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		update : function( options ) {
			// update the transition animation
			if ( typeof animation === 'string' ||
				 typeof animation === 'function' ) {
				this.setAnimation(options);
				return this;
			}
			// apply transition settings
			$.extend(this.settings, options);
			// simple timer settings
			var settingsTimer = helpers.extendOver(
				$.simpleTimer('getDefaultSettings'),
				this.settings);
			// update the timer on slide A
			if ( !this.settings.ssA.getWrapper().
				 data('SimpleTimer.settings') ) {
				this.settings.ssA.getWrapper().simpleTimer(settingsTimer);
			}else {
				this.settings.ssA.getWrapper().
					simpleTimer('update', settingsTimer);
			}

			return this;
		},

		/**
		 * Start the transition
		 *
		 * @class Transition
		 * @method start
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		start : function() {
			// check if the transition has already been started
			if ( this.settings.ssA.getWrapper().simpleTimer('getTiming') ) {
				return false;
			}

			/**
			 * Collect the animation settings to be passed to the animation
			 * function
			*/
			// get the percentage
			var pc = this.settings.ssA.getWrapper().simpleTimer('getPercent');
			// calculate the duration based on the percentage
			if ( pc === 0 ) {
				var pDuration = this.settings.duration;
			}else {
				var pDuration = this.settings.duration * (1 - pc);
			}
			// create settings
			var settings = {
				container   :   this.settings.ssA.getContainer(),
				slideA      :   this.settings.ssA.getSlide(),
				slideB      :   this.settings.ssB.getSlide(),
				duration    :   pDuration,
				percent     :   pc,
				overlay     :   this.overlay
			};
			// onStart event
			if ( this.settings.onStart ) {
				this.settings.onStart({
					container   :   settings.container,
					slideA      :   settings.slideA,
					slideB      :   settings.slideB,
				});
			}
			// start transition
			Transition.animation(this.settings.animation, settings);

			// queue index
			this.settings.ssB.getWrapper().css('z-index',this.settings.queue);
			// display slide B
			this.settings.ssB.getWrapper().css('visibility','visible');
			// start timer
			this.settings.ssA.getWrapper().simpleTimer('start');

			return this;
		},

		/**
		 * Stop the transition
		 *
		 * @class Transition
		 * @method stop
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		stop : function() {
			// stop timer
			this.settings.ssA.getWrapper().simpleTimer('stop');
			// stop all jQuery animation
			this.settings.ssA.getWrapper().find('*').stop(true);
			this.settings.ssB.getWrapper().find('*').stop(true);

			return this;
		},

		/**
		 * Reset the transition
		 *
		 * @class Transition
		 * @method reset
		 * @return {Object} The Transition object
		 * @chainable
		 **/
		reset : function() {
			// stop transition
			this.stop();
			// reset timer
			this.settings.ssA.getWrapper().simpleTimer('reset');
			// reset slides
			this.settings.ssA.getSlide().css({
				'top':'0px',
				'left':'0px'
			});
			this.settings.ssB.getSlide().css({
				'top':'0px',
				'left':'0px'
			});
			this.settings.ssA.getWrapper().css({
				'visibility':'hidden',
				'z-index':0
			});
			this.settings.ssB.getWrapper().css('z-index',0);
			//properties
			this.settings.ssA = false;
			this.settings.ssB = false;
			this.settings.animation = 'none';
			this.settings.duration = 1000;
			this.settings.queue = 1;
			this.settings.overlay = false;
			this.settings.callback = false;
		}

	};

	/**
	 * static methods used to handle any added transitions or any transition
	 * passed in as a function. The only built-in "transition" is no transition
	 * (none).
	 */
	Transition.transitions = {

		none : function( settings ) {
			// set slide B to show
			settings.slideB.css('visibility', 'visible');
			// set slide A to hidden
			settings.slideA.css('visibility', 'hidden');
		},

	}

	Transition.animation = function( animate, settings ) {
		if(typeof animate === 'string') {
			// if overlay is set, "Over" transitions must be implemented
			if ( settings.overlay === true ) {
				var index = animate.indexOf('Over');
				if ( index === -1 ) {
					animate += 'Over';
				}
			}
			if ( typeof Transition.transitions[animate] === 'function' ) {
				// apply the added transition
				Transition.transitions[animate](settings);
			}else {
				// default to no transition
				Transition.transitions.none(settings);
			}
		}else if ( typeof animate === 'function' ) {
			animate(settings);
		}else {
			$.error('Simple Slides Error: invalid transition. Transitions ' +
					'must be of type string or function.');
		}
	};

	/**
	 * Helper functions used privately by the plugin for common, simple tasks
	 */
	var helpers = {

		/**
		 * Adds the properties of the options object that are also defined in
		 * the target object to the target object. Null values are ignored.
		 *
		 * @method helpers.extendOver
		 * @param {Object} target The target object
		 * @param {Object} options The options used to override the properties
		 * of the target object
		 * @return {Object} The new object
		 * @private
		 **/
		extendOver : function(target, options) {
			for ( prop in options ) {
				if ( typeof target[prop] !== 'undefined' &&
					 typeof options[prop] !== 'null' ) {
					// add the property to the target
					target[prop] = options[prop];
				}
			}

			return target;
		},

		/**
		 * Wrap the jQuery object inside of a DIV element.
		 *
		 * @method helpers.wrapElement
		 * @param {Object} jQobj The jQuery object
		 * @return {Object} The new wrapper jQuery object
		 * @private
		 **/
		wrapElement : function( jQobj ) {
			var wrapper = $('<div></div>').insertAfter(jQobj);
			jQobj.remove();
			wrapper.append(jQobj);
			wrapper.css({
				'width'     :   '100%',
				'height'    :   '100%',
				'position'  :   'absolute',
				'display'   :   'block',
				'z-index'   :   0
			});
			// slide & loader css
			jQobj.css({
				'display'   :   'block',
				'position'  :   'relative',
				'top'       :   '0px',
				'left'      :   '0px'
			});

			return wrapper;
		},

	},

	// public

	/**
	 * Filters applied before method calls.
	 */
	filters = {

		/**
		 * A filter applied before all get methods except defaultSettings are
		 * called.
		 *
		 * @method filters.get
		 * @param {Object} method The get method
		 * @return {Mixed} The get method if it exists, otherwise false.
		 **/
		get : function( method ) {
			// get default settings
			if ( method == 'defaultSettings' ) {
				return get.defaultSettings();
			}
			// no elements were selected
			if ( this.length === 0 ) {
				return false;
			}
			// call get method
			if ( get[method] ) {
				return get[method].apply( this,
					Array.prototype.slice.call(arguments, 1) );
			}else {
				return false;
			}
		},

		/**
		 * A filter applied before all methods are called. The filter ensures
		 * that all of the jQuery objects selected were initialized.
		 *
		 * @method filters.methods
		 * @param {Object} method The method about to be filtered
		 * @return {Object} The jQuery object from which the method was called
		 * @chainable
		 **/
		methods : function( method ) {
			// filter out the uninitialized
			var filtered = this.filter(function() {
				if( $(this).data('SimpleSlides.settings' ) === null) {
					$.error('Simple Slides Error: method "' + method +
						'" was called on an element ' +
					'which has not initialized the plugin');

					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if( filtered.length === 0 ) {
				return false;
			}

			// apply filter to specific methods
			if( typeof filters[method] === 'function' ) {
				filters[method].apply(filtered,
					Array.prototype.slice.call( arguments, 1 ));
			}else {
				methods[method].apply(filtered,
					Array.prototype.slice.call( arguments, 1 ));
			}

			// return the jQuery object to keep the method chainable
			return this;
		},

		/**
		 * A filter applied before the goTo method is called. The filter
		 * checks to make sure the object is ready to goto the given slide.
		 *
		 * @method filters.start
		 * @param {Number} slide The index of the slide to go to
		 * @chainable
		 **/
		goTo : function( slide, animation ) {
			// check slide
			if( typeof slide === 'undefined' ) {
				$.error('Simple Slides Error: method goTo expects second ' +
					'argument the slide #. No argument given.');

				return false;
			}

			// convert to integer
			if( typeof slide !== 'number' ) {
				slide = parseInt(slide);
			}

			var filtered = this.filter(function() {
				// global settings
				var settings = $(this).data('SimpleSlides.settings');
				var state = settings.state.getState();

				// check load or pause
				if( state === 'loading' || state === 'pause-interval' ||
					state === 'pause-transition' ) {
					return false;
				}
				// check overlay
				if( !settings.overlay ) {
					if ( state === 'play-transition' ||
						 state === 'stop-transition' ) {
						return false;
					}
				}else {
					// check queue
					if( settings.queue.length >= settings.maxOverlay ||
						settings.queue.length+1 >= settings.total ) {
						return false;
					}
				}
				// check current slide
				if( slide === settings.slide ) {
					return false;
				}
				// check slide range
				if( slide < 0 || slide >= settings.total ) {
					$.error('Simple Slides Error: slide parameter (' + slide +
						') passed to goTo() must be a number greater than 0 ' +
						'and less than the total slides (' + settings.total +
						')');
					return false;
				}
				// check if slide is currently in use
				if( $(this).children().eq(slide).css('visibility') ===
					'visible' ) {
					return false;
				}

				return true;
			});

			//check filtered before proceeding
			if( filtered.length === 0 ) {

				return false;
			}

			//Go To
			methods.goTo.call( filtered, slide, animation );
		}
	},

	/**
	 * Setter functions called using
	 * $(selector).simpleTimer('set' + methodName) or
	 * $.simpleSlides('get' + methodName)
	 * WARNING: These methods are not chainable.
	 */
	set = {

		/**
		 * Set the private default settings object used to initialize the
		 * public settings of the plugin.
		 *
		 * @method set.defaultSettings
		 * @param {Object} options The options used to override the default
		 * settings
		 **/
		defaultSettings : function( options ) {
			$.extend(_settings, options);
		},

		/**
		 * Add or override named transitions with an object. The objects keys
		 * represent the name of the transition and it's value is the function
		 * that will be used for the transition.
		 *
		 * @method set.transitions
		 * @param {Object} transitions The object containing the transition(s)
		 * names and functions
		 */
		transitions : function ( transitions ) {
			$.extend(Transition.transitions, transitions);
		},

	},

	/**
	 * Getter functions called using
	 * $(selector).simpleTimer('get' + methodName) or
	 * $.simpleTimer('get' + methodName)
	 * WARNING: These methods are not chainable.
	 */
	get = {

		/**
		 * Get the private default settings object used to initialize the
		 * public settings of the plugin.
		 *
		 * @method get.defaultSettings
		 * @return {Object} The default settings object
		 **/
		defaultSettings : function() {
			// apply to each element
			return _settings;
		},

		/**
		 * Get a specific setting passed in as a string.
		 *
		 * @method get.settings
		 * @param {String} The name of a specific setting
		 * @return {Mixed} Returns the value of the settings or, if there is
		 * more than one element selected, an array of values. If no settings
		 * exist on an element, it defaults to false.
		 **/
		settings : function( str ) {
			// the return array
			var arr = [];
			// loop through the elements
			$(this).each(function() {
				var settings = $(this).data('SimpleTimer.settings');
				if ( settings === undefined ) {
					// default to false
					arr.push(false);
				}else {
					// add settings
					arr.push(settings);
				}
			});

			if ( this.length === 1 ) {
				// return for one element
				return arr[0];
			}else {
				// return for multiple selected elements
				return arr;
			}
		},

		/**
		 * Get a specific setting passed in as a string.
		 *
		 * @method get.setting
		 * @param {String} The name of a specific setting
		 * @return {Mixed} Returns the value of the setting or, if there is more
		 * than one element selected, an array of values. If no settings exist
		 * on an element, it defaults to false.
		 **/
		setting : function( str ) {
			// the return array
			var arr = [];
			// loop through the elements
			$(this).each(function() {
				var settings = $(this).data('SimpleTimer.settings');
				if ( settings === undefined ||
					 settings[str] === undefined ) {
					// default to false
					arr.push(false);
				}else {
					// add setting
					arr.push(settings[str]);
				}
			});

			if ( this.length === 1 ) {
				// return for one element
				return arr[0];
			}else {
				// return for multiple selected elements
				return arr;
			}
		},

		/**
		 * Get the percentage  of how close the timer is to its duration on the
		 * selected elements. The percentage is calculated based on the
		 * increment and the duration. Thus, a smaller increment relative to
		 * the duration will yield a more accurate percentage.
		 *
		 * @method get.percent
		 * @return {Mixed} Returns a single floating point value between 0 and 1
		 * if one element was selected, otherwise it returns an array of
		 * floating points. If an element has not been initialized, the value
		 * defaults to false.
		 **/
		percent : function() {
			// the return array
			var arr = [];
			// loop through the elements
			$(this).each(function() {
				var settings = $(this).data('SimpleTimer.settings');
				if ( settings === undefined ) {
					// default to false
					arr.push(false);
				}else {
					// set percent to the nearest 1000th
					arr.push(Math.round(settings.count /
						settings.duration * 1000) / 1000);
				}
			});

			if ( this.length === 1 ) {
				// return for one element
				return arr[0];
			}else {
				// return for multiple selected elements
				return arr;
			}
		},

		/**
		 * Get a boolean indicating whether are not the timer is currently
		 * timing.
		 *
		 * @method get.timing
		 * @return {Mixed} Returns true if the timer is currently timing, false
		 * otherwise. A single boolean is returned if one element was selected,
		 * otherwise it returns an array of booleans. If an element has not been
		 * initialized, the value defaults to false.
		 **/
		timing : function() {
			// the return array
			var arr = [];
			// loop through the elements
			$(this).each(function() {
				var settings = $(this).data('SimpleTimer.settings');
				if ( settings === undefined ) {
					// default to false
					arr.push(false);
				}else {
					// check the timeout setting
					if ( settings.timeout === false ) {
						arr.push(false);
					}else {
						arr.push(true);
					}
				}
			});

			if ( this.length === 1 ) {
				// return for one element
				return arr[0];
			}else {
				// return for multiple selected elements
				return arr;
			}
		},

	},

	/**
	 * Publicly accessible methods called via
	 * $("selector").simpleSlides("methodName").
	 */
	methods = {

		/**
		 * The initialization method. Used to set the properties of the timer
		 * and attach the data to the selected jQuery objects.
		 *
		 * @method methods.init
		 * @param {Object} options An object used to set publicly accessible
		 * options such as the timer's increment, duration, and callbacks (see
		 * README.md for details)
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		init : function( options ) {
			// CSS
			// hide the slides that are outside the container
			$(this).css({
				overflow : 'hidden',
				position : 'relative',
			});

			// SETTINGS
			/**
			 * Create some defaults, extending them with any options that were
			 * provided
			 */
			// simple slides settings
			var settings = $.extend( true, {}, _settings, options,
			// private settings
			{
				total   :   0,
				state   :   new State(),
			});
			// transition settings
			settings.transitions = new Transitions(settings.transitions);
			// transition queue
			settings.queue = new Queue(settings.transitions);
			// simple timer settings
			var settingsTimer = helpers.extendOver(
				$.simpleTimer('getDefaultSettings'),
				settings);
			// add Simple Timer to container
			$(this).simpleTimer(settingsTimer);

			return this.each(function(){
				// json data for images using json2html
				if ( settings.json ) {
					$(this).json2html(
						// data
						settings.json,
						// transform
						{
							tag     :   'img',
							class   :   '${class}',
							src     :   '${src}',
						}
					);
					// delete json
					settings.json = undefined;
				}

				// get loader
				if ( $('.simpleslides-loader').length > 0 ) {
					var loader = $('.simpleslides-loader');
					loader.remove();
				}else {
					var loader = false;
				}

				// set total slides
				settings.total = $(this).children().length;

				// check start slide
				if ( settings.slide >= settings.total || settings.slide < 0 ) {
					settings.slide = 0;
				}

				// stack & wrap children
				$(this).children().each(function() {
					var wrapper = helpers.wrapElement($(this));
					// load images
					if ( loader && $(this).is('img') ) {
						// add loader
						loader.clone().appendTo(wrapper).css({
							position    :   'relative',
							display     :   'block',
						});
						// onLoad event
						$(this).simpleImageLoad({
							onLoad  :   function() {
								wrapper.find('.simpleslides-loader').remove();
							},
							onError :   function() {
								wrapper.find('.simpleslides-loader').remove();
							},
						});
					}
				});
				// hide all but the starting slide
				$(this).children().not(':eq(' + settings.slide + ')')
					.css('visibility','hidden');
				// set the starting slide to active class
				$(this).children().eq(settings.slide).addClass(
					'simpleslides-active');

				// save persistent data
				$(this).data('SimpleSlides.settings', settings);

				// auto play
				if ( settings.autostart ) {
					methods.play.call($(this));
				}
			});
		},

		/**
		 * Starts playing the slides
		 *
		 * @method methods.play
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		play : function() {

			this.each(function() {
				// current jQuery object
				var container = $(this);
				// retrieve global settings
				var settings = container.data('SimpleSlides.settings');
				var state = settings.state.getState();
				// set play state
				settings.state.setState('play');
				// play states
				switch ( state ) {
					case 'pause-interval': // paused between transitions
						container.simpleTimer('start');
						break;
					case 'pause-transition': // paused during transitions
						settings.queue.start();
						break;
					case 'stop-interval': // stopped between transitions
						container.simpleTimer('update', {
							onComplete  :   function() {
								methods.next.call(container);
							}
						}).simpleTimer('start');
						break;
				}
			});
		},

		/**
		 * Pauses the slides. If a transition is in progress, the transition
		 * will be stopped along with all jQuery animations.
		 *
		 * @method methods.pause
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		pause : function() {

			this.each(function(){
				// current jQuery object
				var container = $(this);
				// retrieve global settings
				var settings = $(this).data('SimpleSlides.settings');
				var state = settings.state.getState();

				// enter pause
				if ( state !== 'loading' && state !== 'stop-interval' &&
					 state !== 'stop-transition') {
					settings.state.setState('pause');
				}

				switch ( state ) {
					case 'play-interval': // playing between transitions
						container.simpleTimer('stop');
						break;
					case 'play-transition': // playing during transitions
						settings.queue.stop();
						break;
				}
			});
		},

		/**
		 * Stops the slides. If a transition is in progress, the transition will
		 * run its course, stopping on slide B.
		 *
		 * @method methods.stop
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		stop : function() {

			this.each(function(){
				// current jQuery object
				var container = $(this);
				// global settings
				var settings = $(this).data('SimpleSlides.settings');
				var state = settings.state.getState();
				// if paused, stop does not apply
				if ( state === 'pause-interval' || state === 'pause-transition' ) {
					return false;
				}
				// the container's timer is reset
				container.simpleTimer('reset');
				// set state
				settings.state.setState('stop');
			});
		},

		/**
		 * Go to the previous slide.
		 *
		 * @method methods.previous
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		previous : function() {

			this.each(function(){
				// retrieve global settings
				var settings = $(this).data('SimpleSlides.settings');
				// inrement slide
				var previous = ( settings.slide === 0 ) ? settings.total - 1 :
								settings.slide - 1;
				// filter goTo
				filters.goTo.call($(this), previous, 'onPrevious');
			});
		},

		/**
		 * Go to the next slide.
		 *
		 * @method methods.next
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		next : function() {

			this.each(function(){
				// retrieve global settings
				var settings = $(this).data('SimpleSlides.settings');
				// inrement slide
				var next = ( settings.total===settings.slide+1 ) ? 0 :
							settings.slide + 1;
				//filter goTo
				filters.goTo.call($(this), next, 'onNext');
			});
		},

		/**
		 * Go to the given slide.
		 *
		 * @method methods.goTo
		 * @param {Number} slide The index of the slide to go to
		 * @param {String} animation The transition animation. Used to override
		 * the slide's animation (optional)
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		goTo : function( slide, animation ) {

			this.each(function(){
				// current jQuery object
				var container = $(this);
				// retrieve global settings
				var settings = $(this).data('SimpleSlides.settings');
				var state = settings.state.getState();
				// get Simple Slide objects
				var ssA = new SimpleSlide(container.children().
					eq(settings.slide));
				var ssB = new SimpleSlide(container.children().eq(slide));
				// loading
				// set current slide
				settings.slide = slide;
				// new transition
				settings.queue.add(animation, {
					ssA         :   ssA,
					ssB         :   ssB,
					slide       :   slide,
					overlay     :   settings.overlay,
					onStart     :   settings.onStartTransition,
					onComplete  :   function(){
						// finish transitions
						if ( settings.slide === ssB.getWrapper().index() ) {
							// exit transition
							settings.state.setState('not-transitioning');
							// reset queue
							settings.queue.reset();
							// clear queue
							settings.queue.clear();
							// onEndTransition event
							if ( settings.onEndTransition ) {
								settings.onEndTransition({
									container   :   container,
									slideA      :   ssA.getSlide(),
									slideB      :   ssB.getSlide(),
								});
							}
							// active class
							ssA.getWrapper().removeClass('simpleslides-active');
							ssB.getWrapper().addClass('simpleslides-active');
							// play next slide
							if ( settings.state.getState() === 'play-interval' )
							{
								methods.stop.call(container);
								methods.play.call(container);
							}
						}
					}
				})
				// start the last transition
				.start();
				// enter transition state
				settings.state.setState('transitioning');
			});
		},

		destroy : function() {

			this.each(function(){
				// current jQuery object
				var container = $(this);
				// retrieve global settings
				var settings = $(this).data('SimpleSlides.settings');
				// reset transitions 
				settings.queue.reset();
				// reset global timer
				container.simpleTimer('start');
				// clear child data
				$(this).children().each(function() {
					$(this).removeData('SimpleTimer.settings');
				});
				// clear global data
				$(this).removeData('SimpleSlides.settings');
			});
		}
	};

	// jQuery selected

	$.fn.simpleSlides = function( method ) {
		if ( typeof method === 'string' ) {
			if ( method.substr(0, 3) === 'get' ) {
				method = method.substr(3, 1).toLowerCase() +
					method.substr(4);
				// getter functions (not chainable)
				return filters.get.apply( this, arguments );
			} else if ( methods[method] ) {
				// filtered methods
				return filters.methods.apply( this, arguments );
			} else {
				$.error('Simple Slides Error: method ' +  method +
					' does not exist.');
			}
		} else if ( typeof method === 'object' || ! method ) {
			// initialize the plugin
			return methods.init.apply( this, arguments );
		}
		// general exception
		$.error('Simple Slides Error: the simple slides plugin expects at' +
			'least 1 paramater. The first paramater must be of type "string" ' +
			'or "object"');
	};

	// jQuery object (getters and setters only)

	$.simpleSlides = function( method ) {
		if ( typeof method === 'string' ) {
			suffix = method.substr(3, 1).toLowerCase() +
				method.substr(4);
			if ( method.substr(0, 3) === 'get' ) {
				// getter functions (not chainable)
				return filters.get.apply( [], [suffix].push(
						Array.prototype.slice.call( arguments, 1 )));
			}else if ( method.substr(0, 3) === 'set' ) {
				if ( set[suffix] ) {
					// getter functions (not chainable)
					return set[suffix].apply( [],
						Array.prototype.slice.call( arguments, 1 ));
				}
			}
		}
		// general exception
		$.error('Simple Slides Error: direct calls to simpleSlides only works ' +
			'with get or set functions');
	};

})(jQuery);
