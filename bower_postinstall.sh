#!/bin/sh

mv -f bower_components/cedar/js/* lib/assets/javascripts

mv -f bower_components/cedar/css/cedar.css lib/assets/stylesheets/cedar_source.css

mv -f bower_components/cedar/img/* lib/assets/images

rm -R bower_components
