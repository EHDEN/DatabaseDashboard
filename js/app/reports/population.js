(function () {
    define(["jquery", "d3", "jnj/chart", "common", "datatables"], function ($, d3, jnj_chart, common) {
        var population = {};
        var threshold;

        population.render = function (datasource) {
            var chartSpec;

            // Get data from observationperiod
            $('#reportPopulation svg').remove();
            console.log("DD: " + datasource.folder + "/" + datasource.name);
            $.ajax({
                type: "GET",
                url:  getUrlFromData(datasource, 'observationperiod'),
                contentType: "application/json; charset=utf-8",
            }).done(function (result) {

                var data = JSON.stringify(common.mapHistogram(result.AGE_AT_FIRST_OBSERVATION_HISTOGRAM));
                chartSpec = common.createChartSpec(data,'histogram',300,250,'Age','Person','x','y');
                vegaEmbed('#reportPopulation #ageFirstObservation', chartSpec);

                data = JSON.stringify(common.mapHistogram(result.AGE_AT_FIRST_OBSERVATION_HISTOGRAM));
                chartSpec = common.createChartSpec(data,'histogram',300,250,'Age','Persons','x','y');
                vegaEmbed('#reportPopulation #ageLastObservation', chartSpec);

                data = JSON.stringify(common.dataframeToArray(result.CUMULATIVE_DURATION));
                chartSpec = common.createChartSpec(data,'line',300,250,'Days','Persons','X_LENGTH_OF_OBSERVATION','Y_PERCENT_PERSONS');
                vegaEmbed('#reportPopulation #cumulativeObservation', chartSpec);

                data = JSON.stringify(common.mapHistogram(result.OBSERVATION_LENGTH_HISTOGRAM));
                chartSpec = common.createChartSpec(data,'histogram',300,250,'Days','Persons','x','y');
                vegaEmbed('#reportPopulation #observationLength', chartSpec);

                data = JSON.stringify(common.mapHistogram(result.OBSERVED_BY_YEAR_HISTOGRAM));
                chartSpec = common.createChartSpec(data,'bar',300,250,'Year','Persons','x','y');
                vegaEmbed('#reportPopulation #observationYear', chartSpec);

                data = JSON.stringify(common.dataframeToArray(result.OBSERVED_BY_MONTH));
                chartSpec = common.createChartSpec(data,'line',300,250,'Year','Persons','MONTH_YEAR','COUNT_VALUE');
                vegaEmbed('#reportPopulation #observationMonth', chartSpec);

                data = JSON.stringify(common.dataframeToArray(result.PERSON_PERIODS_DATA));
                chartSpec = common.createChartSpec(data,'bar',300,250,'Observation Periods','Percentage','CONCEPT_NAME','COUNT_VALUE');
                vegaEmbed('#reportPopulation #observationPeriods', chartSpec);
            });

            // Get data from person
            $.ajax({
                type: "GET",
                url:  getUrlFromData(datasource, 'person'),
                contentType: "application/json; charset=utf-8",
            }).done(function (result) {

                var data = JSON.stringify(common.mapHistogram(result.BIRTH_YEAR_HISTOGRAM));
                chartSpec = common.createChartSpec(data,'histogram',800,250,'Year','Person','x','y');
                vegaEmbed('#reportPopulation #birthYearHist', chartSpec);

            });

            // Get data from dashboard
            $.ajax({
                type: "GET",
                url:  getUrlFromData(datasource, 'dashboard'),
                contentType: "application/json; charset=utf-8",
            }).done(function (result) {


                // Age distrubution
                chartSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
                    "data": { "url": "data/example/agedistribution.json"},
                    "width": 18,
                    "transform": [
                        {"filter": "datum.year == 2000"},
                        {"calculate": "datum.sex == 2 ? 'Female' : 'Male'", "as": "gender"}
                    ],
                    "spacing": 10,
                    "mark": "bar",
                    "encoding": {
                        "column": {
                            "field": "age", "type": "ordinal"
                        },
                        "y": {
                            "aggregate": "sum", "field": "people", "type": "quantitative",
                            "axis": {"title": "population", "grid": false}
                        },
                        "x": {
                            "field": "gender", "type": "nominal",
                            "scale": {"rangeStep": 12},
                            "axis": {"title": ""}
                        },
                        "color": {
                            "field": "gender", "type": "nominal",
                            "scale": {"range": ["#EA98D2", "#659CCA"]}
                        }
                    },
                    "config": {
                        "view": {"stroke": "transparent"},
                        "axis": {"domainWidth": 1}
                    }
                }
                vegaEmbed('#reportPopulation #genderAge', chartSpec)

                var data = result.CUMULATIVE_DURATION;
                // Cumulative Observation Time
                var vlSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
                    "description": "Cumulative Observation",
                    "data": data,
                    "mark": "line",
                    "width": 300, "height": 250,
                    "encoding": {
                        "x": {"field": "years", "type": "quantitative", "title": "Years"},
                        "y": {"field": "percentage", "type": "quantitative", "title": "Percent of Population"}
                    }
                }
                vegaEmbed('#reportPopulation #cumulativeObservationTime', vlSpec);

                // Gender Distribution by Age
                chartSpec = {
                    "$schema": "https://vega.github.io/schema/vega/v5.json",
                    "width": 250,"height": 250,
                    "padding": 5,

                    "signals": [
                        { "name": "chartWidth", "value": 200 },
                        { "name": "chartPad", "value": 30 },
                        { "name": "width", "update": "2 * chartWidth + chartPad" },
                        { "name": "year", "value": 2000,
                            "bind": {"input": "range", "min": 1850, "max": 2000, "step": 10} }
                    ],

                    "data": [
                        {
                            "name": "population",
                            "url": "data/example/genderdistribution.json"
                        },
                        {
                            "name": "popYear",
                            "source": "population",
                            "transform": [
                                {"type": "filter", "expr": "datum.year == year"}
                            ]
                        },
                        {
                            "name": "males",
                            "source": "popYear",
                            "transform": [
                                {"type": "filter", "expr": "datum.sex == 1"}
                            ]
                        },
                        {
                            "name": "females",
                            "source": "popYear",
                            "transform": [
                                {"type": "filter", "expr": "datum.sex == 2"}
                            ]
                        },
                        {
                            "name": "ageGroups",
                            "source": "population",
                            "transform": [
                                { "type": "aggregate", "groupby": ["age"] }
                            ]
                        }
                    ],

                    "scales": [
                        {
                            "name": "y",
                            "type": "band",
                            "range": [{"signal": "height"}, 0],
                            "round": true,
                            "domain": {"data": "ageGroups", "field": "age"}
                        },
                        {
                            "name": "c",
                            "type": "ordinal",
                            "domain": [1, 2],
                            "range": ["#1f77b4", "#e377c2"]
                        }
                    ],

                    "marks": [
                        {
                            "type": "text",
                            "interactive": false,
                            "from": {"data": "ageGroups"},
                            "encode": {
                                "enter": {
                                    "x": {"signal": "chartWidth + chartPad / 2"},
                                    "y": {"scale": "y", "field": "age", "band": 0.5},
                                    "text": {"field": "age"},
                                    "baseline": {"value": "middle"},
                                    "align": {"value": "center"},
                                    "fill": {"value": "#000"}
                                }
                            }
                        },
                        {
                            "type": "group",

                            "encode": {
                                "update": {
                                    "x": {"value": 0},
                                    "height": {"signal": "height"}
                                }
                            },

                            "scales": [
                                {
                                    "name": "x",
                                    "type": "linear",
                                    "range": [{"signal": "chartWidth"}, 0],
                                    "nice": true, "zero": true,
                                    "domain": {"data": "population", "field": "people"}
                                }
                            ],

                            "axes": [
                                {"orient": "bottom", "scale": "x", "format": "s"}
                            ],

                            "marks": [
                                {
                                    "type": "rect",
                                    "from": {"data": "females"},
                                    "encode": {
                                        "enter": {
                                            "x": {"scale": "x", "field": "people"},
                                            "x2": {"scale": "x", "value": 0},
                                            "y": {"scale": "y", "field": "age"},
                                            "height": {"scale": "y", "band": 1, "offset": -1},
                                            "fillOpacity": {"value": 0.6},
                                            "fill": {"scale": "c", "field": "sex"}
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            "type": "group",

                            "encode": {
                                "update": {
                                    "x": {"signal": "chartWidth + chartPad"},
                                    "height": {"signal": "height"}
                                }
                            },

                            "scales": [
                                {
                                    "name": "x",
                                    "type": "linear",
                                    "range": [0, {"signal": "chartWidth"}],
                                    "nice": true, "zero": true,
                                    "domain": {"data": "population", "field": "people"}
                                }
                            ],

                            "axes": [
                                {"orient": "bottom", "scale": "x", "format": "s"}
                            ],

                            "marks": [
                                {
                                    "type": "rect",
                                    "from": {"data": "males"},
                                    "encode": {
                                        "enter": {
                                            "x": {"scale": "x", "field": "people"},
                                            "x2": {"scale": "x", "value": 0},
                                            "y": {"scale": "y", "field": "age"},
                                            "height": {"scale": "y", "band": 1, "offset": -1},
                                            "fillOpacity": {"value": 0.6},
                                            "fill": {"scale": "c", "field": "sex"}
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }

                vegaEmbed('#reportPopulation #populationPyramide', chartSpec);
            });
            $('#reportPopulation').show();
        }
        return population;
    });
})();
