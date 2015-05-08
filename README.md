# Cedar

Installs javascript assets for Cedar integration

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'cedar'
```

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install cedar

## Usage

To retrieve all available content and save it to `localStorage`, use the following function (returns a promise)

```javascript
Cedar.store.fetch();
```


### Handlebars

To add Cedar-managed content to your Handlebars templates, use the following helper:

```handlebars
{{ cedar type="contentEntry" id="Today's Activities : Activities : Intro" }}
```

Set the `id` to a unique string that is used to identify this piece of content. The `type` attribute is optional and defaults to `contentEntry`.

You can also use the block-helper style which allows you to define a template that the `JSON` content returned from Cedar will bind to.

```handlebars
{{#cedar type="contentEntry" id="Today's Activities : Activities : Empty Message" }}
  <div class="notice">{{content}}</div>
{{/cedar}}
```

## Ply Dev Notes

### Updating Project Assets

The authoritative source of the majority of the assets in this gem is the `cedar` Bower package. To update this gem with the latest version, you will need bower installed and then run the following command from the root of this project:

`bower install`

### Publishing Gem

add yourself as a user at:

https://rubygems.org/gems/cedar

then do the following to save your stuff:

```
curl -u your_rubygems_username https://rubygems.org/api/v1/api_key.yaml >
~/.gem/credentials; chmod 0600 ~/.gem/credentials
```

someone who already is a project owner then will add you:

```
gem owner cedar -a foo@example.com
```

once you've updated the code, do the following 3 steps to publish:


1) increment `version.rb` and `Gemspec` in target

2) `rake build`

3) `gem push pkg/cedar-x.x.x.gem`



misc:


to create a new gem:
```
gem build cedar.gemspec
```

to see what's been published:
```
gem list -r --pre cedar
```
to install outside of a project:
```
gem install --pre cedar
```
