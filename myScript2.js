function openSection(evt, name) {
		var i, tabcontent, tablinks;

		// Get all elements with class="tabcontent" and hide them
		tabcontent = document.getElementsByClassName("tabcontent");
		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = "none";
		}

		// Get all elements with class="tablinks" and remove the class "active"
		tablinks = document.getElementsByClassName("tablinks");
		for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
			//tablinks[i].classList.remove("active");
		}


		// Show the current tab, and add an "active" class to the button that opened the tab
		document.getElementById(name).style.display = "block";
		//evt.currentTarget.classList.add("active");
    	evt.currentTarget.className += " active";
	}

d3.csv("Data/bymonth.csv")
  .row(function(d) { return {
  						month: d.MONTH,
  						arr_delay: +d.ARRIVAL_DELAY,
  						airport: d.ORIGIN_AIRPORT,
	  					airline: d.AIRLINE,
	  					count: +d.count

  };})
  .get(function(error, data) {
		byMonth(data);
})

d3.csv("Data/byDayOfWeek.csv")
  .row(function(d) { return {
  						dayOfWeek: d.DAY_OF_WEEK,
  						arr_delay: +d.ARRIVAL_DELAY,
  						dep_delay: +d.DEPARTURE_DELAY,
	  					count: +d.count
  };})
  .get(function(error, data) {
  		byDayOfWeek(data);
  })

d3.csv("Data/byAirline.csv")
  .row(function(d) { return {
  						airline: d.AIRLINE,
  						arr_delay: +d.ARRIVAL_DELAY,
  						dep_delay: +d.DEPARTURE_DELAY
  };})
  .get(function(error, data) {
  		byAirline(data)
  })

d3.csv("Data/reason.csv")
  .row(function(d) { return {
  						reason: d.reason,
  						percentage: +d.percentage
  }})
  .get(function(error, data) {
  		byReason(data)
  })

d3.queue()
	.defer(d3.json, "Data/us.json")
	.defer(d3.csv, "Data/byAirports.csv")
	.await(function(error, geo_data, data) {
		byAirport(geo_data, data)
	})



// d3.csv("Data/byAirports.csv")
// 	.get(function (error, data) {
// 		byAirport(data)
// 	})


function byMonth(d) {
		var data = d;
		var svg_height = 500;
		var svg_width = 500;
		var margin = {top: 20, right:  20, bottom: 30, left: 40};
		var height = svg_height - margin.top - margin.bottom;
		var width = svg_width - margin.left - margin.right;

		function process_data(data) {
            var count = d3.sum(data, function(d) { return d.count; });
			var arr_delay = d3.sum(data, function(d) { return d.arr_delay*d.count})/count;
			return {
				'count': count,
				'arr_delay': arr_delay
			};
		}



		var selection = d3.select("#Time").append("svg")
			.attr("class", "parameter")
			.attr("width", 230)
			.attr("height", height)
			.attr("transform", "translate("+margin.left+", "+margin.top+")");

		var airlines = d3.nest()
			.key(function(d) { return d.airline; })
			.entries(data);

		console.log(airlines);

		selection.selectAll(".rect")
			.data(airlines)
			.enter()
			.append("rect")
			.attr("class", "rect")
			.attr("x", 0)
			.attr("y", function(d, i) { return 30*i; })
			.attr("width", 200)
			.attr("height", 20)
			.on("click", function (d) {
				console.log(d);
				return plotBar(d.key);
            });

		selection.selectAll(".text")
			.data(airlines)
			.enter()
			.append("text")
			.attr("class", "text")
			.attr("x", 0)
			.attr("y", function(d, i) { return 30*i+15; })
			.text(function(d) { return d.key; })
	
		function plotBar(filter) {

			var data = data.filter(function(d) { return d.airline = filter; });

            var all_data = d3.nest()
                .key(function (d) { return d.month; })
                .rollup(function(d) { return process_data(d); })
                .entries(data);

            var svg = d3.select("#Time").append("svg")
                .attr("class", "byMonth")
                .attr("width", svg_width)
                .attr("height", svg_height);


            var g = svg.append("g")
                .attr("transform", "translate(" +margin.left+ "," + margin.top +")");

            var max_arr = d3.max(all_data, function(d) { return d.value.arr_delay; });

            var min_arr = d3.min(all_data, function(d) { return d.value.arr_delay; });

            var y = d3.scaleLinear().domain([min_arr, max_arr]).range([height, 0]);
            var x = d3.scaleBand()
                .domain(all_data.map(function(d) { return d.key; }))
                .rangeRound([0, width]).padding(1);

            console.log(all_data);
            //console.log(process_data(data));
            g.append("g")
                .attr("class", "axis axis-x")
                .attr("transform", "translate("+ 10 + "," + height + ")")
                .call(d3.axisBottom(x));

            g.append("g")
                .attr("class", "axis axis-y")
                .call(d3.axisLeft(y));

            var tooltip = d3.select("#Time").append("g")
                .attr("class", "tooltip")
                .style("display", "none");

            g.selectAll(".bar")
                .data(all_data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d, i) { return x(d.key); })
                .attr("y", function(d, i) { if (y(d.value.arr_delay)<y(0)) { return y(d.value.arr_delay); }
                else { return y(0); }})
                .attr("width", 20)
                .attr("height", function(d, i) { return Math.abs(y(0)-y(d.value.arr_delay)); })
                .on("mouseover", function(d) {
                    tooltip
                        .style("left", d3.event.pageX - 70 + "px")
                        .style("top", y(d.value.arr_delay)+120 + "px")
                        .style("display", "block")
                        .html("<b>"+d.key+"</b><br>Arrival delay: " + Math.round(d.value.arr_delay*100)/100 + " minutes");

                })
                .on("mouseout", function() { tooltip.style("display", "none"); });

        }



}

function byDayOfWeek(data) {
		var svg_height = 500;
		var svg_width = 600;
		var margin = {top: 20, right:  20, bottom: 30, left: 40};
		var height = svg_height - margin.top - margin.bottom;
		var width = svg_width - margin.left - margin.right;

		var svg = d3.select("#Time").append("svg")
				.attr("class", "byDayOfWeek")
				.attr("width", svg_width)
				.attr("height", svg_height);

		var g = svg.append("g")
					.attr("transform", "translate(" +margin.left+ "," + margin.top +")");

		var y = d3.scaleLinear().domain([0, d3.max(data, function(d) { return d.arr_delay; })]).range([height, 0]);
		var x = d3.scaleBand()
					.domain(data.map(function(d) { return d.dayOfWeek; }))
					.rangeRound([0, width]).padding(1);

		g.append("g")
			.attr("class", "axis axis-x")
			.attr("transform", "translate("+ 10 + "," + height + ")")
			.call(d3.axisBottom(x));

		g.append("g")
			.attr("class", "axis axis-y")
            .attr("transform", "translate("+ 40 + ",0)")
			.call(d3.axisLeft(y));

		var tooltip = d3.select("#Time").append("g")
			.attr("class", "tooltip")
			.style("display", "none");


		g.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d, i) { return x(d.dayOfWeek); })
			.attr("y", function(d, i) { return y(d.arr_delay); })
			.attr("width", 40)
			.attr("height", function(d, i) { return height-y(d.arr_delay); })
            .on("mouseover", function(d) {
                tooltip
                    .style("left", d3.event.pageX - 70 + "px")
                    .style("top", y(d.arr_delay)+120 + "px")
                    .style("display", "block")
                    .html("<b>"+d.dayOfWeek+"</b><br>Arrival delay: " + Math.round(d.arr_delay*100)/100 + " minutes");

            })
            .on("mouseout", function() { tooltip.style("display", "none"); });

}


function byAirline(data) {
		var svg_height = 600;
		var svg_width = 1000;
		var margin = {top: 20, right:  20, bottom: 50, left: 40};
		var height = svg_height - margin.top - margin.bottom;
		var width = svg_width - margin.left - margin.right;

		var svg = d3.select("#Airlines").append("svg")
				.attr("class", "byAirline")
				.attr("width", svg_width)
				.attr("height", svg_height);

		var g = svg.append("g")
					.attr("transform", "translate(" +margin.left+ "," + margin.top +")");

		
		var max_arr = d3.max(data, function(d) { return d.arr_delay; });
		var min_arr = d3.min(data, function(d) { return d.arr_delay; });

		var y = d3.scaleLinear()
				.domain(d3.extent(data, function(d) { return d.arr_delay; }))
				.range([height, 0]);

		var x = d3.scaleBand()
					.domain(data.map(function(d) { return d.airline; }))
					.rangeRound([0, width]).padding(1);

		g.append("g")
			.attr("class", "axis axis-x")
			.attr("transform", "translate("+ 10 + "," + height + ")")
			.call(d3.axisBottom(x))
			.selectAll("text")
			.attr("transform", "translate(0," + 10 + ")")
            .attr("transform", "rotate(-15)");

		g.append("g")
			.attr("class", "axis axis-y")
			.call(d3.axisLeft(y));

		var tooltip = d3.select("#Airlines").append("g")
			.attr("class", "tooltip")
			.style("display", "none");
						

		g.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d, i) { return x(d.airline); })
			.attr("y", function(d, i) { if (y(d.arr_delay)<y(0)) { return y(d.arr_delay); }
												else { return y(0); }})
			.attr("width", 50)
			.attr("height", function(d, i) { return Math.abs(y(0)-y(d.arr_delay)); })
            .on("mouseover", function(d) {
                tooltip
                    .style("left", d3.event.pageX - 70 + "px")
                    .style("top", y(d.arr_delay)+120 + "px")
                    .style("display", "block")
                    .html("<b>"+d.airline+"</b><br>Arrival delay: " + Math.round(d.arr_delay*100)/100 + " minutes");

            })
            .on("mouseout", function() { tooltip.style("display", "none"); });



}



function byReason(data) {

		var svg_height = 700;
		var svg_width = 700;
		var margin = {top: 20, right:  20, bottom: 30, left: 40};
		var legendWidth = 200;
		var height = svg_height - margin.top - margin.bottom;
		var width = svg_width - margin.left - margin.right - legendWidth;


		var svg = d3.select("#Reason").append("svg")
				.attr("class", "byReason")
				.attr("width", svg_width)
				.attr("height", svg_height);

		var g = svg.append("g")
					.attr("transform", "translate(" +width/2 + ","+height/2+")");

		var radius = Math.min(height, width)/2;
		var arc = d3.arc().innerRadius(0).outerRadius(radius);
		var pie = d3.pie().sort(null).value(function(d) { return d.percentage; });
		var color = d3.scaleOrdinal(["#a1d99b", "#98abc5", "#8a89a6", "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#7b6888"]);

		var tooltip = d3.select("#Reason").append("g")
			.attr("class", "tooltip")
			.style("display", "none");

		g.selectAll("path")
			.data(pie(data))
			.enter()
			.append("path")
			.attr("class", "pie")
			.attr("d", arc)
			.attr("fill", function(d) { return color(d.data.reason); })
			.on("mouseover", function(d) {
				tooltip
				.style("left", d3.event.pageX + "px")
				.style("top", d3.event.pageY + "px")
				.style("display", "block")
				.html(d.data.reason + " " + Math.round(d.data.percentage*100*100)/100 + "%");

			})
		 	.on("mouseout", function() { tooltip.style("display", "none"); });



		var legendRectSize = 18;
		var legendSpacing = 4;
		var legend = g.selectAll('.legend')
					.data(color.domain())
					.enter()
					.append('g')
					.attr("class", "legend")
					.attr("transform", function(d, i) {
						var height = legendRectSize + legendSpacing;
						var offset = height * color.domain().length / 2;
						var horz = width/2 + 50;
						var vert = i * height - offset;
						return "translate(" + horz + ", " + vert + ")";
					})

		legend.append("rect")
				.attr("width", legendRectSize)
				.attr("height", legendRectSize)
				.attr("fill", color)
				.attr("stroke", color)

		legend.append("text")
				.attr("x", legendRectSize + legendSpacing)
				.attr("y", legendRectSize - legendSpacing)
				.text(function(d) { return d; });



}

function byAirport(geo_data, data) {
    var svg_height = 800;
    var svg_width = 1400;
    var legend_width = 150;
    var legend_width_circle = 130;
    var legend_margin = 10;
    var legend_height = 190;
    var margin = {top: 20, right:  20, bottom: 30, left: 40};
    var legendCircleSize = 20;
    var legendSpacing = 4;
    var legendtop = 200;
    var legendleft = svg_width - margin.left - width;
    var legendWidth = 200;
    var height = svg_height - margin.top - margin.bottom;
    var width = svg_width - margin.left - margin.right - legend_width;


    var svg = d3.select("#Map").append("svg")
        .attr("class", "map")
        .attr("width", svg_width)
        .attr("height", svg_height);

    var projection = d3.geoAlbers()
        .translate([width/2, 300])    // translate to center of screen
        .scale([1400]);

    var path = d3.geoPath().projection(projection);

    svg.append("path")
		.datum(topojson.feature(geo_data, geo_data.objects.states))
		.attr("class", "states")
		.attr("d", path);


    var radius = d3.scaleSqrt()
        .domain(d3.extent(data, function(d) { return +d.num; }))
        .range([0, 30]);

    // var color_scale = d3.scaleQuantize()
		// .domain(d3.extent(data, function(d) {return +d.arr_delay; }))
		// .range(['#90B5DE','#5B728C','#1F2730']);

    var color_scale = d3.scaleThreshold()
		.domain([0, 5, 10, 15])
		.range(['#bebade', '#9a9bde', '#8876de', '#4336de', '#5a02de']);

    var tooltip = d3.select("#Map").append("g")
		.attr("class", "tooltip")
		.style("display", "none");

    console.log(d3.extent(data, function(d) {return +d.arr_delay; }))
    svg.append("g").selectAll(".circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", function(d) { return projection([+d.long, +d.lat])[0]; })
        .attr("cy", function(d) { return projection([+d.long, +d.lat])[1]; })
        .attr("r", function(d) { return radius(+d.num); })
		.style("fill", function(d) { return color_scale(+d.arr_delay); })
		.on("mouseover", function (d) {
			tooltip.style("left", d3.event.pageX+"px")
				.style("top", d3.event.pageY+"px")
				.style("display", "block")
				.html("<b>"+d.airport +"</b><br>State: "+d.state+"<br>City: "+d.city+
					"<br>Number of Flight: "+d.num
				+ "<br>Average Delay: "+Math.round(d.arr_delay*100)/100+" mins");
        })
		.on("mouseout", function () {
			tooltip.style("display", "none");
        })



	var legendCircle = svg.append("g")
        .attr("class", "legend")
		.attr("transform", "translate("+width+","+margin.top+")");

	legendCircle
		.append("rect")
		.attr("class", "box")
		.attr("x", 0)
		.attr("y", 30)
		.attr("width", legend_width_circle)
		.attr("height", legend_height);



	var legend_data = [50000, 150000, 250000, 350000];
	var color_legend_data = [0, 5, 10, 15];

	legendCircle.selectAll(".circle")
		.data(legend_data)
		.enter()
		.append("circle")
		.attr("class", "circle")
		.attr("cx", 40)
		.attr("cy", 45)
		.attr("r", function (d, i) {
			return radius(d);
        })
        .attr("transform", function (d, i) {
            var height = radius(d)*2;
            var vert = (height*i*0.8);
            return "translate(0, "+vert+")"
        });

	legendCircle.selectAll("text")
		.data(legend_data)
		.enter()
		.append("text")
		.attr("class", "text")
		.attr("x", legend_width_circle*2/3)
		.attr("y", 55)
        .attr("transform", function (d, i) {
            var height = radius(d)*2;
            var vert = (height*i*0.8);
            return "translate(0, "+vert+")"
        })
		.text(function (d) {
			return (d/1000) + "k";
        });

    legendCircle.selectAll(".title")
        .data(["Num. of Incoming Flight"])
        .enter()
        .append("text")
        .attr("class", ".title")
        .attr("x", 0)
        .attr("y", 20)
        .text(function (d) {
            return d;
        });


	var move = legend_height + margin.top*4;
    var legendColor = svg.append("g")
        .attr("class", "legend")
        .attr("transform",  "translate("+width+","+move+")");



    legendColor
        .append("rect")
        .attr("class", "box")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", legend_width)
        .attr("height", legend_height);

    var legendRadius = 15;
    var legendSpacing = 6;


    var titleHeight = 20;
    legendColor.selectAll(".circle")
        .data([-5, 0, 5, 10, 15])
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", legend_margin+legendRadius)
        .attr("cy", titleHeight+legend_margin)
        .attr("r", legendRadius)
        .attr("transform", function (d, i) {
        	var height = legendRadius*2 + legendSpacing;
        	var vert = height*i + legendSpacing + titleHeight;
            return "translate(0, "+vert+")"
        })
		.style("fill", function (d) {
			return color_scale(d);
        });

    legendColor.selectAll(".title")
		.data(["Average Delay"])
		.enter()
		.append("text")
		.attr("class", ".title")
		.attr("x", 20)
		.attr("y", 20)
		.text(function (d) {
			return d;
        });

    legendColor.selectAll(".text")
		.data(["-15 ~ 0", "0 ~ 5", "5 ~ 10", "10 ~ 15", ">15"])
		.enter()
		.append("text")
		.attr("x", 50)
		.attr("y", 35)
		.text(function (d) {
			return d+" mins";
        })
        .attr("transform", function (d, i) {
            var height = legendRadius*2 + legendSpacing;
            var vert = height*i + legendSpacing + titleHeight;
            return "translate(0, "+vert+")"
        })

}
