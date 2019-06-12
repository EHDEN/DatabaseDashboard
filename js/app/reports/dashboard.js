(function () {
    define(["jquery", "d3", "jnj/chart", "common", "datatables"], function ($, d3, jnj_chart, common) {
        var dashboard = {};
        var threshold;

        dashboard.render = function (datasource) {

            $('#reportDashboard svg').remove();
            console.log("DD: " + datasource.folder + "/" + datasource.name);
            $.ajax({
                type: "GET",
                url:  getUrlFromData(datasource, 'dashboard'),
                contentType: "application/json; charset=utf-8",
            }).done(function (result) {

                // Birthdate
                var data = JSON.stringify(common.mapHistogram(result.BIRTH_YEAR_HISTOGRAM));
                var chartSpec = common.createChartSpec(data,'histogram',800,250,'Year','Person','x','y');
                vegaEmbed('#reportDashboard #birthYearHist', chartSpec);

                // Gender distribution
                chartSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
                    "data": { "url": "data/example/genderdistribution.json"},
                    "transform": [
                        {"filter": "datum.year == 2000"},
                        {"calculate": "datum.sex == 2 ? 'Female' : 'Male'", "as": "gender"}
                    ],
                    "width": 300, "height": 250,
                    "mark": "bar",
                    "encoding": {
                        "y": {
                            "aggregate": "sum", "field": "people", "type": "quantitative",
                            "axis": {"title": "population"},
                            "stack":  "normalize"
                        },
                        "x": {
                            "field": "age", "type": "ordinal",
                            "scale": {"rangeStep": 17}
                        },
                        "color": {
                            "field": "gender", "type": "nominal",
                            "scale": {"range": ["#EA98D2", "#659CCA"]}
                        }
                    }
                }
                vegaEmbed('#reportDashboard #genderAge', chartSpec)

                // Data Density
                chartSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
                    "width": 300, "height": 250,
                    "data": {"url": "data/example/newdatadensity.json"},
                    "mark": "area",
                    "encoding": {
                        "x": {
                            "timeUnit": "yearmonth", "field": "date", "type": "temporal",
                            "axis": {"domain": false, "format": "%Y", "tickSize": 0}
                        },
                        "y": {
                            "aggregate": "sum", "field": "count","type": "quantitative",
                            "axis": null,
                            "stack": "center"
                        },
                        "color": {"field":"domain", "type":"nominal", "scale":{"scheme": "category20b"}}
                    }
                }
                vegaEmbed('#reportDashboard #DataDensity', chartSpec);

                // Mapping Status
                chartSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
                    "data": {"url": "data/example/mappingstatus.json"},
                    "width": 250, "height": 250,
                    "resolve": {"scale": {"color": "independent"}},
                    "layer": [
                        {"mark": "bar",
                            "encoding": {
                                "x": {"aggregate": "sum", "field": "percentage", "type": "quantitative", "stack": "zero", "title": "percentage"},
                                "y": {"field": "domain", "type": "nominal"},
                                "color": {"field": "vocabulary", "type": "nominal"}}
                        },
                    ]
                }
                vegaEmbed('#reportDashboard #mappingStatus', chartSpec);
                $('#reportDashboard').show();
            });
        }
        return dashboard;
    });
})();
