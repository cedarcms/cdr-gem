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
 *
 * different cedar types may use different api paths, therefore the paths
 * are passed into some functions
 */
Cedar.Store = function() {
  this.loaded = false;
  console.log("loaded: " + this.loaded);
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

Cedar.Store.prototype.put = function ( key, item ) {
  localStorage[key] = JSON.stringify(item);
}
/**
 * get a single item based on id (key)
 * if the item isn't in the local store, then get it from the server
 *
 * @param Cedar 'object'
 * @param string 'key'
 */
Cedar.Store.prototype.get = function ( object, key ) {
  if ( object.apiGet() === null ) {
    throw 'Cedar Error: must provide api "get" path';
  }
  if (typeof localStorage[key] !== "undefined") {
    console.log('getting from cache');
    return $.Deferred().resolve(localStorage[key]);
  } else {
    console.log('getting from server...');
    return $.getJSON(Cedar.config.api + object.apiGet() + key, function(json) {
      console.log('got from server');
      Cedar.store.put(key, json);
    });
  }
}

/**
 * query the api and fill the local store with the results
 *
 * @param string 'path'
 * @param string 'param'
 * @param string 'value'
 *
 */
Cedar.Store.prototype.query = function ( path, param, value ) {
  $.getJSON(Cedar.config.api + path + '?' + param + '=' + value ).done( function(json) {
    $.each(json, function (key, val){
      if ( typeof val.id !== 'undefined' && typeof val.settings.content !== 'undefined') {
        Cedar.store.put(val.id, val);
      }
    });
  });
}

/**
 * get all objects and store locally
 * TODO: (currently hardcoded to content entries - should be avail to any type in future)
 */
Cedar.Store.prototype.getAll = function () {
  console.log("loaded: " + Cedar.store.loaded);
  return $.when(Cedar.store.checkData()).then( function() {

    console.log("loaded: " + Cedar.store.loaded);
    if (Cedar.store.loaded) {

      console.log("already loaded all items");
      return $.Deferred().resolve({});

    } else {

      console.log("loading all items from server...");
      return $.getJSON(Cedar.config.api + "/queries/contententries/" ).done( function(json) {
        console.log("Got new stuff from the server");
        $.each(json, function (key, val) {
          Cedar.store.put(val.id, val);
          console.log("storing: " + val.id + " / " + val);
        });
        Cedar.store.loaded = true;
      });

    }

  });
}

/**
 * remove a single locally store item by key
 *
 * @param ID key
 */
Cedar.Store.prototype.clear = function(key) {
  localStorage.removeItem(key);
}

Cedar.Store.prototype.setVersion = function(id) {
  console.log("updating to version #" + id);
  localStorage["___CEDAR__DATA__FINGERPRINT___"] = id;
}
Cedar.Store.prototype.getVersion = function() {
  return localStorage["___CEDAR__DATA__FINGERPRINT___"];
}
/**
 * Query the server for the latest version number (ie data freshness)
 */
Cedar.Store.prototype.checkData = function() {
  console.log("checking version #" + Cedar.store.getVersion());
  return $.getJSON(Cedar.config.api + '/queries/status').done( function(json) {

    if ( Cedar.store.getVersion() != json.settings.version ) {
      console.log("setting version");
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
}

Cedar.ContentEntry.query = function(thing) {
  Cedar.store.query( "/queries/contententries/", "guidfilter", thing );
}

Cedar.ContentEntry.prototype.apiGet = function() {
  return "/objects/contententries/";
};

Cedar.ContentEntry.prototype.apiQuery = function() {
  return "/queries/contententries/";
};

Cedar.ContentEntry.prototype.apiFilter = function() {
  return "guidfilter";
};

Cedar.ContentEntry.prototype.apiList = function() {
  return "guidlist";
};


// parse the json for the relevant content
Cedar.ContentEntry.prototype.setContent = function(json) {
  if (typeof json === "undefined") return;
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
    return this.getEditOpen() + this.content + this.getEditClose();
  }
  else {
    return this.content;
  }
}

Cedar.ContentEntry.prototype.toJSON = function(){
  return {
    content: this.content
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
  return Cedar.store.get(this, this.cedarId).then(function(response) {
    if (typeof response === "string") {
      response = JSON.parse(response);
    }
    this.setContent(response);
    return this;
  }.bind(this));
}

// query filtered on object name matches
//Cedar.ContentEntry.prototype.query = function(filter) {
//  return Cedar.store.query(filter, this);
//}

// fill the asssociated element with the retrieved content
Cedar.ContentEntry.prototype.render = function() {
  this.retrieve().done(function() {
    this.fill();
  }.bind(this));
}

// styling for edit box
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

Cedar.Init();
