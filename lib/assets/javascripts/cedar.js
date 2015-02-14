/**
 * Global object for settings and storage
 */
var Cedar = {
  initialized: false,
  store: null,
  auth: null,
  config: {
    api: 'http://jed.cdr.core.plyinc.dev/api',
    server: 'http://jed.cdr.core.plyinc.dev'
  }
};


/**
* Cedar.Init
*
* take care of global initializations
*/
Cedar.Init = function() {
  if ( Cedar.initialized ) {
    return;
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
        // '<a href="#" onclick="window.location.reload(true);return false;">[refresh]</a>' +
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
 * Cedar.Auth
 *
 * responsible for determining if we're authorized for edit mode
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
 */
Cedar.Store = function() {
  this._cache = {};
}

Cedar.Store.prototype.put = function ( key, item ) {
  this._cache[key] = item;
}

// different cedar types may use different api paths
Cedar.Store.prototype.find = function ( key, getPath ) {
  if ( getPath === null )
    console.log('Cedar Error: must provide api "get" path');

  if (typeof this._cache[key] === 'undefined'){
    return $.getJSON(Cedar.config.api + getPath + key, function(json) {
      this.put(key, json);
      console.log('retrieved from server');
    }.bind(this));
  }
  else {
    console.log('retrieved from cache');
    return $.Deferred().resolve(this._cache[key]);
  }
  return false;
}

Cedar.Store.prototype.clear = function(key) {
  delete this._cache[key];
}


/**
 * Cedar.ContentEntry
 *
 * basic content block class
 *
 *
 *
 * options:
 *
 * {
 *  el (element or jQuery selector)
 * }
 */
Cedar.ContentEntry = function(options) {
  Cedar.Init();

  var defaults = {
    el: 'div'
  };

  this.options = $.extend( {}, defaults, options );

  this.cedarId = this.options.cedarId;
  this.el = this.options.el;
  this.$el = $(this.el);
  this.apiGet = '/objects/contententries/';
}

// parse the json for the relevant content
Cedar.ContentEntry.prototype.setContent = function(json) {
  if (json.code == "UNKNOWN_ID"){
    this.content = '&nbsp;'; // if an element is new, fill with blank space to allow edit box to display
  }
  else if (typeof json.settings.content !== 'undefined') {
    this.content = json.settings.content;
  }
  else {
    this.content = '';
    console.log('Cedar Error: Unable to parse json');
  }
}

// takes into account edit mode styling
Cedar.ContentEntry.prototype.getContent = function(){
  if (Cedar.auth.isEditMode()) {
    return this.getEditOpen(this.cedarId) + this.content + this.getEditClose();
  }
  else {
    return this.content;
  }
}

Cedar.ContentEntry.prototype.toJSON = function(){
  return {
    content: this.getContent()
  }
};

// element is optional parameter
Cedar.ContentEntry.prototype.fill = function(element) {
  if (typeof element !== 'undefined') {
    $(element).html(this.getContent());
  }
  else if (typeof this.$el !== 'undefined') {
    this.$el.html(this.getContent());
  }
}

// check store for content
Cedar.ContentEntry.prototype.retrieve = function() {
  return Cedar.store.find(this.cedarId, this.apiGet ).then(function(response) {
    this.setContent(response);
    return this;
  }.bind(this));
}

// fill the asssociated element with the retrieved content
Cedar.ContentEntry.prototype.render = function() {
  this.retrieve().done(function() {
    this.fill();
  }.bind(this));
}

// styling for edit box
Cedar.ContentEntry.prototype.getEditOpen = function(id) {
  var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
  "event.cancelBubble=true;" +
  "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
  "return false;";

  var block = '<span class="cedar-cms-editable clearfix">';
  block += '<span class="cedar-cms-edit-tools">';
  block += '<a onclick="' + jsString + '" href="' + Cedar.config.server +
           '/cmsadmin/EditData?cdr=1&t=ContentEntry&o=' + encodeURIComponent(id) +
           '" class="cedar-cms-edit-icon cedar-js-edit" >';
  block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-edit"></i></a>';
  block += '</span>';
  return block;
}
Cedar.ContentEntry.prototype.getEditClose = function(){
  return '</span>';
}
