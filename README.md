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


## Contributing

1. Fork it ( https://github.com/[my-github-username]/cedar/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request


## 

dev notes:
increment version.rb and Gemspec in target
rake build
gem push pkg/cedar-x.x.x.gem


misc:

https://rubygems.org/gems/cedar

curl -u your_rubygems_username https://rubygems.org/api/v1/api_key.yaml >
~/.gem/credentials; chmod 0600 ~/.gem/credentials

gem build cedar.gemspec

gem push cedar-0.0.x.pre.gem

gem list -r --pre cedar

gem install --pre cedar

add owner:
gem owner cedar -a foo@example.com
