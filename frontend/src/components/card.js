import {useState} from "react";

const SUITS = ["clubs", "diamonds", "hearts", "spades"];

function number_to_card_face(num){
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
	var [cards, setCards] = useState(cards ?? []);

	return (
		<span
			onDrop={(e) => {
				let data = JSON.parse(e.dataTransfer.getData("json"));

				if(data.suit != undefined && data.number != undefined){
					cards.push({suit: data.suit, number: data.number});
					setCards(cards.slice());
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
			cards.length == 0 ?(<CardHelper src="cards/blank.svg" onDragStart={(e) => e.preventDefault()}/>):
			(
				<CardComponent
					{...cards.at(-1)}
					revealed={revealed}
					isDragable={isDragable}

					onDrop={(e) => {
						if(cards.length > 0){
							cards.pop();
							setCards(cards.slice());
						}
					}}
				/>
			)
		}
		</span>
	);
}

function CardComponent({suit, number, revealed, isDragable, onDrop}){
	isDragable = isDragable ?? true;
	revealed = revealed ?? true;

	// TODO: only call onDrop on a 'successful' drop

	if(!SUITS.includes(suit)){
		throw Error(`invalid suit '${suit}'`);
	}

	return (
		<CardHelper
			src={revealed ? `cards/${number_to_card_face(number)}_of_${suit}.svg`:"cards/back.svg"}

			onDragStart={(e) => {
				if(isDragable){
					e.dataTransfer.setData("json", JSON.stringify({suit, number}));
				}else{
					e.preventDefault();
				}
			}}
			onDragEnd={onDrop}
		/>
	);
}

export{
	CardComponent,
	PileComponent,
}
