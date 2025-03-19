
d3.dsv(";", "data/data_ggsheet.csv").then(data => { 
    const svgId = "#chart-Q2";
    d3.select(svgId).selectAll("*").remove();

    data = data.map(d => ({
        category: `[${d.ma_nhom_hang}] ${d.ten_nhom_hang}`,
        revenue: +d.thanh_tien
    }));

    const revenueByCategory = d3.rollup(data, v => d3.sum(v, d => d.revenue), d => d.category);
    const transformedData = Array.from(revenueByCategory, ([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    const margin = { top: 50, right: 400, bottom: 50, left: 350 },
          width = 1400 - margin.left - margin.right,
          height = transformedData.length * 30;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.revenue) || 1])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(transformedData.map(d => d.category))
        .range([0, height])
        .padding(0.1);

    const colorScale = d3.scaleOrdinal(d3.schemeSet2);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px 10px")
        .style("border", "1px solid #000")
        .style("border-radius", "5px")
        .style("visibility", "hidden")
        .style("font-size", "14px");

    svg.selectAll(".bar")
        .data(transformedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.category))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.revenue))
        .attr("fill", d => colorScale(d.category))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`<strong>Nhóm hàng:</strong> ${d.category}<br>
                          <strong>Doanh số bán:</strong> ${d3.format(",.0f")(d.revenue)}`);
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.revenue) + 5)
        .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .style("font-size", "14px")
        .text(d => d3.format(",.0f")(d.revenue / 1_000_000) + " triệu VND");

    svg.append("g").call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d3.format(",.0f")(d / 1_000_000) + "M"))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Doanh số bán hàng theo Nhóm hàng");
}).catch(console.error);
