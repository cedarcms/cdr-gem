require "cedar/init"
require "cedar/version"
require "cedar/config"

module Cedar
  class << self
    attr_writer :config
  end

  def self.config
    @config ||= Config.new
  end

  def self.configure
    yield(config)
  end

  module Rails
    class Engine < ::Rails::Engine
    end
  end
end
