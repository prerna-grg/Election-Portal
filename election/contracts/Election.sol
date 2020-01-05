pragma solidity ^0.5.0;

contract Election{

	string public candidate;

	struct Candidate{
		uint id;
		string name;
		uint voteCount;
	}

	mapping(uint => Candidate) public candidates;
	// returns an empty candidate if not found, hence we need a count var
	uint public candidateCount;

	// Constructor
	constructor() public{
		addCandidate("Prerna Garg");
		addCandidate("Komal Chugh");
		addCandidate("Parul Gupta");
	}

	function addCandidate (string memory _name) private{
		candidateCount++;
		candidates[candidateCount] = Candidate(candidateCount, _name , 0);
	}
}