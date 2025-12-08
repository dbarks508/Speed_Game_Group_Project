import {useState, useEffect} from "react";

const SUITS = ["clubs", "diamonds", "hearts", "spades"];

function numberToFace(num){
	if(num == 1) return "ace";
	else if(num > 1 && num <= 10) return num.toString();
	else if(num == 11) return "jack";
	else if(num == 12) return "queen";
	else if(num == 13) return "king";
	else{
		throw Error(`invalid number '${num}' for card`);
	}
}

function CardHelper({src, ...props}){
	return (<img className="card" src={src} {...props}/>);
}

function PileComponent({cards, revealed, filterDrop, isDragable}){
	cards = cards ?? [];

	let [c, setCards] = useState(cards);
	useEffect(() => setCards(cards), [cards]);

	return (
		<span
			className="pile"

			onDrop={(e) => {
				let data = JSON.parse(e.dataTransfer.getData("json"));

				if(data.suit != undefined && data.number != undefined){
					c.push({suit: data.suit, number: data.number});
					setCards(c.slice());
				}
			}}

			onDragOver={(e) => {
				let data = JSON.parse(e.dataTransfer.getData("json"));
				if(data.suit == undefined || data.number == undefined) return;

				if(filterDrop == undefined || filterDrop(data.suit, data.number)){
					e.preventDefault();
				}
			}}
		>
		{
			c.length == 0 ?(<CardHelper src="cards/blank.svg" onDragStart={(e) => e.preventDefault()}/>):
			(
				<CardComponent
					{...c.at(-1)}
					revealed={revealed}
					isDragable={isDragable}

					onDrop={(e) => {
						if(c.length > 0){
							c.pop();
							setCards(c.slice());
						}
					}}
				/>
			)
		}
		</span>
	);
}

function CardComponent({suit, number, revealed, isDragable, onDrop}){
	isDragable = isDragable ?? false;
	revealed = revealed ?? false;

	if(revealed && !SUITS.includes(suit)){
		throw Error(`invalid suit '${suit}'`);
	}

	return (
		<CardHelper
			src={revealed ? `cards/${numberToFace(number)}_of_${suit}.svg`:"cards/back.svg"}

			onDragStart={(e) => {
				let abort = false;
				try{
					numberToFace(number);
					if(!SUITS.includes(suit)) throw Error();
				}catch{
					abort = true;
					console.warn(`unable to drag a card when {suit: ${suit}, number: ${number}}. (maybe 'isDraggable' needs to be set to false?)`);
				}

				if(isDragable && !abort){
					e.dataTransfer.setData("json", JSON.stringify({suit, number}));
				}else{
					e.preventDefault();
				}
			}}
			onDragEnd={(e) => {
				if(e.dataTransfer.dropEffect !== "move") return;

				if(onDrop) onDrop(e);
			}}
		/>
	);
}

export{
	CardComponent,
	PileComponent,
}
