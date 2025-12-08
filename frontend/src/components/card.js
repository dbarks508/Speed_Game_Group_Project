import {useState} from "react";

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

function PileComponent({cards, revealed, filterDrop, onDrop, isDragable}){
	cards = cards ?? [];

	function getData(e){
		let raw = e.dataTransfer.getData("json");
		if(raw == undefined || raw.length == 0) return undefined;

		let data = JSON.parse(raw);
		if(data.suit == undefined || data.number == undefined) return undefined;

		return data;
	}

	return (
		<span
			className="pile"

			onDragOver={(e) => {
				let data = getData(e);
				if(data == undefined) return;

				if(filterDrop == undefined || filterDrop(data.suit, data.number)){
					e.preventDefault();
				}
			}}

			onDrop={(e) => {
				let data = getData(e);
				if(data == undefined) return;

				if(onDrop) onDrop(data.suit, data.number);
			}}
		>
		{
			cards.length == 0 ?(<CardHelper src="cards/blank.svg" onDragStart={(e) => e.preventDefault()}/>):
			(
				<CardComponent
					{...cards.at(-1)}
					revealed={revealed}
					isDragable={isDragable}
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
