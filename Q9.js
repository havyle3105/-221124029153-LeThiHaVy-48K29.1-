
d3.dsv(";", "data/data_ggsheet.csv").then(data => {
    const svgId = "#chart-Q9";
    d3.select(svgId).selectAll("*").remove();

    data = data.map(d => ({
        category: `[${d.ma_nhom_hang}] ${d.ten_nhom_hang}`,
        item: `[${d.ma_mat_hang}] ${d.ten_mat_hang}`,
        order_id: d.ma_don_hang
    }));

    const totalOrdersByCategory = d3.rollups(
        data, 
        v => new Set(v.map(d => d.order_id)).size, 
        d => d.category
    );
    
    const groupedData = d3.rollups(
        data, 
        v => new Set(v.map(d => d.order_id)).size, 
        d => d.category, 
        d => d.item
    );

    let transformedData = [];
    groupedData.forEach(([category, items]) => {
        const totalOrders = totalOrdersByCategory.find(d => d[0] === category)[1];
        items.forEach(([item, count]) => {
            transformedData.push({ category, item, probability: count / totalOrders });
        });
    });

    const topCategories = ["[BOT] Bột", "[SET] Set trà", "[THO] Trà hoa"];
    const categories = [
        ...topCategories, 
        ...[...new Set(transformedData.map(d => d.category))]
            .filter(c => !topCategories.includes(c))
    ];

    const numCols = 3, numRows = 2;
    const margin = { top: 80, right: 50, bottom: 50, left: 200 };
    const width = 1700 - margin.left - margin.right;
    const heightPerChart = 200;
    const rowGap = 70, colGap = 250;
    const totalHeight = numRows * heightPerChart + (numRows - 1) * rowGap;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", totalHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("border", "1px solid black")
        .style("visibility", "hidden")
        .style("font-size", "14px");

    function showTooltip(event, d) {
        tooltip.style("visibility", "visible")
            .html(`<strong>Mặt hàng:</strong> ${d.item}<br>
                 <strong>Xác suất bán:</strong> ${d3.format(".1%") (d.probability)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.style("visibility", "hidden");
    }

    categories.forEach((category, index) => {
        const categoryData = transformedData
            .filter(d => d.category === category)
            .sort((a, b) => b.probability - a.probability);
        
        const row = Math.floor(index / numCols);
        let col = index % numCols;
        if (row === 1 && categories.length % numCols !== 0) col = index - numCols;

        const yOffset = row * (heightPerChart + rowGap);
        const xOffset = col * (1000 / numCols + colGap);

        const group = svg.append("g").attr("transform", `translate(${xOffset}, ${yOffset})`);

        const yScale = d3.scaleBand()
            .domain(categoryData.map(d => d.item))
            .range([0, heightPerChart])
            .padding(0.2);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(categoryData, d => d.probability)])
            .range([0, 800 / numCols]);
        
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        group.selectAll(".bar")
            .data(categoryData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.item))
            .attr("height", yScale.bandwidth())
            .attr("width", d => xScale(d.probability))
            .attr("fill", d => colorScale(d.item))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

        group.selectAll(".label")
            .data(categoryData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.probability) + 5)
            .attr("y", d => yScale(d.item) + yScale.bandwidth() / 2)
            .attr("dy", ".35em")
            .style("font-size", "14px")
            .text(d => d3.format(".1%") (d.probability));

        group.append("text")
            .attr("x", (800 / numCols) / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(category);

        group.append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text").style("font-size", "14px");

        group.append("g")
            .attr("transform", `translate(0,${heightPerChart})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".0%")))
            .selectAll("text").style("font-size", "14px");
    });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng");
}).catch(console.error);
