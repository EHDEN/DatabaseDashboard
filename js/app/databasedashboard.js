(function () {
	curl([
		"require",
		"jquery",
		"d3",
		"knockout",
		"common",
		"app/reports",
		'text!./app/resources/report-help.json',
		"bootstrap",
		"d3/tip",
		"app/components/modal"
	], function (require, $, d3, ko, common, reports, reportHelp) {
		/* reads the summary data for each report and stores it in a data structure.
		   in index.html the binding to this data structure is made */
		function summaryViewModel() {
			var self = this;

			self.dashboardData = ko.observable();
			self.populationData = ko.observable();
			self.reportHelp = JSON.parse(reportHelp);

			self.datasource = ko.observable({
				name: 'loading...'
			});
			self.datasources = [];

			self.formatSI = function (d, p) {
				if (d < 1) {
					return d3.round(d, p);
				}
				var prefix = d3.formatPrefix(d);
				return d3.round(prefix.scale(d), p) + prefix.symbol;
			}

			self.loadDashboard = function () {
				$.ajax({
					type: "GET",
					url: getUrlFromData(self.datasource(), "dashboard"),
					contentType: "application/json; charset=utf-8",
				}).done(function (result) {
					result.SUMMARY = common.dataframeToArray(result.SUMMARY);
					result.SUMMARY.forEach(function (d, i, ar) {
						if (!isNaN(d.ATTRIBUTE_VALUE))
							d.ATTRIBUTE_VALUE = self.formatSI(d.ATTRIBUTE_VALUE, 2);
					});
					self.dashboardData(result);
				});
			}

			self.loadPopulation = function () {
				$.ajax({
					type: "GET",
					url: getUrlFromData(self.datasource(), "population"),
					contentType: "application/json; charset=utf-8",
				}).done(function (result) {
					result.SUMMARY = common.dataframeToArray(result.SUMMARY);
					result.SUMMARY.forEach(function (d, i, ar) {
						if (!isNaN(d.ATTRIBUTE_VALUE))
							d.ATTRIBUTE_VALUE = self.formatSI(d.ATTRIBUTE_VALUE, 2);
					});
					self.populationData(result);
				});
			}

			//help messages
			self.helpBirthDateOpened = ko.observable(false);

			// modal
			self.modalVisible = ko.observable(false);
			self.modalTitle = ko.observable(null);
			self.modalBody = ko.observable(null);
	
			self.showModal = function(section, key) {
				// Use the key to look up the value
				let helpBlock = self.reportHelp[section][key];
				self.modalTitle(helpBlock.title);
				self.modalBody(helpBlock.body);
				self.modalVisible(true);
			}
		}

		var viewModel = new summaryViewModel();
		page_vm = viewModel;

		curl(["knockout-amd-helpers"], function () {
			ko.amdTemplateEngine.defaultPath = "../templates";
			ko.applyBindings(viewModel);
		});


		// sammy.js renders the page and shows if a route is activated by the report dropdown
		curl(["sammy"], function (Sammy) {
			var app = Sammy(function () {
				this.get('#/:name/dashboard', function (context) {
					$('.report').hide();
					viewModel.datasource(viewModel.datasources.filter(function (d) {
						return d.name == this.params['name'];
					}, this)[0]);
					viewModel.loadDashboard();
					reports.Dashboard.render(viewModel.datasource());
					$('#reportDashboard').show();
					report = 'dashboard';
				});

				this.get('#/:name/population', function (context) {
					$('.report').hide();
					viewModel.datasource(viewModel.datasources.filter(function (d) {
						return d.name == this.params['name'];
					}, this)[0]);
					viewModel.loadDashboard();
					reports.Population.render(viewModel.datasource());
					$('#reportPopulation').show();
					report = 'population';
				});
			});

			// kept for now but data sources pull down is deactivated
			$(function () {
				$.ajax({
					cache: false,
					type: "GET",
					url: datasourcepath,
					contentType: "application/json; charset=utf-8"
				}).done(function (root) {
					viewModel.datasources = root.datasources;

					for (i = 0; i < root.datasources.length; i++) {
						$('#dropdown-datasources').append('<li onclick="setDatasource(' + i + ');">' + root.datasources[i].name + '</li>');
					}
					viewModel.datasource(viewModel.datasources[0]);
					app.run('#/' + viewModel.datasource().name + '/dashboard');
				});

			});
		});
	});
})();

// list of the main json files of the reports
var	simpledata = [ "dashboard","population","observationperiod","person"];

// contains the definition of the drill down json files
var collectionFormats = {
	"conditioneras" : "condition_{id}.json",
	"conditions" 	: "condition_{id}.json",
	"drugeras"		: "drug_{id}.json",
	"drugs"			: "drug_{id}.json",
	"measurements" : "measurement_{id}.json",
	"observations" 	: "observation_{id}.json",
	"procedures"	: "procedure_{id}.json",
	"visits"		: "visit_{id}.json"
}


function getUrlFromData(datasource, name){
	
	if( datasource === undefined ){ 
		console.error("datasource is undefined.");
		return; 
	}
	if ( !collectionFormats.hasOwnProperty(name) && simpledata.indexOf(name) < 0 ){ 
		console.error("'" + name + "' not found in collectionFormats or simpledata.");
		return;
	}
	var parent = "";
	if( datasource.parentUrl !== undefined) parent += datasource.parentUrl+"/";
	var pth = "";
	
	if( datasource.map !== undefined){
		if(datasource.map[name] !== undefined){
			if(datasource.map[name].type !== undefined){
				switch(datasource.map[name].type){
					case 'folder':
					case 'collection':
						if(!collectionFormats.hasOwnProperty(name)){ return; }
						pth += parent + datasource.map[name].url;
						break;									
					case 'service':
					case 'file':
						if(simpledata.indexOf(name) < 0){ return; }
						pth += parent + datasource.map[name].url;
						break;
				}
			}
		}	
	}else if( datasource.url !== undefined){		
		pth += parent + datasource.url + "/" + name;
		if ( simpledata.indexOf(name) >= 0 ) pth += ".json";
	}else if ( datasource.folder !== undefined){
		pth += "data/" + datasource.folder + "/" + name;
		if ( simpledata.indexOf(name) >= 0 ) pth += ".json";
	}else{
		console.error("Could not construct path from map, datasource.url or datasource.folder");
		return;
	}
	
	return pth;
}

function getUrlFromDataCollection(datasource, name, id){
	
	if( datasource === undefined ) return;
	if ( !collectionFormats.hasOwnProperty(name) ) return;
	var parent = "";
	if( datasource.parentUrl !== undefined) parent += datasource.parentUrl+"/";
	var pth = "";
	
	if( datasource.map !== undefined){
		if(datasource.map[name] !== undefined){
			if(datasource.map[name].type !== undefined && (datasource.map[name].type === 'folder' || datasource.map[name].type === 'collection') ){
				if(!collectionFormats.hasOwnProperty(name)){ return; }
				pth += parent + datasource.map[name].url.replace("{id}", id);
			}
		}	
	}else if( datasource.url !== undefined){
		pth += parent+ datasource.url + "/" + name + "/" + collectionFormats[name].replace("{id}", id);
		if ( simpledata.indexOf(name) >= 0 ) pth += ".json";
	}else if ( datasource.folder !== undefined){
		pth += "data/" + datasource.folder + "/" + name + "/" + collectionFormats[name].replace("{id}", id);
	}
	
	return pth;
}



