# Usage example: initializers/cedar.rb
# Cedar.configure do |config|
#   config.live_mode = (Rails.env.production? || Rails.env.staging? || Rails.env.development?)
# end

module Cedar
  class Config
    attr_accessor :live_mode

    def initialize
      @live_mode = true
    end
  end
end
