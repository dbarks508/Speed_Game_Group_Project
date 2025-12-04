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

export default function({suit, number}){
	return (
		<img
			className="card"
			src={`cards/${number_to_card_face(number)}_of_${suit}.svg`}
		/>
	);
}
