install: pre_env start

clean:
	@if [ -a ~/src/node-v8.11.4.tar.gz ]; then rm ~/src/node-v8.11.4.tar.gz; fi;
	@if [ -a ~/src/node-v8.11.4.tar.gz ]; then rm ~/src/node-v8.11.4.tar.gz; fi;
	@if [ -a ~/bin/node ]; then rm ~/bin/node; fi;
	@if [ -a ~/bin/npm ]; then rm ~/bin/npm; fi;
	@if [ -a ~/bin/pm2 ]; then rm ~/bin/pm2; fi;

pre_env: clean nodejs_env deps pm2 logs ready

nodejs_env:
	# 安装 node.js
	@if [ -d ~/bin ]; then echo ""; else mkdir ~/bin; fi;
	@if [ -d ~/src ]; then echo ""; else mkdir ~/src; fi;
	@cd ~/src ; wget https://nodejs.org/dist/v8.11.4/node-v8.11.4.tar.gz
	@if [ -d ~/src ]; then echo ""; else mkdir ~/src; fi;
	@cd ~/src ; xz -d node-v8.11.4.tar.gz
	@cd ~/src ; tar xvf node-v8.11.4.tar.gz
	@cd ~/bin ; ln -s ../src/node-v8.11.4.tar.gz/bin/node node
	@cd ~/bin ; ln -s ../src/node-v8.11.4.tar.gz/bin/npm npm
	@npm config set prefix ~
	@npm install -g cnpm --registry=https://registry.npm.taobao.org

deps:
	# 初始化项目
	@cnpm install

pm2:
	# 安装运维工具
	@cnpm install -g pm2
	#  由于 npm 经常不通，如有需要自行安装
	#@pm2 install pm2-logrotate

logs:
	# 准备日志
	@mkdir logs
	@if [ -d "/etc/logrotate.d" ]; then sudo echo "$$PWD/logs/*.log { \r    rotate 12\r    daily\r    missingok\r    \r    notifempty\r    compress\r    delaycompress\/}" > /etc/logrotate.d/pm2-user; fi;

ready:
	# 生成 key & secret
	@node ./bin/installkv.js
	# 输出配置信息
	@node ./bin/info.js

start:
	@pm2 start app.js  --merge-logs --log-date-format="YYYY-MM-DD HH:mm:ss Z" --output ./logs/out.log --error ./logs/err.log

stop:
	@pm2 stop all

update:
	git pull origin release
