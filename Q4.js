
d3.dsv(";", "data/data_ggsheet.csv").then(data => {
    const svgId = "#chart-Q4";
    d3.select(svgId).html("");

    const parseDate = d => d3.timeParse("%m/%d/%Y %H:%M")(d) || d3.timeParse("%d/%m/%Y %H:%M")(d);
    const weekdayOrder = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

    data = data.map(d => {
        const date = parseDate(d.thoi_gian_tao_don);
        return {
            dateOnly: date?.toISOString().split('T')[0] || null,
            weekday: date?.toLocaleDateString('vi-VN', { weekday: 'long' }) || "Không xác định",
            revenue: +d.thanh_tien || 0
        };
    }).filter(d => weekdayOrder.includes(d.weekday));

    const revenueByDate = d3.rollup(data, v => d3.sum(v, d => d.revenue), d => d.dateOnly);
    const revenueByWeekday = new Map();
    revenueByDate.forEach((total, date) => {
        const weekday = new Date(date).toLocaleDateString('vi-VN', { weekday: 'long' });
        revenueByWeekday.set(weekday, [...(revenueByWeekday.get(weekday) || []), total]);
    });

    const revenueArray = Array.from(revenueByWeekday, ([weekday, revenues]) => ({
        weekday,
        avgRevenue: d3.mean(revenues) || 0
    })).sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

    const margin = { top: 50, right: 50, bottom: 50, left: 100 },
          width = 1200 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(weekdayOrder).range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, d3.max(revenueArray, d => d.avgRevenue) || 1]).range([height, 0]);
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
            .html(`<strong>Ngày:</strong> ${d.weekday}<br>
                <strong>Doanh số:</strong> ${d3.format(",.0f")(d.avgRevenue)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.style("visibility", "hidden");
    }

    svg.selectAll(".bar")
        .data(revenueArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.weekday))
        .attr("y", d => yScale(d.avgRevenue))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.avgRevenue))
        .attr("fill", d => colorScale(d.weekday))
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    svg.selectAll(".label")
        .data(revenueArray)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.weekday) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.avgRevenue) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d3.format(",.0f")(d.avgRevenue) + " VND");

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
        .text("Doanh số bán hàng trung bình theo Ngày trong tuần");

}).catch(console.error);
