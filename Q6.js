
d3.dsv(";", "data/data_ggsheet.csv").then(data => {
    const svgId = "#chart-Q6";
    d3.select(svgId).selectAll("*").remove();

    data = data.map(d => ({
        date: d.thoi_gian_tao_don.split(' ')[0],
        hour: d.thoi_gian_tao_don.split(' ')[1].split(':')[0],
        revenue: +d.thanh_tien
    }));

    const revenueByDayHour = d3.rollups(
        data,
        v => d3.sum(v, d => d.revenue),
        d => d.date,
        d => d.hour
    );

    const revenueByHour = new Map();
    revenueByDayHour.forEach(([_, hours]) => {
        hours.forEach(([hour, totalRevenue]) => {
            if (!revenueByHour.has(hour)) revenueByHour.set(hour, []);
            revenueByHour.get(hour).push(totalRevenue);
        });
    });

    const transformedData = Array.from(revenueByHour, ([hour, values]) => ({
        hour: `${hour}:00-${hour}:59`,
        revenue: d3.mean(values) || 0,
        hourNum: +hour
    })).sort((a, b) => a.hourNum - b.hourNum);

    const margin = { top: 50, right: 50, bottom: 100, left: 100 },
          width = 1200 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(transformedData.map(d => d.hour)).range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, d3.max(transformedData, d => d.revenue) || 1]).range([height, 0]);
    const colorScale = d3.scaleOrdinal(d3.schemeSet2);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("border", "1px solid black")
        .style("visibility", "hidden");

    function showTooltip(event, d) {
        tooltip.style("visibility", "visible")
            .html(`<strong>Khung giờ:</strong> ${d.hour}<br>
                   <strong>Doanh số bán TB:</strong> ${d3.format(",.0f")(d.revenue)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.style("visibility", "hidden");
    }

    svg.selectAll(".bar")
        .data(transformedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.hour))
        .attr("y", d => yScale(d.revenue))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.revenue))
        .attr("fill", d => colorScale(d.hour))
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.hour) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.revenue) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d3.format(".1f")(d.revenue / 1e3) + "K");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .attr("dy", "10px");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(7).tickFormat(d => `${d / 1e3}K`));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Doanh số bán hàng trung bình theo Khung giờ");

}).catch(console.error);
