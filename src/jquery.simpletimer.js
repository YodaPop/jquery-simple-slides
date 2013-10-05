/**
* @name             Simple Timer
* @descripton       A jQuery plugin that adds a timer to an element with an
*                   assigned interval and duration.
*
* @version          0.1.9
* @requires         Jquery 1.4+
*
* @author           Ben Gullotti
* @author-email     ben@bengullotti.com
* @author-site      https://github.com/YodaPop
*
* @license          MIT License -
*                   http://www.opensource.org/licenses/mit-license.php
**/

(function($) {

	/**
	 * Private methods and objects
	 */

	var _private = {

		/**
		 * An object containing the public properties used for the timer plugin set
		 * to their default settings.
		 *
		 * @property settings
		 * @type Object
		 * @private
		 **/
		settings : {
			increment       :   100,
			duration        :   1000,
			autostart       :   false,
			// callbacks
			onComplete      :   false,
			onIncrement     :   false,
			onStart         :   false,
			onStop          :   false,
			onReset         :   false,
		},

		/**
		 * Starts a timeout that lasts for the plugin's increment value.
		 *
		 * @method time
		 * @param {Object} The settings the plugin was initialized with
		 * @private
		 **/
		time : function ( settings ) {
			// set timeout
			if ( settings.timeout !== false ) {
				var el = this;
				settings.timeout = setTimeout( function() {
					filters._private.call(el, 'count');
				}, settings.increment);
			}
		},

		/**
		 * Counts the increments until the plugin's duration is reached.
		 *
		 * @method count
		 * @param {Object} The settings the plugin was initialized with
		 * @private
		 **/
		count : function ( settings ) {
			// increase count
			settings.count += settings.increment;
			// on increment event
			if ( settings.onIncrement ) {
				settings.onIncrement.call(this, settings);
			}
			// check complete
			if ( settings.count >= settings.duration ) {
				filters._private.call(this, 'complete');
			}else {
				// timeout
				filters._private.call(this, 'time');
			}
		},

		/**
		 * Concludes the timer and calls the onComplete method.
		 *
		 * @method complete
		 * @param {Object} The settings the plugin was initialized with
		 * @private
		 **/
		complete : function ( settings ) {
			// stop timer
			filters.stop.call($(this));
			// on complete event
			if( settings.onComplete ) {
				settings.onComplete.call(this, settings);
			}
		},

	},

	/**
	 * Filters applied before method calls.
	 */
	filters = {

		/**
		 * A filter applied before all private methods are called. Private
		 * methods are only called on a single jQuery object.
		 *
		 * @method filters.get
		 * @param {Object} method The get method
		 * @return {Mixed} The get method if it exists, otherwise false.
		 **/
		_private : function( method ) {
			// get settings
			var settings = $(this).data('SimpleTimer.settings');
			if ( typeof settings == 'undefined' ) {
				return false;
			}
			// call private method
			if ( _private[method] ) {
				return _private[method].call( this, settings );
			}else {
				return false;
			}
		},

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
				if ( $(this).data('SimpleTimer.settings') === undefined ) {
					$.error('Simple Timer Error: method "' + method + '" was ' +
						'called on an element which has not been initialized.');

					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if ( filtered.length > 0 ) {
				// call method
				if ( filters[method] ) {
					// filtered method
					filters[method].apply( filtered,
						Array.prototype.slice.call(arguments, 1) );
				}else {
					// unfiltered method
					methods[method].apply( filtered,
						Array.prototype.slice.call(arguments, 1) );
				}
			}

			// return the jQuery object to keep the method chainable
			return this;
		},

		/**
		 * A filter applied before the start method is called. The filter
		 * checks to see if any of the elements' timers are already timing.
		 *
		 * @method filters.start
		 * @chainable
		 **/
		start : function() {
			var filtered = this.filter(function() {
				var settings = $(this).data('SimpleTimer.settings');
				// checks if the duration is set to 0 or less
				if ( settings.duration <=0 ) {
					// jump to the end
					filters._private.call(this, 'complete');
				}
				// checks if the timer has already been started
				if ( settings.timeout !== false ) {
					return false;
				}
				// checks if the timer has already run its duration
				if ( settings.count >= settings.duration ) {
					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if ( filtered.length === 0 ) {
				return false;
			}

			// call start
			methods.start.apply(filtered, arguments);
		},

		/**
		 * A filter applied before the stop method is called. The filter
		 * checks to see if any of the elements' timers are already timing.
		 *
		 * @method filters.stop
		 * @return {Boolean} Returns true if some of the selected jQuery objects
		 * passed the filter, false if none of the objects passed
		 * @chainable
		 **/
		stop : function() {
			var filtered = this.filter(function() {
				var settings = $(this).data('SimpleTimer.settings');
				// checks if the timer has already been stopped
				if ( settings.timeout === false ) {
					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if ( filtered.length === 0 ) {
				return false;
			}else {
				// call stop
				methods.stop.apply(filtered, arguments);
				return true;
			}
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
			return $.extend({}, _private.settings);
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
	 * $(selector).simpleSlides(methodName).
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

			/*
			* Create some defaults. Extend them with any options that were
			* provided.
			*/
			var settings = $.extend( true, {}, _private.settings, options,
			// private settings
			{
				timeout         :   false,
				count           :   0,
			});

			return this.each(function(){
				// save data
				$(this).data('SimpleTimer.settings', settings);
				// autostart the timer
				if ( settings.autostart ) {
					methods.start.call($(this));
				}
			});
		},

		/**
		 * Starts the timer.
		 *
		 * @method methods.start
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		start : function() {
			// apply to each element
			return this.each( function() {
				// retrieve settings
				var settings = $(this).data('SimpleTimer.settings');
				// start timing boolean
				settings.timeout = true;
				// on start event
				if ( settings.onStart ) {
					settings.onStart.call(this, settings);
				}
				// start timing
				filters._private.call(this, 'time');
			});
		},

		/**
		 * Stops the timer.
		 *
		 * @method methods.stop
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		stop : function() {
			// apply to each element
			return this.each( function() {
				// retrieve settings
				var settings = $(this).data('SimpleTimer.settings');
				// clear timeout
				clearTimeout(settings.timeout);
				// boolean indicates the timer is not timing
				settings.timeout = false;
				// on stop event
				if ( settings.onStop ) {
					settings.onStop.call(this, settings);
				}
			});
		},

		/**
		 * Resets the timer. The timer's count is reset to 0.
		 *
		 * @method methods.reset
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		reset : function() {
			// apply to each element
			return this.each( function() {
				// retrieve settings
				var settings = $(this).data('SimpleTimer.settings');
				// stop the timer
				filters.stop.call($(this));
				// reset the count
				settings.count = 0;
				// on reset event
				if ( settings.onReset ) {
					settings.onReset.call(this, settings);
				}
			});
		},

		/**
		 * Updates the options for the plugin and saves the data.
		 *
		 * @method methods.update
		 * @param {Object} options The options that will be used to override the
		 * current settings
		 * @return {Object} The jQuery object(s) from which the method was called
		 * @chainable
		 **/
		update : function( options ) {
			// apply to each element
			return this.each( function() {
				// retrieve settings
				var settings = $(this).data('SimpleTimer.settings');
				// update the settings with the new options
				settings = $.extend(true, settings, options);
				// save data
				$(this).data('SimpleTimer.settings', settings);
			});
		},

		/**
		 * Destroys the timer by deleting the settings attached to the DOM
		 * element.
		 *
		 * @method methods.destroy
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		destroy : function() {
			// apply to each element
			return this.each( function() {
				// reset plugin
				methods.reset.call($(this));
				// remove previously stored data
				$(this).removeData('SimpleTimer.settings');
			});
		},

	};

	// jQuery selected

	$.fn.simpleTimer = function( method ) {
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
				$.error('Simple Timer Error: method ' +  method +
					' does not exist.');
			}
		} else if ( typeof method === 'object' || ! method ) {
			// initialize the plugin
			return methods.init.apply( this, arguments );
		}
		// general exception
		$.error('Simple Timer Error: the simple timer plugin expects at' +
			'least 1 paramater. The first paramater must be of type "string" ' +
			'or "object"');
	};

	// jQuery object (get functions only)

	$.simpleTimer = function( method ) {
		if ( typeof method === 'string' &&
			 method.substr(0, 3) === 'get') {
			method = method.substr(3, 1).toLowerCase() +
				method.substr(4);
			// getter functions (not chainable)
			return filters.get.apply( [], arguments );
		}
		// general exception
		$.error('Simple Timer Error: direct calls to simpleTimer only works ' +
			'with get functions');
	};

})(jQuery);
