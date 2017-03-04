queue()
    .defer(d3.json, "/apd/icu")
    // .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
	
	//Clean projectsJson data
	var icuProjects = projectsJson;
	var dateFormat = d3.time.format("%Y%m");
	// var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S")
	icuProjects.forEach(function(d) {
		d["icuadmityyyymm"] = dateFormat.parse(d["icuadmityyyymm"]);
		// d["date_posted"].setDate(1);
		// d["total_donations"] = +d["total_donations"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(icuProjects);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["icuadmityyyymm"]; });
	var hospitalClassDim = ndx.dimension(function(d) { return d["hospitalclassificationid"]; });
	var hopsrcDim = ndx.dimension(function(d) { return d["hosp_srce"]; });
	var hopotcDim = ndx.dimension(function(d) { return d["hosp_outcm"]; });

	var ageDim = ndx.dimension(function(d) { return d["age"]; });
	var sexDim = ndx.dimension(function(d) { return d["sex"]; });
	
	var icuhrsDim = ndx.dimension(function(d) { return d["icu_hrs"]; });
	var icusrcDim = ndx.dimension(function(d) { return d["icu_srce"]; });
	var icuotcDim = ndx.dimension(function(d) { return d["icu_outcm"]; });

	var diedDim = ndx.dimension(function(d) { return d["died_icu"]; });


	//Calculate metrics
	var numProjectsByDate = dateDim.group(); 
	var numProjectsByHopClass = hospitalClassDim.group();
	var numProjectsByHopSrc = hopsrcDim.group();
	var numProjectsByHopOut = hopotcDim.group(); 

	var numProjectsByAge = ageDim.group();
	var numProjectsBySex = sexDim.group();

	var numProjectsByIcuHrs = icuhrsDim.group(); 
	var numProjectsByIcuSrc = icusrcDim.group();
	var numProjectsByIcuOut = icuotcDim.group();

	var numProjectsByDie = diedDim.group();

	// var totalDonationsByState = stateDim.group().reduceSum(function(d) {
	// 	return d["total_donations"];
	// });

	var all = ndx.groupAll();
	// var totalDonations = ndx.groupAll().reduceSum(function(d) {return d["total_donations"];});

	// var max_state = totalDonationsByState.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["icuadmityyyymm"];
	var maxDate = dateDim.top(1)[0]["icuadmityyyymm"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var totalDonationsND = dc.numberDisplay("#total-donations-nd");

	numberProjectsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	totalDonationsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalDonations)
		.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);

	resourceTypeChart
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .xAxis().ticks(4);

	povertyLevelChart
		.width(300)
		.height(250)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .xAxis().ticks(4);


	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalDonationsByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Donations: " + Math.round(p["value"]) + " $";
		})

    dc.renderAll();

};