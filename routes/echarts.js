var express = require('express');
var router = express.Router();
var jsdom = require('jsdom');
var url = require('url');
var log4js = require('log4js');
var logger = require("./../logHelper").helper.getLogger('echarts');
var	spawn	= require('child_process').spawn;

var options =  {
    tooltip : {
        trigger: 'axis',
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
    },
    legend: {
        data:['直接访问', '邮件营销','联盟广告','视频广告','搜索引擎']
    },
    /*toolbox: {
        show : true,
        feature : {
            mark : {show: true},
            dataView : {show: true, readOnly: false},
            magicType : {show: true, type: ['line', 'bar', 'stack', 'tiled']},
            restore : {show: true},
            saveAsImage : {show: true}
        }
    },*/
    calculable : true,
    xAxis : [
        {
            type : 'value'
        }
    ],
    yAxis : [
        {
            type : 'category',
            data : ['周一','周二','周三','周四','周五','周六','周日']
        }
    ],
    series : [
        {
            name:'直接访问',
            type:'bar',
            stack: '总量',
            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
            data:[320, 302, 301, 334, 390, 330, 320]
        },
        {
            name:'邮件营销',
            type:'bar',
            stack: '总量',
            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
            data:[120, 132, 101, 134, 90, 230, 210]
        },
        {
            name:'联盟广告',
            type:'bar',
            stack: '总量',
            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
            data:[220, 182, 191, 234, 290, 330, 310]
        },
        {
            name:'视频广告',
            type:'bar',
            stack: '总量',
            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
            data:[150, 212, 201, 154, 190, 330, 410]
        },
        {
            name:'搜索引擎',
            type:'bar',
            stack: '总量',
            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
            data:[820, 832, 901, 934, 1290, 1330, 1320]
        }
    ]
};

var createEChart = function(chartType, title, subTitle, date, series) {
    var option = {
    	animation : false,
        tooltip : {
        	showDelay : 0,
            trigger : 'axis'
        },
        legend: {
        	y : 'bottom',
        	borderWidth : 1,
            data:[],
            selected: {
            },
        },
        grid : {
        	borderWidth : 0,
        	y : 40,
        	y2 : 80
        },
        /*toolbox: {
            show : true,
            feature : {
                //mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar','stack', 'tiled']},
                restore : {show: true},
                dataZoom : {
                    show : true,
                    title : {
                        dataZoom : '区域缩放',
                        dataZoomReset : '区域缩放后退'
                    }
                },
                saveAsImage : {show: true}
            }
        },*/
        calculable : true,
        xAxis : [
            {
                type : 'category',
                boundaryGap: true,
                splitLine : {show : false},
                axisLine : {show : false,
                	formatter : function(value) {
                		return value;
            			//return (value.length == 10) ? (value.substring(5) : value;
            		}
                },
                data : []
            }
        ],
        yAxis : [
            {
                type : 'value',
                boundaryGap : [0,0.1],
                scale : false,
                axisLine : {show : false},
            },
            {
                type : 'value',
                scale : false,
                boundaryGap : [0,0.2],
                axisLine : {show : false},
                axisLabel : {
                    formatter: '{value} %'
                },
            }
        ],
        series : [
            {
                name:'',
                type:'bar',
                data:[]
            }
        ]
    };
    
    option.series[0] = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}'
        },
        name: '省份',
        type: 'map',
        mapType: 'china',
        mapLocation: {
            x: 10,
            y: 'top',
            width: '30%'
        },
        roam: true,
        selectedMode : 'single',
        itemStyle:{
            normal:{label:{show:true}},
            emphasis:{label:{show:true}}
        },
        data:[
            {name: '北京', selected:false},
            {name: '天津', selected:false},
            {name: '上海', selected:false},
            {name: '重庆', selected:false},
            {name: '河北', selected:false},
            {name: '河南', selected:false},
            {name: '云南', selected:false},
            {name: '辽宁', selected:false},
            {name: '黑龙江', selected:false},
            {name: '湖南', selected:false},
            {name: '安徽', selected:false},
            {name: '山东', selected:false},
            {name: '新疆', selected:false},
            {name: '江苏', selected:false},
            {name: '浙江', selected:false},
            {name: '江西', selected:false},
            {name: '湖北', selected:false},
            {name: '广西', selected:false},
            {name: '甘肃', selected:false},
            {name: '山西', selected:false},
            {name: '内蒙古', selected:false},
            {name: '陕西', selected:false},
            {name: '吉林', selected:false},
            {name: '福建', selected:false},
            {name: '贵州', selected:false},
            {name: '广东', selected:false},
            {name: '青海', selected:false},
            {name: '西藏', selected:false},
            {name: '四川', selected:false},
            {name: '宁夏', selected:false},
            {name: '海南', selected:false},
            {name: '台湾', selected:false},
            {name: '香港', selected:false},
            {name: '澳门', selected:false}
        ]
    }

    var cityOption = [];
    
	var hasPercent = false;
	var hasDefaultDisplay = false;
    for ( var n = 0; n < series.length; n++) {
		var sname = series[n].name;
    	if(sname!=null && (sname.indexOf("%")>-1 || sname.indexOf("rate")>-1)) {
    		hasPercent = true;
    	}
    	
		option.legend.data[n] = sname;
    	option.legend.selected[sname] = series[n].defaultDisplay;
    	
		if(series[n].defaultDisplay) {
			hasDefaultDisplay = true;
		}
		
		if(chartType != 'cityMap') {
			option.series[n] = {name:'', type:'line', symbolSize:4, data:[]};
		}
		switch(chartType) {
		case 'area':
			option.series[n].itemStyle = {normal: {areaStyle: {type: 'default'}}}
			break;
		case 'spline':
			option.series[n].smooth = true;
			break;
		case 'bar':
			option.series[n].type = 'bar';
			break;
		case 'column':
			option.series[n].type = 'bar';
			break;
		case 'stackColumn':
			option.series[n].type = 'bar';
			option.series[n].stack = "group";
			option.legend.selected[sname] = true;
			break;
		case 'stackBar':
			option.series[n].type = 'bar';
			option.series[n].stack = "group";
			option.legend.selected[sname] = true;
			option.series[n].smooth = true;
			break;
		case 'pie':
			option.series[n].type = 'pie';
			option.series[n].radius = '60%';
			option.series[n].center = ['50%', '60%'];
			option.series[n].selectedMode = 'single';

			option.series[n].itemStyle = {
            	normal : { label : {formatter : "{b}: {d}%"},
                       labelLine : {show : true}
                },
                emphasis : { label : {
                        position : 'inner',
                        show : true,
                        formatter : "{b}\n{d}%"
                    }
                }
            }
			break;
		case 'map':
			option.series[n].type = 'map';
    		option.series[n].roam = false;
        	option.series[n].itemStyle = {
            	normal:{label:{show:true}},
            	emphasis:{label:{show:true}}
            };
			break;
		case 'cityMap':
			cityOption[n] = {name:sname, type:'map', data:[]};
			cityOption[n].roam = true;
			cityOption[n].itemStyle = {
            	normal:{label:{show:true}},
            	emphasis:{label:{show:true}}
            };
			cityOption[n].apLocation = { x: '35%'};
			break;
		}
		
		if(chartType != 'cityMap') {
			option.series[n].name = sname;
			option.series[n].yAxisIndex = ((series[n].yAxis > 1) ? 0 : series[n].yAxis);
		}
		series[n].data.forEach(function(o, i) {
    		switch(chartType) {
    		case 'pie':
    			option.legend.data[i] = o[0];
        		option.series[0].data[i] = {value:o[1], name:o[0]};
        		break;
    		case 'map':
        		option.series[n].data[i] = o[1];
        		option.series[n].mapType ='china';
        		option.series[n].data[i] = {value:o[1], name:o[0]};
    			break;
    		case 'cityMap':
    			cityOption[n].data[i] = o[1];
    			cityOption[n].data[i] = {value:o[1], name:o[0]};
    			break;
    		default:
        		option.xAxis[0].data[i] = o[0];
        		option.series[n].data[i] = o[1] ? o[1] : 0;
        		break;
    		}
    	});
    	
    	if(chartType == 'pie') {
    		break;
    	}
    }
    
    if(!hasDefaultDisplay) {
    	option.legend.selected[series[0].name] = true;
    }

    switch(chartType) {
    case 'area':
    	option.xAxis[0].boundaryGap = false;
    	break;
    case 'bar':
    case 'stackBar':
    	var xaxisSwap = option.yAxis;
    	option.yAxis = option.xAxis;
    	option.xAxis = xaxisSwap;
    	break;
	case 'column':
    case 'line':
        option.yAxis[1].axisLabel.formatter = '{value} ' + (hasPercent ? '%' : '');
        break;
    case 'pie':
    	option.calculable = false;
    	option.animation = true;
		option.tooltip.formatter = "{a} <br/>{b} : {c} ({d}%)";
		option.tooltip.trigger = 'item';
		delete option.grid;
		delete option.xAxis;
		delete option.yAxis;
    	option.legend.orient = 'vertical';
    	//option.legend.x = 'left';
    	option.legend.x = 150;
    	option.legend.y = 'top';
    	//option.toolbox.feature.magicType = {};
    	break;
    case 'map':
		option.xAxis = null;
		option.yAxis = null;
    	option.grid = null;
    	option.legend.orient = 'vertical';
    	option.legend.x = 'left';
    	option.legend.y = 'top';
    	option.legend.selectedMode = 'single';
    	//option.legend.selected = null;
		option.tooltip.trigger = 'item';
		option.tooltip.formatter = "{b} <br/>{a} : {c}";
		/*option.toolbox.feature = {
            mark : {show: true},
            dataView : {show: true, readOnly: false},
            restore : {show: true},
            saveAsImage : {show: true}
        };*/
		
		var maxDr = 100;
		option.series.forEach(function(o, i) {
			var tmp = 0;
			o.data.forEach(function(dobj, di) {
				tmp = dobj.value;
			});
			if(maxDr < tmp) {
				maxDr = tmp;
			}
		});

		option.dataRange = {
	        min: 0,
	        max: Math.round(maxDr),
	        x: 'left',
	        y: 'bottom',
	        text:['高','低'],           // 文本，默认为数值文本
	        calculable : true
	        //color: ['maroon','purple','red','orange','yellow','lightgreen']
	    };
		break;
    case 'cityMap':
		option.xAxis = null;
		option.yAxis = null;
    	option.grid = null;
    	option.legend.orient = 'vertical';
    	option.legend.x = 'right';
    	option.legend.y = 'top';
    	option.legend.selectedMode = 'single';
		option.tooltip.trigger = 'item';
		option.tooltip.formatter = "{b0} <br/>{a0} : {c0}";

		option.toolbox.orient ='vertical';
		option.toolbox.y = 'center';
		/*option.toolbox.feature = {
            mark : {show: true},
            dataView : {show: true, readOnly: false},
            restore : {show: true},
            saveAsImage : {show: true}
        };*/
    	break;
    }
	return option;
}

/* GET users listing. */
router.get('/', function(req, res) {
	var chartData = req.query.chartData;
	logger.info("query==="+JSON.stringify(req.query));
	//console.log("query==="+JSON.stringify(req.query));
	var single = req.query.single;
	if(chartData != null) {
		var jsonData = eval("("+req.query.chartData+")");
		if(jsonData.chart != null) {
			options = jsonData;
		}
	}
	if(req.query.chartType != null) {
		var tmpOption = createEChart(req.query.chartType, '', '',eval("("+req.query.xData+")"),eval("("+req.query.yData+")"));
		//console.log(JSON.stringify(tmpOption));
		options = tmpOption;
	}
	var useJs = 'echarts-convert.js';
	if(single) {
		useJs = 'echarts-convert-single.js';
	}
	var convert = spawn('phantomjs', [__dirname+'/phantom/'+useJs,'-options',JSON.stringify(options),'-outfile',__dirname+'/phantom/chart.png']);
	var buffer;
	
	convert.stdout.on('data', function(data) {
		try {
			var prevBufferLength = (buffer ? buffer.length : 0),
			newBuffer = new Buffer(prevBufferLength + data.length);
			
			if (buffer) {
				buffer.copy(newBuffer, 0, 0);
			}
		
			data.copy(newBuffer, prevBufferLength, 0);
				
			buffer = newBuffer;
		} catch (err) {
			console.log(err);
		}
	});
	
	convert.stderr.on('data',function(data){
		console.log("stderr="+data);
	});
			
	// When we're done, we're done
	convert.on('exit', function(code) {
		console.log("exit="+code);
		res.writeHeader(200, {'Content-Type': 'text/html;charset=utf-8'});
		res.write('<h1>respond with a resource</h1>'+buffer);
		res.end();
	});
});

router.post('/', function(req, res) {
	console.log('dddddddir=='+__dirname);
	var convert = spawn('phantomjs', [__dirname+'/phantom/echarts-convert.js','-options',JSON.stringify(options),'-outfile',__dirname+'/phantom/test.png']);
	var buffer;	
	convert.stdout.on('data', function(data) {
		try {
			var prevBufferLength = (buffer ? buffer.length : 0),
			newBuffer = new Buffer(prevBufferLength + data.length);
			
			if (buffer) {
				buffer.copy(newBuffer, 0, 0);
			}
		
			data.copy(newBuffer, prevBufferLength, 0);
				
			buffer = newBuffer;
		} catch (err) {
			console.log(err);
		}
	});
	
	convert.stderr.on('data',function(data){
		console.log("stderr="+data);
	});
			
	// When we're done, we're done
	convert.on('exit', function(code) {
		console.log("exit="+code);
		res.writeHeader(200, {'Content-Type': 'text/html;charset=utf-8'});
		res.write('<h1>respond with a resource</h1>'+buffer);
		res.end();
	});
});

module.exports = router;
