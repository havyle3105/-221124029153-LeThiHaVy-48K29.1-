
d3.dsv(";", "data/data_ggsheet.csv").then(data => { 
    const svgId = "#chart-Q3";
    d3.select(svgId).selectAll("*").remove();

    data = data.map(d => ({
        month: `Tháng ${String(new Date(d.thoi_gian_tao_don).getMonth() + 1).padStart(2, '0')}`,
        revenue: +d.thanh_tien
    }));

    const revenueByMonth = d3.rollups(data, v => d3.sum(v, d => d.revenue), d => d.month)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

    const margin = { top: 50, right: 50, bottom: 50, left: 100 },
          width = 1200 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(revenueByMonth.map(d => d.month))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(revenueByMonth, d => d.revenue) || 1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeSet2);

    svg.selectAll(".bar")
        .data(revenueByMonth)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.month))
        .attr("y", d => yScale(d.revenue))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.revenue))
        .attr("fill", d => colorScale(d.month))
        .on("mouseover", (event, d) => tooltip.style("visibility", "visible")
            .html(`<strong>Tháng:</strong> ${d.month}<br>
                <strong>Doanh số:</strong> ${d3.format(",.0f")(d.revenue)}`))
        .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px"))
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg.selectAll(".label")
        .data(revenueByMonth)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.month) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.revenue) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text(d => d3.format(",.0f")(d.revenue / 1_000_000) + " triệu VND");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text").attr("dy", "10px");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(7).tickFormat(d => d3.format(",.0f")(d / 1_000_000) + "M"));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Doanh số bán hàng theo Tháng");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px 10px")
        .style("border", "1px solid #000")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

}).catch(console.error);
