function line(x1, y1, x2, y2){
	return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export default function Tally({count}){
	let margin = 10;
	let lineWidth = 5;
	let lineSpace = 10;

	let width = 500;
	let height = 70;

	let out = [];

	let delta = lineWidth + lineSpace;
	for(let i = 0; i < count; i++){
		let l;
		if((i + 1) % 5 === 0){
			l = line(
				margin + delta * (i - 4), height - (margin + 10),
				delta * i + lineSpace + lineWidth / 2, margin + 10
			);
		}else{
			l = line(lineSpace + margin + delta * i, margin, lineSpace +  margin + delta * i, height - margin);
		}

		out.push(l);
	}
	out = out.join(" ");

	return (
		<div>
			<svg width={400} stroke="black" fill="none" strokeWidth={lineWidth} strokeLinecap="round" viewBox={`0 0 ${width} ${height}`}>
				<path d={out}/>
			</svg>
		</div>
	)
}
