define(["d3"], function (d3) {


	function createChartSpec(data,type,width,height,xtitle,ytitle,xfield,yfield) {
		var spec;

		switch(type) {
			case 'histogram':

				spec = {
					$schema: 'https://vega.github.io/schema/vega-lite/v3.json',
					data: {
						values: data
					},
					"width": width, "height": height,
					mark: "bar",
					"selection": {
						"grid": {
							"type": "interval", "bind": "scales"
						}
					},
					encoding: {
						"x": {"field": xfield, "type": "ordinal", "title": xtitle},
						"y": {"field": yfield, "type": "quantitative", "title": ytitle}
					}
				};
				break;

			case 'bar':

				spec = ({
						"$schema": "https://vega.github.io/schema/vega/v5.json",
						"width": width,
						"height": height,
						"padding": 5,

						"data": [
							{
								"name": "table",
								"values": data
							}
						],
						"signals": [
							{
								"name": "tooltip",
								"value": {},
								"on": [
									{"events": "rect:mouseover", "update": "datum"},
									{"events": "rect:mouseout",  "update": "{}"}
								]
							}
						],

						"scales": [
							{
								"name": "xscale",
								"type": "band",
								"domain": {"data": "table", "field": xfield},
								"range": "width",
								"padding": 0.05,
								"round": true
							},
							{
								"name": "yscale",
								"domain": {"data": "table", "field": yfield},
								"nice": true,
								"range": "height"
							}
						],

						"axes": [
							{ "orient": "bottom", "scale": "xscale","title": xtitle },
							{ "orient": "left", "scale": "yscale","title": ytitle}
						],

						"marks": [
							{
								"type": "rect",
								"from": {"data":"table"},
								"encode": {
									"enter": {
										"x": {"scale": "xscale", "field": xfield},
										"width": {"scale": "xscale", "band": 1},
										"y": {"scale": "yscale", "field": yfield},
										"y2": {"scale": "yscale", "value": 0}
									},
									"update": {
										"fill": {"value": "steelblue"}
									},
									"hover": {
										"fill": {"value": "red"}
									}
								}
							},
							{
								"type": "text",
								"encode": {
									"enter": {
										"align": {"value": "center"},
										"baseline": {"value": "bottom"},
										"fill": {"value": "#333"}
									},
									"update": {
										"x": {"scale": "xscale", "signal": "tooltip."+xfield, "band": 0.5},
										"y": {"scale": "yscale", "signal": "tooltip."+yfield, "offset": -2},
										"text": {"signal": "tooltip."+yfield},
										"fillOpacity": [
											{"test": "datum === tooltip", "value": 0},
											{"value": 1}
										]
									}
								}
							}
						]
					}
				);
				break;

			case 'line':
				spec = {
					"$schema": "https://vega.github.io/schema/vega-lite/v3.json",
					"width": width,
					"height": height,
					data: {
						values: data
					},
					"mark": "line",
					"encoding": {
						"x": {"field": xfield, "type": "quantitative", "title": xtitle},
						"y": {"field": yfield, "type": "quantitative", "title": ytitle}
					}
				}
				break;

			case 'donut':
				spec = {
					"$schema": "https://vega.github.io/schema/vega/v3.0.json",
					"width": width,
					"height": height,
					"autosize": "fit",
					"signals": [
						{"name": "startAngle", "value": 0},
						{"name": "endAngle", "value": 6.29},
						{"name": "padAngle", "value": 0},
						{"name": "sort", "value": true},
						{"name": "strokeWidth", "value": 2},
						{
							"name": "selected",
							"value": "",
							"on": [{"events": "mouseover", "update": "datum"}]
						}
					],
					"data": [
						{
							"name": "table",
							"values": data,
							"transform": [
								{
									"type": "pie",
									"field": yfield,
									"startAngle": {"signal": "startAngle"},
									"endAngle": {"signal": "endAngle"},
									"sort": {"signal": "sort"}
								}
							]
						},
						{
							"name": "fieldSum",
							"source": "table",
							"transform": [
								{
									"type": "aggregate",
									"fields": [yfield],
									"ops": ["sum"],
									"as": ["sum"]
								}
							]
						}
					],
					"legends": [
						{
							"fill": "color",
							"title": "Legends",
							"orient": "none",
							"padding": {"value": 10},
							"encode": {
								"symbols": {"enter": {"fillOpacity": {"value": 1}}},
								"legend": {
									"update": {
										"x": {
											"signal": "(width / 2) + if(selected && selected.continent == datum.continent, if(width >= height, height, width) / 2 * 1.1 * 0.8, if(width >= height, height, width) / 2 * 0.8)",
											"offset": 20
										},
										"y": {"signal": "(height / 2)", "offset": -50}
									}
								}
							}
						}
					],
					"scales": [
						{"name": "color", "type": "ordinal", "range": {"scheme": "category20"}}
					],
					"marks": [
						{
							"type": "arc",
							"from": {"data": "table"},
							"encode": {
								"enter": {
									"fill": {"scale": "color", "field": xfield},
									"x": {"signal": "width / 2"},
									"y": {"signal": "height / 2"}
								},
								"update": {
									"startAngle": {"field": "startAngle"},
									"endAngle": {"field": "endAngle"},
									"padAngle": {
										"signal": "if(selected && selected."+xfield+" == datum."+xfield+", 0.015, 0.015)"
									},
									"innerRadius": {
										"signal": "if(selected && selected."+xfield+" == datum."+xfield+", if(width >= height, height, width) / 2 * 0.45, if(width >= height, height, width) / 2 * 0.5)"
									},
									"outerRadius": {
										"signal": "if(selected && selected."+xfield+" == datum."+xfield+", if(width >= height, height, width) / 2 * 1.05 * 0.8, if(width >= height, height, width) / 2 * 0.8)"
									},
									"opacity": {
										"signal": "if(selected && selected."+xfield+" != datum."+xfield+", 1, 1)"
									},
									"stroke": {"signal": "scale('color', datum.continent)"},
									"strokeWidth": {"signal": "strokeWidth"},
									"fillOpacity": {
										"signal": "if(selected && selected."+xfield+" == datum."+xfield+", 0.8, 0.8)"
									}
								}
							}
						},
						{
							"type": "text",
							"encode": {
								"enter": {"fill": {"value": "#525252"}, "text": {"value": ""}},
								"update": {
									"opacity": {"value": 1},
									"x": {"signal": "width / 2"},
									"y": {"signal": "height / 2"},
									"align": {"value": "center"},
									"baseline": {"value": "middle"},
									"fontSize": {"signal": "if(width >= height, height, width) * 0.05"},
									"text": {"value": "Observation Periods"}
								}
							}
						},
						{
							"name": "mark_population",
							"type": "text",
							"from": {"data": "table"},
							"encode": {
								"enter": {
									"text": {
										"signal": "if(datum['endAngle'] - datum['startAngle'] < 0.3, '', format(datum['"+yfield+"'], '.2f') + ' %'e)"
									},
									"x": {"signal": "if(width >= height, height, width) / 2"},
									"y": {"signal": "if(width >= height, height, width) / 2"},
									"radius": {
										"signal": "if(selected && selected."+xfield+" == datum."+xfield+", if(width >= height, height, width) / 2 * 1.05 * 0.65, if(width >= height, height, width) / 2 * 0.65)"
									},
									"theta": {"signal": "(datum['startAngle'] + datum['endAngle'])/2"},
									"fill": {"value": "#FFFFFF"},
									"fontSize": {"value": 12},
									"align": {"value": "center"},
									"baseline": {"value": "middle"}
								}
							}
						}
					]
				}

			default:
		}

		return spec;
	}


	function mapConceptData(data) {
		var result;

		if (data.COUNT_VALUE instanceof Array) // multiple rows, each value of each column is in the indexed properties.

        {
			result = data.COUNT_VALUE.map(function (d, i) {
				var datum = {}
				datum.id = (this.CONCEPT_ID|| this.CONCEPT_NAME)[i];
				datum.label = this.CONCEPT_NAME[i];
				datum.value = this.COUNT_VALUE[i];
				return datum;
			}, data);

			result = result.sort(function (a, b) {
				return b.label < a.label ? 1 : -1;
			});
		} else // the dataset is a single value result, so the properties are not arrays.
		{
			result = [
				{
					id: data.CONCEPT_ID,
					label: data.CONCEPT_NAME,
					value: data.COUNT_VALUE
			}];
		}
		return result;
	}

	function mapHistogram(histogramData) {
		// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
		var result = new Array();
		var minValue = histogramData.MIN;
		var intervalSize = histogramData.INTERVAL_SIZE;

		histogramData.DATA = normalizeDataframe(histogramData.DATA);
		for (var i = 0; i <= histogramData.INTERVALS; i++) {
			var target = new Object();
			target.x = minValue + 1.0 * i * intervalSize;
			target.dx = intervalSize;
			target.y = histogramData.DATA.COUNT_VALUE[histogramData.DATA.INTERVAL_INDEX.indexOf(i)] || 0;
			result.push(target);
		};

		return result;
	}

	function mapMonthYearDataToSeries(data, options) {
		var defaults = {
			dateField: "x",
			yValue: "y",
			yPercent: "p"
		};

		var options = $.extend({}, defaults, options);

		var series = {};
		series.name = "All Time";
		series.values = [];
		for (var i = 0; i < data[options.dateField].length; i++) {
			var dateInt = data[options.dateField][i];
			series.values.push({
				xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
				yValue: data[options.yValue][i],
				yPercent: data[options.yPercent][i]
			});
		}
		series.values.sort(function (a, b) {
			return a.xValue - b.xValue;
		});

		return [series]; // return series wrapped in an array
	}

	function mapMonthYearDataToSeriesByYear(data, options) {
		// map data in the format yyyymm into a series for each year, and a value for each month index (1-12)
		var defaults = {
			dateField: "x",
			yValue: "y",
			yPercent: "p"
		};

		var options = $.extend({}, defaults, options);

		// this function takes month/year histogram data from Achilles and converts it into a multi-series line plot
		var series = [];
		var seriesMap = {};

		for (var i = 0; i < data[options.dateField].length; i++) {
			var targetSeries = seriesMap[Math.floor(data[options.dateField][i] / 100)];
			if (!targetSeries) {
				targetSeries = {
					name: (Math.floor(data[options.dateField][i] / 100)),
					values: []
				};
				seriesMap[targetSeries.name] = targetSeries;
				series.push(targetSeries);
			}
			targetSeries.values.push({
				xValue: data[options.dateField][i] % 100,
				yValue: data[options.yValue][i],
				yPercent: data[options.yPercent][i]
			});
		}
		series.forEach(function (d) {
			d.values.sort(function (a, b) {
				return a.xValue - b.xValue;
			});
		});
		return series;
	}

	function dataframeToArray(dataframe) {
		// dataframes from R serialize into an obect where each column is an array of values.
		var keys = d3.keys(dataframe);
		var result;
		if (dataframe[keys[0]] instanceof Array) {
			result = dataframe[keys[0]].map(function (d, i) {
				var item = {};
				var container = this;
				keys.forEach(function (p) {
					item[p] = container[p][i];
				});
				return item;
			}, dataframe);
		} else {
			result = [dataframe];
		}
		return result;
	}
	
	function normalizeDataframe(dataframe) {
		// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
		var keys = d3.keys(dataframe);
		keys.forEach(function (key) {
			if (!(dataframe[key] instanceof Array))
			{
				dataframe[key] = [dataframe[key]];	
			}
		});
		return dataframe;
	}
	
	var module = {
		mapHistogram: mapHistogram,
		mapConceptData: mapConceptData,
		mapMonthYearDataToSeries: mapMonthYearDataToSeries,
		mapMonthYearDataToSeriesByYear: mapMonthYearDataToSeriesByYear,
		dataframeToArray: dataframeToArray,
		normalizeDataframe: normalizeDataframe,
		createChartSpec:createChartSpec
	};

	return module;
});
