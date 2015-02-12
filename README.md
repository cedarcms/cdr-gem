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



## Ply Dev Notes


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
