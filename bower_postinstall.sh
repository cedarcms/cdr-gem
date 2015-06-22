#!/bin/sh

mv -f bower_components/cedar/js/cedar.js lib/assets/javascripts/cedar_source.js

mv -f bower_components/cedar/js/cedar_handlebars.js lib/assets/javascripts/cedar_handlebars.js

mv -f bower_components/cedar/css/cedar.css lib/assets/stylesheets/cedar_source.scss

mv -f bower_components/cedar/img/* lib/assets/images

rm -R bower_components
