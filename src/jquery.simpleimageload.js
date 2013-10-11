/**
* @name             Simple Image Load
* @descripton       Determines when an image element has loaded and executes a
*                   callback function on complete.
*
* @version          0.1.4
* @requires         jQuery 1.6+
*                   https://github.com/YodaPop/jquery-simple-timer
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
		 * An object containing the public properties used for the plugin's default
		 * settings.
		 *
		 * @property settings
		 * @type Object
		 * @private
		 **/
		settings : {
			increment       :   200,
			duration        :   10000,
			selfdestruct    :   true,
			onLoad          :   false,
			onError         :   false,
		},

		/**
		 * Checks the image.complete property to see if the image had been loaded.
		 *
		 * @method check
		 * @private
		 **/
		check : function() {
			// is the image completely loaded
			if ( get.loaded.call($(this)) ) {
				// call complete
				filters._private.call(this, 'load');
			}
		},

		/**
		 * The load method executed upon completion of the simple timer. The onLoad
		 * event fires. The image load plugin is automatically destroyed.
		 *
		 * @method load
		 * @private
		 **/
		load : function( settings ) {
			// onLoad event
			if ( settings.onLoad ) {
				settings.onLoad.call(this);
			}
			// destroy image load
			if ( settings.selfdestruct ) {
				methods.destroy.call($(this));
			}
		},

		/**
		 * The error method is executed in the event of an image error executed by
		 * the browser or if the image did not load within the specified duration.
		 * automatically destroyed.
		 *
		 * @method error
		 * @private
		 **/
		error : function() {
			// onError event
			if ( settings.onError ) {
				settings.onError.apply(this);
			}
			// destroy image load
			if ( settings.selfdestruct ) {
				methods.destroy.call($(this));
			}
		},

	},

	/**
	 * Helper functions used privately by the plugin for common, simple tasks
	 */
	helpers = {

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

	},

	// public

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
			var settings = $(this).data('SimpleImageLoad.settings');
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
		 * A filter applied before the plugin is initialized. The filter checks
		 * to see that the selected element is an image.
		 *
		 * @method filters.init
		 * @param {Object} settings The settings for the plugin
		 * @return {Object} The jQuery object from which the method was called
		 * @chainable
		 **/
		init : function( options ) {
			// filter out the uninitialized
			var filtered = this.filter(function() {
				if ( !$(this).is('img') ) {
					$.error('Simple Image Load Error: the selected element ' +
						'must be an image.');

					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if( filtered.length > 0 ) {
				// call method
				methods.init.call( filtered, options );
			}

			// return the jQuery object to keep the method chainable
			return this;
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
				if( $(this).data('SimpleImageLoad.settings') === undefined ) {
					$.error('Simple Image Load Error: method "' + method +
						'" was called on an element which has not been ' +
						'initialized.');

					return false;
				}

				return true;
			});

			// check filtered before proceeding
			if( filtered.length > 0 ) {
				// call method
				methods[method].apply( filtered,
					Array.prototype.slice.call( arguments, 1 ) );
			}

			// return the jQuery object to keep the method chainable
			return this;
		},

	},

	/**
	 * Getter functions called using
	 * $(selector).simpleImageLoad('get' + methodName). WARNING: These methods
	 * are not chainable.
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
		 * Checks the image.complete property to see if the image has been
		 * loaded on the selected elements.
		 *
		 * @method get.loaded
		 * @return {Mixed} Returns a single boolean if one element was selected,
		 * otherwise it returns an array of booleans.
		 **/
		loaded : function() {
			// the array of percentages
			var arr = [];
			// loop through the elements
			$(this).each(function() {
				if ( $(this).get(0).complete ) {
					arr.push(true);
				}else {
					arr.push(false);
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
	 * $("selector").simpleImageLoad("methodName").
	 */
	methods = {

		/**
		 * The initialization method. Used to set the properties of the loader
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
			// simple image load settings
			var settings = $.extend( true, {}, _private.settings, options);
			// simple timer settings
			var settingsTimer = helpers.extendOver(
				$.simpleTimer('getDefaultSettings'),
				settings);
			// private timer settings
			$.extend(settingsTimer, {
				onIncrement :   _private.check,
				onComplete  :   _private.load,
			});

			return this.each(function(){
				// save data
				$(this).data('SimpleImageLoad.settings', settings)
				// check periodically via the image.complete property
				.simpleTimer(settingsTimer).simpleTimer('start');
				// check via the onLoad event
				this.onload = _private.check;
				// check for an image error
				this.onerror = _private.error;
			});
		},

		/**
		 * Destroys the loader by deleting the settings attached to the DOM
		 * element.
		 *
		 * @method methods.destroy
		 * @return {Object} The jQuery object's from which the method was called
		 * @chainable
		 **/
		destroy : function() {
			// apply to each element
			return this.each( function() {
				// destroy the timer
				$(this).simpleTimer('destroy');
				// clear javascript events
				this.onload = null;
				this.onerror = null;
				// remove previously stored data
				$(this).removeData('SimpleImageLoad.settings');
			});
		},

	};

	// jQuery plugin

	$.fn.simpleImageLoad = function( method ) {
		if ( typeof method === 'string' ) {
			if ( method.substr(0, 3) === 'get' ) {
				method = method.substr(3, 1).toLowerCase() +
					method.substr(4);
				if ( get[method] ) {
					// getter functions (not chainable)
					return get[method].call(this);
				}else {
					$.error('Simple Image Load Error: getter function ' +
						method + ' does not exist.');
				}
			} else if ( methods[method] ) {
				// filtered methods
				return filters.methods.apply( this, arguments );
			} else {
				$.error('Simple Image Load Error: method ' +  method +
					' does not exist.');
			}
		} else if ( typeof method === 'object' || ! method ) {
			// initialize the plugin
			return filters.init.apply( this, arguments );
		}
		// general exception
		$.error('Simple Image Load Error: the simple image load plugin ' +
			'expects at least 1 paramater passed for inititialization or ' +
			'method calls. The first paramater must be of type "string" or ' +
			'"object"');
	};

	// jQuery object (get functions only)

	$.simpleImageLoad = function( method ) {
		if ( typeof method === 'string' &&
			 method.substr(0, 3) === 'get') {
			method = method.substr(3, 1).toLowerCase() +
				method.substr(4);
			if ( get[method] ) {
				// getter functions (not chainable)
				return get[method].call([]);
			}else {
				$.error('Simple Image Load Error: getter function "' +  method +
					'" does not exist.');
			}
		}
		// general exception
		$.error('Simple Image Load Error: direct calls to simpleTimer only ' +
			'works with get functions');
	};

})(jQuery);
