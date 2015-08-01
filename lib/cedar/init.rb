class Sprockets::DirectiveProcessor
  def process_depend_on_cedar_initializer_directive
    begin
      context.depend_on("#{Rails.root}/config/initializers/cedar.rb")
    rescue
    end
  end

  def process_load_cedar_initializer_directive
    begin
      load("#{Rails.root}/config/initializers/cedar.rb")
    rescue
    end
  end
end
