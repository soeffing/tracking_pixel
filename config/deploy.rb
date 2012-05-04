require 'json'

settings = JSON.parse File.read(File.join(File.dirname(__FILE__), 'app.json'))

set :application, "hummingbird"
set :scm, :git



# server details
default_run_options[:pty] = true
ssh_options[:forward_agent] = true
ssh_options[:keys] = ["/home/soeffing/Dropbox/Adooza/EC2/AdoozaSite.pem"] 
ssh_options[:config] = false 
ssh_options[:verbose] = :debug 
set :deploy_to, "/home/ubuntu/www/hummingbird"
set :scm_verbose, true
set :scm_username, "soeffing"  # If you access your source repository with a different user name than you are logged into your local machine with, Capistrano needs to know.
set :user, "ubuntu"   # is the user on the server that runs this recipes
set :use_sudo, false

set :repository, settings['capistrano']['repository']

set :hummingbird_host, settings['capistrano']['hummingbird_host']

role :web, hummingbird_host
role :app, hummingbird_host
role :db,  hummingbird_host

depend :remote, :command, 'git'

#set :git_enable_submodules, 1
#set :deploy_to, "/var/www/#{application}"

default_run_options[:pty] = true

namespace :deploy do
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} restart hummingbird"
    run "#{try_sudo} restart hummingbird_monitor"
  end

 # error with capistrano therefoe excluded IMPORTANT: excluded after filter at the end of this file!!!!

 # /home/ubuntu <- pwd

  task :update_node_modules, :roles => :app do
    run "cd /home/ubuntu/www/hummingbird/current && npm install"
   # run "cd /home/ubuntu/www/hummingbird/current && wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz"
   # run "cd /home/ubuntu/www/hummingbird/current && gunzip GeoLiteCity.dat.gz"
  end
end

desc 'Tail the production log'
task :tail, :roles => :app do
  run "tail -100f #{shared_path}/log/hummingbird.log"
end

desc 'Tail nginx error log'
task :tail_error, :roles => :app do
  sudo "tail -100f /var/log/nginx/error.log"
end

namespace :update do
  desc 'Creates symlinks for shared resources'
  task :symlink_shared do
    symlinks = { 'log' => 'log', 'config/app.json' => 'config/app.json' }
    symlinks.each do |shared, current|
      run "rm -rf #{latest_release}/#{current}"
      run "ln -s #{shared_path}/#{shared} #{latest_release}/#{current}"
    end
  end
end

desc "Backup the remote production database"
task :backup, :roles => :db do
  filename = "#{application}.dump.#{Time.now.to_s.gsub(/[^0-9\-]/, '')}.bson"
  file = "/tmp/hummingbird/metrics.bson"
  on_rollback { run "rm #{file}" }
  run "echo $PATH; mongodump -d hummingbird -c metrics -o /tmp"  do |ch, stream, data|
    puts data
  end
  `mkdir -p #{File.dirname(__FILE__)}/../backups/`
  get file, "backups/#{filename}"
  run "rm #{file}"
end

after 'deploy:update_code', 'update:symlink_shared'
 after 'deploy:update_code', 'deploy:update_node_modules'
