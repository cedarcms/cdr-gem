# Usage example: initializers/cedar.rb
# Cedar.configure do |config|
#   config.live_mode = (Rails.env.production? || Rails.env.staging? || Rails.env.development?)
# end

module Cedar
  class Config
    attr_accessor :server, :debug, :wait, :fetch, :force_https, :object_name_filter, :live_mode

    def initialize
      @server = ''
      @debug = false
      @wait = false
      @fetch = true
      @force_https = false
      @object_name_filter = ''
      @live_mode = true
    end
  end
end
