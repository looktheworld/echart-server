var helper = {};
exports.helper = helper;

helper.file = "normal";

var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
      type: 'dateFile', //文件输出
      filename: __dirname + '/logs/log',
	  pattern: '_yyyyMMdd.log',
      alwaysIncludePattern: true,  
      maxLogSize: 1024,
      backups:3
    }
  ],
  replaceConsole: true
});

helper.getLogger = function(name) {
	if(name==null) {
		name = "normal";
	}
	var log = log4js.getLogger(name);
	return log;
}

// 配合express用的方法
helper.use = function(app) {
    //页面请求日志, level用auto时,默认级别是WARN
    app.use(log4js.connectLogger(log4js.getLogger('normal'), {level:'auto', format:':method :url'}));
}