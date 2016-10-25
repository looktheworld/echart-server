var express = require('express');
var router = express.Router();
var jsdom = require('jsdom');
var url = require('url');
var log4js = require('log4js');
var logger = require("./../logHelper").helper.getLogger('highchart');

var fs = require('fs'), 
highcharts = require('node-highcharts'),
	options = {
    "chart": {
        "height": 400, 
        "width": 1200
    }, 
    "title": {
        "text": ""
    }, 
	legend : {
		itemWidth : 100,
		y:-10
	},
    "plotOptions": {
        "pie": {
            "allowPointSelect": true, 
            "cursor": "pointer", 
			size: 240,
			center: [400,160],
            "colors": [
                "#0099CC", 
                "#CC6699", 
                "#CC6633", 
                "#6699FF", 
                "#CC3366", 
                "#33CC66", 
                "#CC9900", 
                "#996699", 
                "#669933", 
                "#FF6666", 
                "#CCCC33"
            ], 
            "dataLabels": {
                "enabled": false, 
                "color": "#000000", 
                "connectorColor": "#000000", 
                "format": "<b>{point.name}</b>: {point.percentage:.1f} %"
            }, 
            "showInLegend": true
        }
    }, 
    "series": [
        {
            "type": "pie", 
            "name": "订单金额", 
            "data": [
                [
                    "2014-04-29", 
                    681839.59
                ], 
                [
                    "2014-04-30", 
                    547606.9
                ], 
                [
                    "2014-05-01", 
                    503729.63
                ], 
                [
                    "2014-05-02", 
                    1515662.32
                ], 
                [
                    "2014-05-03", 
                    1905314.07
                ], 
                [
                    "2014-05-04", 
                    1342778.99
                ], 
                [
                    "2014-05-05", 
                    1212588.34
                ], 
                [
                    "2014-05-06", 
                    642265.45
                ], 
                [
                    "2014-05-07", 
                    355979.55
                ], 
                [
                    "2014-05-08", 
                    58241.1
                ], 
                [
                    "2014-05-09", 
                    3626.62
                ]
            ]
        }
    ]
};

/**
 * Format a number and return a string based on input settings
 * @param {Number} number The input number to format
 * @param {Number} decimals The amount of decimals
 * @param {String} decPoint The decimal point, defaults to the one given in the lang options
 * @param {String} thousandsSep The thousands separator, defaults to the one given in the lang options
 */
function numberFormat(number, decimals, decPoint, thousandsSep) {
	var lang = {
            loading: "Loading...",
            months: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
            shortMonths: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
            weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
            decimalPoint: ".",
            numericSymbols: "k,M,G,T,P,E".split(","),
            resetZoom: "Reset zoom",
            resetZoomTitle: "Reset zoom level 1:1",
            thousandsSep: ","
        },
		n = +number || 0,
		c = decimals === -1 ?
			(n.toString().split('.')[1] || '').length : // preserve decimals
			(isNaN(decimals = Math.abs(decimals)) ? 2 : decimals),
		d = decPoint === undefined ? lang.decimalPoint : decPoint,
		t = thousandsSep === undefined ? lang.thousandsSep : thousandsSep,
		s = n < 0 ? "-" : "",
		i = String(parseInt(n = Math.abs(n).toFixed(c))),
		j = i.length > 3 ? i.length % 3 : 0;

	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
		(c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}
		
//计算周末
var checkWeekEnd = function(_d) {
	var s = _d.replace(/\-/g, "/");
	return new Date(s.replace("-", "/")).getDay();
}

//set chart line、bar default show
function chartElementVisible(hcOoptoin) {
	var hasDefaultDisplay = false;
	hcOoptoin.series.forEach(function(o, i) {
		if(o.defaultDisplay!=null && o.defaultDisplay) {
			hasDefaultDisplay = true;
			o.visible = true;
		} else {
			o.visible = false;
		}
	});
	if(hasDefaultDisplay) {
		return;
	}
	hcOoptoin.series.forEach(function(o, i) {
		if (i == 0) {
			o.visible = true;
		}
	});
}

var highChartOption = function(chartType, title, subTitle, date, series) {
	var dayInterval = 1;
	dayInterval = Math.ceil(date.length / 31);
	// debugger;
	var hasPercent = false;
	for ( var n = 0; n < series.length; n++) {
		var sname = series[n].name;
		if(sname!=null && (sname.indexOf("%")>-1 || sname.indexOf("rate")>-1)) {
			hasPercent = true;
		}
		series[n].data.forEach(function(o, i) {
			if (o[0] && (checkWeekEnd(o[0].substr(0, 10)) == 6
					|| checkWeekEnd(o[0].substr(0, 10)) == 0)) {
				if(o[0].length == 10){
					series[n].data[i] = {
						x : i,
						y : o[1],
						marker : {
							radius : 7,
							fillColor : '#FF9900',
							lineWidth : 2,
							lineColor : null,
							symbol : "diamond"
						}
					};
				}else{
					series[n].data[i] = {
							x : i,
							y : o[1]
					};
				}
			}
			else {
				series[n].data[i] = {
					x : i,
					y : o[1]
				};
			}

			if (chartType == "pie") {
				series[n].data[i] = [ o[0], o[1] ];
			}

		});
	}

	if (chartType == "line" || chartType == "spline" || chartType == "area") {
		var hcOoptoin = null;
		var xAxis, yAxis;
		var yPosition = 15;
		var staggerLines = 1;
		if (chartType == "line" || chartType == "spline") {
			yPosition = -3;
			staggerLines = 2;
		}
		xAxis = {
			categories : date,
			"labels": {"step": 2}
		};

		yAxis = [ {
			gridLineWidth : 1,
			minRange : 4,
			title : {
				text : null
			},
			labels : {
				align : 'left',
				x : 3, 
				y : 20,
				formatter : function() {
					return numberFormat(this.value, 0);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			},
			showFirstLabel : false
		}, {
			gridLineWidth : 1,
			opposite : true,
			title : {
				text : null
			},
			labels : {
				align : 'right',
				x : 60, 
				y : 16,
				formatter : function() {
					return numberFormat(this.value, 2) + (hasPercent ? "%" : "");
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			},
			showFirstLabel : false
		} , {
			gridLineWidth : 1,
			opposite : true,
			title : {
				text : null
			},
			labels : {
				align : 'right',
				formatter : function() {
					return numberFormat(this.value, 2);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			},
			showFirstLabel : false
		}];

		hcOoptoin = {
			chart : {
				type : chartType,
				borderColor : '#cccccc',
				margin : [ 30, 40, 50, 20 ], //spacingTop, spacingRight, spacingBottom and spacingLeft options.
				height : 400,
				width: 1800,
				zoomType : 'x'
			},
			colors: ['#0099CC','#CC6699','#CC6633','#6699FF','#33CC66','#996699','#CC9900','#669933','#FF6666','#CCCC33'],
			title : {
				text : title
			},
			subtitle : {
				text : subTitle
			},
			xAxis : xAxis,
			yAxis : yAxis,
			legend : {
				align : 'center',
				itemWidth : 80,
				borderWidth: 2,
				y: -10
			},

			plotOptions : {
				column : {
					dataLabels : {
						enabled : true
					}
				}
			},
			series : series
		};
		chartElementVisible(hcOoptoin);
		return hcOoptoin;
	} else if (chartType == "stackColumn" || chartType == "column" ){
		var basicChartType = 'column';
		var stacking = "";

		var hcOoptoin = null;
		var xAxis, yAxis;
		var yPosition = 15;
		var xPosition = 0;
		var staggerLines = 1;
		var margin = [ 30, 40, 50, 50 ];
		var labelEnable = true;
		var lableColor = "white";

		if(chartType == "stackColumn"){
			basicChartType = "column";
			stacking = 'normal';
			xPosition = 0;
			labelEnable = false;
		}else if (chartType == "column"){
			basicChartType = chartType;
			stacking = '';
			xPosition = 0;
			labelEnable = false;
		}

		xAxis = {
			categories : date,
			gridLineWidth : 0,
			labels : {
				x : xPosition,
				y : yPosition,
				formatter : function(value) {
					if (this.value.length == 10)
						return (this.value.substring(5));
					else
						return (this.value);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			}

		};

		yAxis =[ { 
			gridLineWidth : 1,
			minRange : 4,
			title : {
				text : null
			},
            stackLabels: {
                enabled: labelEnable,
        		formatter : function() {
					return numberFormat(this.total, 2);
				}
            },
			labels : {
				align : 'left',
				x : -50, 
				y : 5,
				formatter : function() {
					return numberFormat(this.value, 0);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			}
		}, {
			gridLineWidth : 1,
			opposite : true,
			title : {
				text : null
			},
			labels : {
				align : 'right',
				x : 10, 
				y : 16,
				formatter : function() {
					return numberFormat(this.value, 2) + (hasPercent ? "%" : "");
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			},
			showFirstLabel : false
		}];

		hcOoptoin = {
			chart : {
				type : basicChartType,
				borderColor : '#cccccc',
				margin : margin, //spacingTop, spacingRight, spacingBottom and spacingLeft options.
				height : 400,
				width: 1800,
				zoomType : 'x'
			},
			colors: ['#0099CC','#CC6699','#CC6633','#6699FF','#33CC66','#996699','#CC9900','#669933','#FF6666','#CCCC33'],
			title : {
				text : title
			},
			subtitle : {
				text : subTitle
			},
			xAxis : xAxis,
			yAxis : yAxis,
			legend : {
				align : 'center',
				borderWidth: 2,
				itemWidth : 80,
				y:-10
			},

			plotOptions : {
				column : {
					stacking : stacking,
					dataLabels : {
						enabled : false,
                    	color: lableColor
					}
				}
			},
			series : series
		};
		if(chartType != "stackColumn"){
			chartElementVisible(hcOoptoin);
		}
		return hcOoptoin;
	}else if (chartType == "stackBar" || chartType == "bar" ){
		var basicChartType = 'bar';
		var stacking = "normal"; 	//normal  or  percent
		var yPosition = 0;
		var xPosition = -15;
		var staggerLines = 1;
		var margin = [ 30, 40, 50, 60 ];
		var labelEnable = true;

		var hcOoptoin = null;
		var xAxis, yAxis;
		if(chartType == "stackBar"){
			basicChartType = "bar";
			stacking = 'normal';
		}else if (chartType == "bar"){
			basicChartType = chartType;
			stacking = '';
		}
		xPosition = -15;
		yPosition = 0;
		labelEnable = false;

		xAxis = {
			categories : date,
			gridLineWidth : 0,
			labels : {
				x : xPosition,
				y : yPosition,
				formatter : function(value) {
					if (this.value.length == 10)
						return (this.value.substring(5));
					else
						return (this.value);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			}

		};

		yAxis = { 
			gridLineWidth : 1,
			minRange : 4,
			title : {
				text : null
			},
            stackLabels: {
                enabled: labelEnable,
        		formatter : function() {
					return numberFormat(this.total, 2);
				}
            },
			labels : {
				align : 'left',
				x : 3, 
				y : 20,
				formatter : function() {
					return numberFormat(this.value, 0);
				},
				style : {
					fontFamily : 'Microsoft Yahei',
					fontSize : '10px'
				}
			}
		};
		hcOoptoin = {
			chart : {
				type : basicChartType,
				borderColor : '#cccccc',
				margin : margin, //spacingTop, spacingRight, spacingBottom and spacingLeft options.
				height : 400,
				width: 1800,
				zoomType : 'x'
			},
			colors: ['#0099CC','#CC6699','#CC6633','#6699FF','#33CC66','#996699','#CC9900','#669933','#FF6666','#CCCC33'],
			title : {
				text : title
			},
			subtitle : {
				text : subTitle
			},
			xAxis : xAxis,
			yAxis : yAxis,
			legend : {
				align : 'center',
				borderWidth: 2,
				itemWidth : 80,
				"y": -10
			},

			plotOptions : {
				series : {
					stacking : stacking,
					dataLabels : {
						enabled : false,
                    	color: 'white'
					}
				}
			},
			series : series
		};

		if(chartType != "stackBar"){
			chartElementVisible(hcOoptoin);
		}
		return hcOoptoin;
	} else if (chartType == "pie") {
		// Build the chart
		var hcOoptoin = {
			chart : {
				plotBackgroundColor : null,
				plotBorderWidth : null,
				plotShadow : false,
				height : 400,
				width: 1200,
			},
			title : {
				text : title
			},
			legend : {
				itemWidth : 100,
				y:-10
			},
			plotOptions : {
				pie : {
					size: 240,
					center: [400,160],
					allowPointSelect : true,
					cursor : 'pointer',
					colors: ['#0099CC','#CC6699','#CC6633','#6699FF','#CC3366','#33CC66','#CC9900','#996699','#669933','#FF6666','#CCCC33'],
					dataLabels : {
						enabled : false,
						color: '#000000',
	                    connectorColor: '#000000',
	                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
					},
					showInLegend : true
				}
			},
			series : [ {
				type : 'pie',
				name : series[0].name,
				data : series[0].data
			} ]
		};
		return hcOoptoin;
	}
}

/* GET users listing. */
router.get('/', function(req, res) {
	var chartData = req.query.chartData;
	logger.info("query==="+JSON.stringify(req.query));
	console.log("query console==="+JSON.stringify(req.query));
	if(chartData != null) {
		var jsonData = eval("("+req.query.chartData+")");
		if(jsonData.chart != null) {
			options = jsonData;
		}
	}
	if(req.query.chartType!=null) {
		var tmpOption = highChartOption(req.query.chartType, '', '',eval("("+req.query.xData+")"),eval("("+req.query.yData+")"));
		console.log(JSON.stringify(tmpOption));
		options = tmpOption;
	}
	highcharts.renderSvg(options, function(err, data) {
		logger.info("svg===================" + data);
		if (err) {
			logger.info('Error: ' + err);
		} else {
			res.writeHeader(200, {'Content-Type': 'text/html;charset=utf-8'});
			res.write(data);
			res.end();
		}
	});
});

router.post('/', function(req, res) {
	highcharts.renderSvg(options, function(err, data) {
		if (err) {
			logger.info('Error: ' + err);
		} else {
			res.writeHeader(200, {'Content-Type': 'text/html;charset=utf-8'});
			res.write(data);
			res.end();
		}
	});
});

module.exports = router;
