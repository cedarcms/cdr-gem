// Marionette
var CedarMarionetteHeader = Backbone.Marionette.ItemView.extend({
  template : function(serialized_model) {
    return _.template('<h1><%= content %></h1>')(serialized_model);
  }
});
var CedarMarionetteParagraph = Backbone.Marionette.ItemView.extend({
  template : function(serialized_model) {
    return _.template('<p><%= content %></p>')(serialized_model);
  }
});

var CedarMarionetteLayout = Backbone.Marionette.LayoutView.extend({
  template: '#layout-view-template',

  regions: {
    cedarHeading: '.js-cedar-heading',
    anotherParagraph: '.js-cedar-paragraph'
  },

  onRender: function() {
    this.cedarHeading.show(new CedarMarionetteHeader({model: this.options.heading}))
    this.anotherParagraph.show(new CedarMarionetteParagraph({model: this.options.introText}))
  }
});
