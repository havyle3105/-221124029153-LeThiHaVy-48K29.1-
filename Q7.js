
d3.dsv(";", "data/data_ggsheet.csv").then(data => {
    const svgId = "#chart-Q7";
    d3.select(svgId).selectAll("*").remove();

    const totalOrders = new Set(data.map(d => d.ma_don_hang)).size;
    const groupedData = d3.rollups(data, v => new Set(v.map(d => d.ma_don_hang)).size, d => `[${d.ma_nhom_hang}] ${d.ten_nhom_hang}`);
    
    const transformedData = groupedData.map(([nhom_hang, count]) => ({ nhom_hang, xac_suat_ban: count / totalOrders }))
        .sort((a, b) => b.xac_suat_ban - a.xac_suat_ban);

    const margin = { top: 50, right: 50, bottom: 50, left: 250 },
          width = 1200 - margin.left - margin.right,
          height = transformedData.length * 30;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, d3.max(transformedData, d => d.xac_suat_ban) || 1]).range([0, width]);
    const yScale = d3.scaleBand().domain(transformedData.map(d => d.nhom_hang)).range([0, height]).padding(0.2);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    
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
            .html(`<strong>Nhóm hàng:</strong> ${d.nhom_hang}<br>
                <strong>Xác suất bán:</strong> ${d3.format(".1%")(d.xac_suat_ban)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() { tooltip.style("visibility", "hidden"); }

    svg.selectAll(".bar")
        .data(transformedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.nhom_hang))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.xac_suat_ban))
        .attr("fill", d => colorScale(d.nhom_hang))
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.xac_suat_ban) + 5)
        .attr("y", d => yScale(d.nhom_hang) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .style("font-size", "12px")
        .text(d => d3.format(".1%") (d.xac_suat_ban));

    svg.append("g").call(d3.axisLeft(yScale));
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".0%")));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xác suất bán hàng theo Nhóm hàng");
}).catch(console.error);
