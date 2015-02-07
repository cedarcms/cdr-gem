# cdr-gem

https://rubygems.org/gems/cedar

curl -u your_rubygems_username https://rubygems.org/api/v1/api_key.yaml >
~/.gem/credentials; chmod 0600 ~/.gem/credentials

gem push cedar-0.0.1.pre.gem

gem list -r --pre cedar

gem install --pre cedar
