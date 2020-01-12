// who can vote who can not -- register to vote
// start a timer for 24 hours
// do not show the total count of candidates' votes until election is over.

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },


  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      try {
        // Request account access if needed
        await ethereum.enable();
        // Accounts now exposed
        web3.eth.sendTransaction({
          /* ... */ });
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = new Web3.providers.HttpProvider('HTTP://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
      // Accounts always exposed
      web3.eth.sendTransaction({
        /* ... */ });
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
    return App.initContract();
  },


  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var results = $("#results");

    loader.show();
    content.hide();
    results.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account check: " + account);
      }
    });

    // here start and end times are the hours at which the election begins and ends
    var startTime = '10:00:00';
    var endTime = '11:00:00';
    currentDate = new Date()
    startDate = new Date(currentDate.getTime());
    startDate.setHours(startTime.split(":")[0]);
    startDate.setMinutes(startTime.split(":")[1]);
    startDate.setSeconds(startTime.split(":")[2]);
    endDate = new Date(currentDate.getTime());
    endDate.setHours(endTime.split(":")[0]);
    endDate.setMinutes(endTime.split(":")[1]);
    endDate.setSeconds(endTime.split(":")[2]);
    var valid = startDate < currentDate && endDate > currentDate;

    if (valid){
      // Load contract data
      App.contracts.Election.deployed().then(function(instance) {
        electionInstance = instance;
        return electionInstance.candidateCount();
      }).then(function(candidateCount) {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();

        var candidatesSelect = $("#candidatesSelect");
        candidatesSelect.empty();
        
        for (var i = 1; i <= candidateCount; i++) {
          electionInstance.candidates(i).then(function(candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];

            // Render candidate Result
            var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td></tr>";
            candidatesResults.append(candidateTemplate);

            var candidateOption = "<option value='" + id + "'>" + name + "</option>";
            candidatesSelect.append(candidateOption);
          });
        }
        return electionInstance.voters(App.account);
      }).then(function(hasVoted){
        var voteMessage = $("#voteMessage");
        voteMessage.empty();
        if(hasVoted){
          $('form').hide();
          voteMessage.append("Thanks for voting. The results will be available at " + endTime );
        }else{
          voteMessage.append("The elections will end at " + endTime );
        }
        loader.hide();
        content.show();
      }).catch(function(error) {
        console.warn(error);
      });
    }else{
      // Load contract data
      App.contracts.Election.deployed().then(function(instance) {
        electionInstance = instance;
        return electionInstance.candidateCount();
      }).then(function(candidateCount) {
        var finalResults = $("#finalResults");
        finalResults.empty();

        for (var i = 1; i <= candidateCount; i++) {
          electionInstance.candidates(i).then(function(candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];

            // Render candidate Result
            var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
            finalResults.append(candidateTemplate);
          });
        }
        loader.hide();
        content.hide();
        results.show();
      }).catch(function(error) {
        console.warn(error);
      });
    }
  },

castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});