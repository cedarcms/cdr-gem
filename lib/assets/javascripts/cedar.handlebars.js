Handlebars.registerHelper('cedar', function(options) {
  "use strict";

  var hashCode = function(string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (var i = 0; i < string.length; i++) {
      var character = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  var unescapeHtml = function(string) {
    var MAP = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'"
    };

    return string.replace(/&#?\w+;/g, function(c) {
      return MAP[c];
    });
  };

  var blockHelperStyle = function() {
    if (typeof options.fn === "function") {
      return true;
    } else {
      return false;
    }
  }

  var tagName = options.hash.tagName || "span";
  if (blockHelperStyle()) {
    tagName = options.hash.tagName || "div";
  }

  options.el = document.createElement(tagName);
  options.el.id = "cedar-js-" + hashCode(options.hash.id);

  new Cedar.ContentEntry({ cedarId: options.hash.id }).retrieve().then(function(contentEntry){

    var domEl = document.getElementById(options.el.id);
    if (domEl === null) {
      domEl = options.el;
    }

    if (blockHelperStyle()) {
      var output = '';
      if (Cedar.auth.isEditMode()) {
        output += contentEntry.getEditOpen();
      }
      output += unescapeHtml(options.fn(contentEntry.toJSON()));
      if (Cedar.auth.isEditMode()) {
        output += contentEntry.getEditClose();
      }
      domEl.innerHTML = output;
    } else {
      domEl.innerHTML = contentEntry.getContent();
    }
  });

  return new Handlebars.SafeString(options.el.outerHTML);
});
