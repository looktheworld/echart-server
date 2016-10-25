(function() {
    var system = require('system');
    var fs = require('fs');
    var config = {
        // define the location of js files  
        JQUERY: 'jquery-1.10.2.min.js',
        ESL: 'esl.js',
        ECHARTS: 'echarts-all.js',
        // default container width and height  
        DEFAULT_WIDTH: 1200,
        DEFAULT_HEIGHT: 600
    },
    parseParams,
    render,
    pick,
    usage;

    usage = function() {
        console.log("\nUsage: phantomjs echarts-convert.js -options options -outfile filename -width width -height height" + "OR" + "Usage: phantomjs echarts-convert.js -infile URL -outfile filename -width width -height height\n");
    };

    pick = function() {
        var args = arguments,
        i, arg, length = args.length;
        for (i = 0; i < length; i += 1) {
            arg = args[i];
            if (arg !== undefined && arg !== null && arg !== 'null' && arg != '0') {
                return arg;
            }
        }
    };

    parseParams = function() {
        var map = {},
        i, key;
        if (system.args.length < 2) {
            usage();
            phantom.exit();
        }
        for (i = 0; i < system.args.length; i += 1) {
            if (system.args[i].charAt(0) === '-') {
                key = system.args[i].substr(1, i.length);
                if (key === 'infile') {
                    // get string from file  
                    // force translate the key from infile to options.  
                    key = 'options';
                    try {
                        map[key] = fs.read(system.args[i + 1]).replace(/^\s+/, '');
                    } catch(e) {
                        console.log('Error: cannot find file, ' + system.args[i + 1]);
                        phantom.exit();
                    }
                } else {
                    map[key] = system.args[i + 1];
                }
            }
        }
        return map;
    };

    render = function(params) {
        var page = require('webpage').create(),
        createChart;

        page.onConsoleMessage = function(msg) {
            console.log(msg);
        };

        page.onAlert = function(msg) {
            console.log(msg);
        };

        createChart = function(inputOption, width, height) {
            var counter = 0;
            function decrementImgCounter() {
                counter -= 1;
                if (counter < 1) {
                    console.log(messages.imagesLoaded);
                }
            }

            function loadScript(varStr, codeStr) {
                var script = $('<script>').attr('type', 'text/javascript');
                script.html('var ' + varStr + ' = ' + codeStr);
                document.getElementsByTagName("head")[0].appendChild(script[0]);
                if (window[varStr] !== undefined) {
                    console.log('Echarts.' + varStr + ' has been parsed');
                }
            }
            // load opitons  
            if (inputOption != 'undefined') {
                // parse the options  
                loadScript('options', inputOption);
                // disable the animation  
                options.animation = false;
            }

            // we render the image, so we need set background to white.  
            $(document.body).css('backgroundColor', 'white');
			
			var optArray = new Array();
			if(options && options.legend && options.legend.selected) {
				$.each(options.legend.selected,function(k,v){
					if(v) {
						var tmpOpt = $.extend(true, {}, options);
						tmpOpt.legend.data = [k];
						$.each(tmpOpt.series,function(index,ele){
							if(k == ele.name) {
								tmpOpt.series = [ele];
								optArray.push(tmpOpt);
								return false;
							}
						});
					}
				});
			}
			
			var optLen = optArray.length;
			
            var container = $("<div>").appendTo(document.body);
            container.attr('id', 'container');
            container.css({ width: width, height: height});
			
			$.each(optArray,function(i,o){
				var tmpDiv = $("<div>").appendTo(container);
				tmpDiv.attr('id', 'container' + i);
				tmpDiv.html("div"+i);
				tmpDiv.css({ width: width / 2, height: height / Math.ceil(optLen / 2)-5, float: (i%2==0)? 'left':'right'});
				var myChart = echarts.init(tmpDiv[0]);
				myChart.setOption(o);
				if(i%2==0 && i>0) {
					$("<br>").appendTo(container);
				}
			});
        };

        // parse the params  
        page.open("about:blank",
        function(status) {
            // inject the dependency js  
            page.injectJs(config.JQUERY);
            //page.injectJs(config.ESL);
            page.injectJs(config.ECHARTS);

            var width = pick(params.width, config.DEFAULT_WIDTH);
            var height = pick(params.height, config.DEFAULT_HEIGHT);
			var options = eval("("+params.options+")");
			
			var optLen = 0;
			if(options && options.legend && options.legend.selected) {
				for(var pro in options.legend.selected) {
					var v = options.legend.selected[pro];
					if(v) {
						for(var ser in options.series) {
							var ele = options.series[ser];
							if(pro == ele.name) {
								optLen ++;
								break;
							}
						}
					}
				}
			}
			if(optLen > 5) {
				height = config.DEFAULT_HEIGHT * 1.5;
			}

            // create the chart  
            page.evaluate(createChart, params.options, width, height);

            // define the clip-rectangle  
            page.clipRect = {
                top: 0,
                left: 0,
                width: width,
                height: height
            };
            // render the image  
            /*page.render(params.outfile);
            console.log('render complete:' + params.outfile);*/
			
			var page64 = page.renderBase64('png');
			console.log('<img src="data:image/png;base64,' + page64 + '"/>');
			page.render(params.outfile);
			
            // exit  
            phantom.exit();
        });
    };
    // get the args  
    var params = parseParams();

    // validate the params  
    if (params.options === undefined || params.options.length === 0) {
        console.log("ERROR: No options or infile found.");
        usage();
        phantom.exit();
    }
    // set the default out file  
    if (params.outfile === undefined) {
        var tmpDir = fs.workingDirectory + '/tmp';
        // exists tmpDir and is it writable?  
        if (!fs.exists(tmpDir)) {
            try {
                fs.makeDirectory(tmpDir);
            } catch(e) {
                console.log('ERROR: Cannot make tmp directory');
            }
        }
        params.outfile = tmpDir + "/" + new Date().getTime() + ".png";
    }

    // render the image  
    render(params);
} ());