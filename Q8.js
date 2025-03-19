
d3.dsv(";", "data/data_ggsheet.csv").then(data => {
    const svgId = "#chart-Q8";
    d3.select(svgId).selectAll("*").remove();

    data = data.map(d => ({
        month: `Tháng ${String(new Date(d.thoi_gian_tao_don).getMonth() + 1).padStart(2, '0')}`,
        order_id: d.ma_don_hang,
        category: `[${d.ma_nhom_hang}] ${d.ten_nhom_hang}`
    }));

    const monthlyOrders = d3.rollups(
        data,
        v => new Set(v.map(d => d.order_id)).size,
        d => d.month
    );

    const groupedData = d3.rollups(
        data,
        v => new Set(v.map(d => d.order_id)).size,
        d => d.month,
        d => d.category
    );

    let transformedData = [];
    groupedData.forEach(([month, categories]) => {
        const totalOrders = monthlyOrders.find(d => d[0] === month)[1];
        categories.forEach(([category, count]) => {
            transformedData.push({ month, category, probability: count / totalOrders });
        });
    });

    const monthList = [...new Set(transformedData.map(d => d.month))]
        .sort((a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]));

    const margin = { top: 50, right: 150, bottom: 50, left: 100 },
          width = 1200 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
        .domain(monthList)
        .range([0, width])
        .padding(0.5);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.probability) || 1])
        .range([height, 0]);

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
            .html(`<strong>Tháng:</strong> ${d.month}<br>
                <strong>${d.category}:</strong> ${d3.format(".1%") (d.probability)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.style("visibility", "hidden");
    }

    const categories = [...new Set(transformedData.map(d => d.category))];

    categories.forEach(category => {
        const categoryData = transformedData.filter(d => d.category === category);

        const line = d3.line()
            .x(d => xScale(d.month))
            .y(d => yScale(d.probability))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(categoryData)
            .attr("fill", "none")
            .attr("stroke", colorScale(category))
            .attr("stroke-width", 2)
            .attr("d", line);

        const safeCategory = category.replace(/[^a-zA-Z0-9-]/g, "");

        svg.selectAll(`.dot-${safeCategory}`)
            .data(categoryData)
            .enter()
            .append("circle")
            .attr("class", `dot-${safeCategory}`)
            .attr("cx", d => xScale(d.month))
            .attr("cy", d => yScale(d.probability))
            .attr("r", 5)
            .attr("fill", colorScale(category))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
    });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".0%")));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

    const legend = svg.append("g").attr("transform", `translate(${width + 12}, 20)`);

    categories.forEach((category, i) => {
        const legendItem = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale(category));
        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(category)
            .style("font-size", "12px");
    });
}).catch(console.error);
