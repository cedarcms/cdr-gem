/**
 * Global object for settings and storage
 */
var Cedar = {
  initialized: false,
  store: null,
  auth: null,
  config: {
    api: '',
    server: '',
    debug: false
  }
};


/**
* Cedar.Init
*
* take care of global initializations
*
* @param <Array> options
*   - server : 'test.cdr.plyinc.com' - *required
*   - debug : true | false
*/
Cedar.Init = function(options) {
  if ( Cedar.initialized ) {
    return;
  }

  if ( typeof options.server === 'undefined' ) {
    throw 'Cedar Error: must provide "server" value on Init()';
  }

  Cedar.config.server = 'http://' + options.server;
  Cedar.config.api = 'http://' + options.server + '/api';

  if ( typeof options.debug !== 'undefined' && options.debug ) {
    Cedar.config.debug = true;
  }

  if ( Cedar.store === null ) {
    Cedar.store = new Cedar.Store();
  }

  if ( Cedar.auth === null ) {
    Cedar.auth = new Cedar.Auth();
  }

  if (Cedar.auth.isEditMode()) {
    $(document).ready(function() {
      var $body = $('body');
      var globalActions = '<div class="cedar-cms-global-actions">' +
        '<a href="#" class="cedar-cms-global-action" onclick="window.location.reload();">' +
        '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
        '<span class="cedar-cms-global-action-label">Refresh</span>' +
        '</a><br>' +
        '<a class="cedar-cms-global-action" href="' + Cedar.auth.getLogOffURL() + '">' +
        '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
        '<span class="cedar-cms-global-action-label">Log Off Cedar</span>' +
        '</a>' +
        '</div>';
      $body.append(globalActions);
    });
  }

  Cedar.initialized = true;
}
/**
 * display message to console if Cedar.debug = true
 *
 * @param <string> message
 */
Cedar.debug = function(msg) {
  if (Cedar.config.debug) {
    console.log(msg);
  }
}


/**
 * Cedar.Auth
 *
 * responsible for determining if we're in edit mode
 */
Cedar.Auth = function() {
}
Cedar.Auth.prototype.isEditMode = function() {
  return this.isEditUrl();
}
Cedar.Auth.prototype.isEditUrl = function() {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    if (sURLVariables[i] == 'cdrlogin') {
      return true;
    }
  }
  return false;
}
Cedar.Auth.prototype.getLogOffURL = function() {
  return this.removeURLParameter(window.location.href, 'cdrlogin');
}
// adapted from stackoverflow: http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
Cedar.Auth.prototype.removeURLParameter = function(url, parameter) {
  var splitUrl = url.split('#');
  var serverUrl = splitUrl[0];
  var clientUrl = splitUrl[1];
  //prefer to use l.search if you have a location/link object
  var splitServerUrl= serverUrl.split('?');
  if (splitServerUrl.length>=2) {

    var prefix = encodeURIComponent(parameter); //+'=';
    var pars = splitServerUrl[1].split(/[&;]/g);

    //reverse iteration as may be destructive
    for (var i= pars.length; i-- > 0;) {
      //idiom for string.startsWith
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
        pars.splice(i, 1);
      }
    }

    var updatedServerUrl= splitServerUrl[0];
    if (pars.length > 0) {
      updatedServerUrl += '?'+pars.join('&');
    }
    return updatedServerUrl + "#" + clientUrl;
  } else {
    return url;
  }
}


/**
 * Cedar.Store
 *
 * responsible for retrieving Cedar elements from server or local cache.
 *
 * different cedar types may use different api paths, therefore the paths
 * are passed into some functions
 */
Cedar.Store = function() {
  this.loaded = false;

  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
/**
 * store a single json item by key
 *
 * @param <string> 'key'
 * @param <json> 'item'
 */
Cedar.Store.prototype.put = function ( key, item ) {
  localStorage[key] = JSON.stringify(item);
}
/**
 * get a single item based on id (key)
 * if the item isn't in the local store, then get it from the server
 *
 * @param <Cedar> 'object'
 * @param <string> 'key'
 */
Cedar.Store.prototype.get = function ( object, key ) {
  if ( object.apiGet() === null ) {
    throw 'Cedar Error: must provide api "get" path';
  }
  if (typeof localStorage[key] !== "undefined") {
    Cedar.debug('get from cache: ' + key);
    return $.Deferred().resolve(localStorage[key]);
  } else {
    Cedar.debug('checking server...');
    return $.getJSON(Cedar.config.api + object.apiGet() + key, function(json) {
      Cedar.debug('get from server: ' + key);
      Cedar.store.put(key, json);
    });
  }
}
/**
 * fetch records from the server if necessary
 *
 * @param options <Array>
 *  - filter:<string> return only objects which match object IDs containing the string
 *  - path:<string> provide an api path other than the default (content entry query)
 *  - clear:<bool> clear local storage first
 */
Cedar.Store.prototype.fetch = function ( options ) {
  var apiPath = '/queries/contententries/';
  var queryParams = {};

  if ( typeof options !== 'undefined' && typeof options.path !== 'undefined' ) {
    apiPath = options.path;
  }
  if ( typeof options !== 'undefined' && typeof options.filter !== 'undefined' ) {
    queryParams['guidfilter'] = options.filter;
  }
  if ( typeof options !== 'undefined' && typeof options.clear !== 'undefined' && options.clear) {
    this.clear();
  }

  return $.when(Cedar.store.checkData()).then( function() {

    if (Cedar.store.loaded) {

      Cedar.debug("loaded: " + Cedar.store.loaded);
      return $.Deferred().resolve({});

    } else {

      Cedar.debug("loaded: " + Cedar.store.loaded);
      return $.getJSON(Cedar.config.api + apiPath, queryParams ).done( function(json) {
        $.each(json, function (key, val) {
          if ( typeof val.id !== 'undefined' && typeof val.settings.content !== 'undefined') {
            Cedar.store.put(val.id, val);
            Cedar.debug("storing: " + val.id);
          }
        });
        Cedar.store.loaded = true;
      });
    }

  });
}
/**
 * clear the local storage or remove a single locally store item by key
 *
 * @param {ID} key
 */
Cedar.Store.prototype.clear = function( key ) {
  if ( typeof key === 'undefined' ) {
    localStorage.clear();
  }
  else {
    localStorage.removeItem(key);
  }
}
/**
 * set the locally stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.setVersion = function(id) {
  Cedar.debug("updating to version #" + id);
  localStorage["___CEDAR__DATA__FINGERPRINT___"] = id;
}
/**
 * return the currently stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.getVersion = function() {
  return localStorage["___CEDAR__DATA__FINGERPRINT___"];
}
/**
 * Query the server for the latest data version number
 *
 * @return <Deferred>
 */
Cedar.Store.prototype.checkData = function() {
  Cedar.debug("checking version #" + Cedar.store.getVersion());
  return $.getJSON(Cedar.config.api + '/queries/status').done( function(json) {

    if ( Cedar.store.getVersion() != json.settings.version ) {
      Cedar.debug('setting version: ' + json.settings.version);
      Cedar.store.loaded = false;
      Cedar.store.setVersion(json.settings.version);
    }
    else {
      Cedar.store.loaded = true;
    }
  });
}

/**
 * Cedar.ContentEntry
 *
 * basic content block class
 *
 * options:
 *
 * {
 *  el (element or jQuery selector)
 * }
 */
Cedar.ContentEntry = function(options) {
  var defaults = {
    el: 'div'
  };

  this.options = $.extend( {}, defaults, options );

  this.cedarId = this.options.cedarId;
  this.el = this.options.el;
  this.$el = $(this.el);
}

Cedar.ContentEntry.prototype.apiGet = function() {
  return '/objects/contententries/';
};

Cedar.ContentEntry.prototype.apiQuery = function() {
  return '/queries/contententries/';
};

Cedar.ContentEntry.prototype.apiFilter = function() {
  return 'guidfilter';
};

Cedar.ContentEntry.prototype.apiList = function() {
  return 'guidlist';
};

/**
 * parse the json for content and set this object's content
 *
 * @param <json>
 */
Cedar.ContentEntry.prototype.setContent = function(json) {
  if (typeof json === 'undefined') return;
  if (json.code == 'UNKNOWN_ID'){
    this.content = '&nbsp;'; // if an element is new, fill with blank space to allow edit box to display
  }
  else if (typeof json.settings.content !== 'undefined') {
    this.content = json.settings.content;
  }
  else {
    this.content = '';
    Cedar.debug('Cedar Error: Unable to parse json');
  }
}
/**
 * return the object's content - takes into account edit mode styling
 *
 * @return <HTML>
 */
Cedar.ContentEntry.prototype.getContent = function(){
  if (Cedar.auth.isEditMode()) {
    return this.getEditOpen() + this.content + this.getEditClose();
  }
  else {
    return this.content;
  }
}
/**
 * is this a content entry json structure?
 *
 * @param <json>
 * @return <bool>
 */
Cedar.ContentEntry.prototype.isContentEntry = function (json) {
  if (typeof json === 'undefined') {
    return false;
  }
  if (typeof json.settings === 'undefined' && typeof json.settings.content === 'undefined') {
    return false;
  }

  return true;
}
/**
 * @return <json>
 */
Cedar.ContentEntry.prototype.toJSON = function(){
  return {
    content: this.content
  }
};
/**
 * fill self or provided element with content
 *
 * @param <element> optional
 */
Cedar.ContentEntry.prototype.fill = function(element) {
  if (typeof element !== 'undefined') {
    $(element).html(this.getContent());
  }
  else if (typeof this.$el !== 'undefined') {
    this.$el.html(this.getContent());
  }
}
/**
 * check store for this object's content
 */
Cedar.ContentEntry.prototype.retrieve = function() {
  return Cedar.store.get(this, this.cedarId).then(function(response) {
    if (typeof response === 'string') {
      response = JSON.parse(response);
    }
    this.setContent(response);
    return this;
  }.bind(this));
}
/**
 * retrive and fill the associated element
 */
Cedar.ContentEntry.prototype.render = function() {
  this.retrieve().done(function() {
    this.fill();
  }.bind(this));
}
/**
 * provides styling for edit box
 */
Cedar.ContentEntry.prototype.getEditOpen = function() {
  var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
  "event.cancelBubble=true;" +
  "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
  "return false;";

  var block = '<span class="cedar-cms-editable clearfix">';
  block += '<span class="cedar-cms-edit-tools">';
  block += '<a onclick="' + jsString + '" href="' + Cedar.config.server +
           '/cmsadmin/EditData?cdr=1&t=ContentEntry&o=' + encodeURIComponent(this.cedarId) +
           '" class="cedar-cms-edit-icon cedar-js-edit" >';
  block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-edit"></i></a>';
  block += '</span>';
  return block;
}
Cedar.ContentEntry.prototype.getEditClose = function(){
  return '</span>';
}
