define(function (require) {

	var reportDashboard = require("./reports/dashboard");
	var reportPopulation = require("./reports/population");

	var module = {
		Dashboard: reportDashboard,
		Population: reportPopulation
	};

	return module;
});
