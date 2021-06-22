const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express();
const server = http.createServer(app);
const io = socketio(server)

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

//Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

//Handle a socket connection request
const connections = [null, null, null, null, null]

//player and policy cards with randomize function
let policyCards = ['liberalPolicy', 'liberalPolicy', 'liberalPolicy', 'liberalPolicy', 'liberalPolicy',
    'liberalPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy',
    'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy',
    'fascistPolicy', 'fascistPolicy', 'liberalPolicy', 'liberalPolicy', 'liberalPolicy', 'liberalPolicy', 'liberalPolicy',
    'liberalPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy',
    'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy', 'fascistPolicy',
    'fascistPolicy', 'fascistPolicy']
let playerCards = ['superFascist', 'fascist', 'liberal', 'liberal', 'liberal'];
function randomize(arr) {
    let randomized = [];
    let spliceCards = arr
    for (let i = spliceCards.length; i > 0; i--) {
        randomized.push(...spliceCards.splice(Math.floor(Math.random() * arr.length - 1), 1))
        //console.log(spliceCards)
    }
    return randomized;
}
let randomizedPlayerCards = randomize(playerCards);
let randomizedPolicyCards = randomize(policyCards);
//console.log(randomizedPlayerCards)



let turnCount = 0;
let yesVotes = 0
let noVotes = 0

let yesVetoPCount = 0;
let noVetoPCount = 0;
let yesVetoCCount = 0;
let noVetoCCount = 0;

let chancellorCandidate = null;

let policyCardsEnactedF = [];
let policyCardsEnactedL = [];
let playersNumber = 0;
let playerNames = []
let playersVotedYes = [];
let playersVotedNo = [];

io.on('connection', socket => {
    // console.log('new web socket connection')
    //find an avalible player number
    console.log(connections)
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }
    playersNumber = connections.length
    console.log('player number', playersNumber)
    //player index doesn't change as new sockets are connected server only changes on socket emits and ons



    //tell the connectiong client what player number they are
    socket.emit('player-number', playerIndex);

    socket.emit('player-card', randomizedPlayerCards[playerIndex]);
    console.log(randomizedPlayerCards[playerIndex]);
    console.log(`Player ${playerIndex} has connected`)

    //ignore player 3
    if (playerIndex === -1) return

    connections[playerIndex] = false;
    //tell everyone what player number just connected
    socket.broadcast.emit('player-connection', playerIndex)

    //check if someone clicked ready and if everyone is ready
    socket.on('player-ready', (playerIndex, playerCard, nameInput) => {
        connections[playerIndex] = { ready: true, type: playerCard, name: nameInput }
        playerNames[playerIndex] = nameInput;
        //console.log(connections)
        socket.broadcast.emit('ready-broadcast', playerIndex)
        if (connections.every(player => player && player.ready)) {
            socket.emit('player-list', connections, playerNames);
            socket.broadcast.emit('player-list', connections, playerNames);
            socket.emit('everyone-ready-broadcast', true);
            socket.broadcast.emit('everyone-ready-broadcast', true);
            let fascistPlayers = []
            for (let i = 0; i < randomizedPlayerCards.length; i++) {
                if (randomizedPlayerCards[i] === 'superFascist') {
                    fascistPlayers.push({ playerType: randomizedPlayerCards[i], playerIndex: i })
                } else if (randomizedPlayerCards[i] === 'fascist') {
                    fascistPlayers.push({ playerType: randomizedPlayerCards[i], playerIndex: i })
                }
            }
            socket.emit('fascist-players', fascistPlayers);
            socket.broadcast.emit('fascist-players', fascistPlayers);
            console.log(turnCount);
            socket.emit('turn-count-change', turnCount);
            socket.broadcast.emit('turn-count-change', turnCount);
        }
    })
    //change turns
    socket.on('next-turn', (playerIndex) => {
        console.log(`player${playerIndex} turn just ended`)
        turnCount++
        socket.emit('turn-count-change', turnCount);
        socket.broadcast.emit('turn-count-change', turnCount);
    })
    //grab cards
    socket.on('grab-policies', () => {
        if (randomizedPolicyCards.length < 3) {
            randomizedPolicyCards.push(...randomize(policyCards))
        }
        let pulledCards = randomizedPolicyCards.splice(0, 3)
        socket.emit('send-cards', pulledCards);
        socket.broadcast.emit('send-cards', pulledCards);
        console.log(randomizedPolicyCards)
    })

    //on chancellor select


    socket.on('chancellor', playerIndex => {
        chancellorCandidate = playerIndex;
        socket.emit('chancellor', playerIndex)
        socket.broadcast.emit('chancellor', playerIndex)
    })

    socket.on('yes', (playerNum) => {
        yesVotes++
        console.log('yes votes', yesVotes)
        console.log(playerNum)
        playersVotedYes.push(playerNum);
        console.log('players voted yes', playersVotedYes)
        console.log('players voted no', playersVotedNo)
        if (yesVotes + noVotes === playersNumber) {
            console.log('true or not', yesVotes > playersNumber / 2)
            console.log('player num/2', playersNumber / 2)
            console.log('yes votes', yesVotes)
            if (yesVotes > playersNumber / 2) {
                console.log('player number', playerNum)
                console.log('yesss')
                socket.emit('elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                socket.broadcast.emit('elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                playersVotedNo = []
                playersVotedYes = []
                yesVotes = 0;
                noVotes = 0;
                console.log('yes votes', yesVotes)
                console.log('no votes', noVotes)
            } else {
                socket.emit('not-elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                socket.broadcast.emit('not-elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                playersVotedNo = []
                playersVotedYes = []
                yesVotes = 0;
                noVotes = 0;
                console.log('yes votes', yesVotes)
                console.log('no votes', noVotes)
            }
        }

    })

    socket.on('no', (playerNum) => {
        noVotes++
        playersVotedNo.push(playerNum);
        console.log('no votes', noVotes)
        console.log('players voted yes', playersVotedYes)
        console.log('players voted no', playersVotedNo)
        if (yesVotes + noVotes === playersNumber) {
            if (noVotes > playersNumber / 2) {
                socket.emit('not-elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                socket.broadcast.emit('not-elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                playersVotedNo = []
                playersVotedYes = []
                yesVotes = 0;
                noVotes = 0;
                console.log('yes votes', yesVotes)
                console.log('no votes', noVotes)
            } else {
                socket.emit('elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                socket.broadcast.emit('elected', chancellorCandidate, playersVotedYes, playersVotedNo)
                playersVotedNo = []
                playersVotedYes = []
                yesVotes = 0;
                noVotes = 0;
                console.log('yes votes', yesVotes)
                console.log('no votes', noVotes)
            }
        }
    })

    socket.on('send-to-chancellor', (cards) => {
        console.log('sending to chancellor')
        socket.emit('recieve-chancellor-cards', cards)
        socket.broadcast.emit('recieve-chancellor-cards', cards)
    })

    socket.on('chancellor-selected-card', (card) => {
        console.log(card)
        if (card === 'liberalPolicy') {
            policyCardsEnactedL.push(card);
            console.log(policyCardsEnactedL);
            socket.emit('recieve-chancellor-selected-card', [policyCardsEnactedL, policyCardsEnactedF]);
            socket.broadcast.emit('recieve-chancellor-selected-card', [policyCardsEnactedL, policyCardsEnactedF]);
        } else if (card === 'fascistPolicy') {
            policyCardsEnactedF.push(card);
            console.log(policyCardsEnactedF)
            socket.emit('recieve-chancellor-selected-card', [policyCardsEnactedL, policyCardsEnactedF]);
            socket.broadcast.emit('recieve-chancellor-selected-card', [policyCardsEnactedL, policyCardsEnactedF]);
        }


    })

    //send election tracker card
    socket.on('election-tracker-card', () => {
        let pulledCard = randomizedPolicyCards.splice(0, 1)
        if (pulledCard === 'liberalPolicy') {
            policyCardsEnactedL.push(pulledCard)
            console.log(policyCardsEnactedL);
            socket.emit('send-election-tracker-card', [policyCardsEnactedL, policyCardsEnactedF]);
            socket.broadcast.emit('send-election-tracker-card', [policyCardsEnactedL, policyCardsEnactedF]);
        } else if (pulledCard === 'fascistPolicy') {
            policyCardsEnactedF.push(pulledCard);
            console.log(policyCardsEnactedF)
            socket.emit('send-election-tracker-card', [policyCardsEnactedL, policyCardsEnactedF]);
            socket.broadcast.emit('send-election-tracker-card', [policyCardsEnactedL, policyCardsEnactedF]);
        }
    })
    //excutive powers

    //power 1 investigate
    socket.on('investigate', (player) => {
        socket.emit('recieve-investigate', randomizedPlayerCards[player])
    })
    //power 2 declare new president
    socket.on('new-president', (player) => {
        turnCount--;
        socket.emit('recieve-new-president', player)
        socket.broadcast.emit('recieve-new-president', player)
    })
    //power 3/4
    socket.on('kill-player', (playerIndex) => {
        socket.emit('recieve-kill-player', playerIndex)
        socket.broadcast.emit('recieve-kill-player', playerIndex)
        playersNumber--;
    })

    //power 5 veto
    socket.on('yesPVeto', () => {
        yesVetoPCount++
        if (yesVetoPCount > 2) {
            socket.emit('president-veto-pass')
            socket.broadcast.emit('president-veto-pass')
            yesVetoPCount = 0
        } else if (yesVetoPCount === noVetoPCount) {
            socket.emit('president-veto-fail')
            socket.broadcast.emit('president-veto-fail')
        }
    })
    socket.on('noPVeto', () => {
        noVetoPCount++
        if (noVetoPCount > 2) {
            socket.emit('president-veto-fail')
            socket.broadcast.emit('president-veto-fail')
            yesVetoPCount = 0
        } else if (yesVetoPCount === noVetoPCount) {
            socket.emit('president-veto-fail')
            socket.broadcast.emit('president-veto-fail')
        }
    })

    socket.on('yesCVeto', () => {
        yesVetoCCount++
        if (yesVetoCCount > 2) {
            socket.emit('chancellor-veto-pass')
            socket.broadcast.emit('chancellor-veto-pass')
            yesVetoCCount = 0
        } else if (yesVetoPCount === noVetoPCount) {
            socket.emit('chancellor-veto-fail')
            socket.broadcast.emit('chancellor-veto-fail')
        }
    })
    socket.on('noCVeto', () => {
        noVetoCCount++
        if (noVetoCCount > 2) {
            socket.emit('chancellor-veto-pass')
            socket.broadcast.emit('chancellor-veto-pass')
            yesVetoCCount = 0
        } else if (yesVetoPCount === noVetoPCount) {
            socket.emit('chancellor-veto-fail')
            socket.broadcast.emit('chancellor-veto-fail')
        }
    })

    //handle disonnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} has disconnected`);
        connections[playerIndex] = null;
        console.log(connections)
        //tell eveyone what player number disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    socket.on('winner', () => {
        randomizedPlayerCards = randomize(playerCards);
        randomizedPolicyCards = randomize(policyCards);
        //console.log(randomizedPlayerCards)



        turnCount = 0;
        yesVotes = 0
        noVotes = 0

        yesVetoPCount = 0;
        noVetoPCount = 0;
        yesVetoCCount = 0;
        noVetoCCount = 0;

        chancellorCandidate = null;

        policyCardsEnactedF = [];
        policyCardsEnactedL = [];
        playerNum = connections.length;
        playerNames = []
    })


})


