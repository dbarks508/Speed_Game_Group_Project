const SUITS = ["clubs", "diamonds", "hearts", "spades"]

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

function CardComponent({suit, number, isDragable, onDrop}){
	isDragable = isDragable ?? true;

	// TODO: only call onDrop on a 'successful' drop

	if(!SUITS.includes(suit)){
		throw Error(`invalid suit '${suit}'`);
	}

	return (
		<img
			className="card"

			onDragStart={(e) => {
				if(isDragable){
					e.dataTransfer.setData("json", JSON.stringify({suit, number}));
				}else{
					e.preventDefault();
				}
			}}
			onDragEnd={onDrop}

			src={`cards/${number_to_card_face(number)}_of_${suit}.svg`}
		/>
	);
}

export{
	CardComponent,
}
