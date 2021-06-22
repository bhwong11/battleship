document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('#startButton');
    const readyButton = document.querySelector('#readyButton');
    const nextTurnButton = document.querySelector('#nextTurn');
    const playersDiv = document.querySelector('#players');
    const yesNoButtonsDiv = document.querySelector('#yesNoButtons')
    const yesChancellorButton = document.querySelector('#yesChanellor')
    const noChancellorButton = document.querySelector('#noChanellor')
    const pCardsDiv = document.querySelector('#pCardsDiv')
    const chancellorCardsDiv = document.querySelector('#pCardsDivChancellor')
    const pCardBoardsDivF = document.querySelector('#policiesEnactedF');
    const pCardBoardsDivL = document.querySelector('#policiesEnactedL');
    const electionTrackerDiv = document.querySelector('#electionTracker');
    const playerForInvestigationDiv = document.querySelector('#playerForInvestigation')
    const playerForNewPresidentDiv = document.querySelector('#playerForNewPresident')
    const playerForKillDiv = document.querySelector('#playerForKill')
    const gameOptionsDiv = document.querySelector('#gameOptions')
    const presidentVetoDiv = document.querySelector('#presidentVeto')
    const chancellorVetoDiv = document.querySelector('#chancellorVeto')
    const yesVetoPButton = document.querySelector('#yesVetoP')
    const noVetoPButton = document.querySelector('#noVetoP')
    const yesVetoCButton = document.querySelector('#yesVetoC')
    const noVetoCButton = document.querySelector('#noVetoC')
    const nameInput = document.querySelector('#playerName')
    const playerNameForm = document.querySelector('#playerNameForm')
    const playerNameDislay = document.querySelector('#playerNameInBoard')
    const infoDiv = document.querySelector('#infoDiv')
    const playerCardDisplay = document.querySelector('#playerCard')
    const enterInfoDiv = document.querySelector('#startAndReady')
    const pCardDivTitle = document.querySelector('#pCardDivTitle')
    const playerSelfInfoPlusTitleDiv = document.querySelector('#playerSelfInfoPlusTitle')
    const gameAnnouncementsDiv = document.querySelector('#gameAnnouncementsDiv')
    const playersTurnDiv = document.querySelector('#playersTurn')
    //const pCardChancellorDivTitle = document.querySelector('#pCardChancellorDivTitle')
    const playerForInvestigationTitle = document.querySelector('#playerForInvestigationTitle');
    const playerForNewPresidentTitle = document.querySelector('#playerForSpecialElectionTitle')
    const playerForKillDivTitle = document.querySelector('#playerForKillTitle')
    //console.log(pCardsDiv.classList)

    let playerNum = null;
    let playerCard = null;
    let isYourTurn = false;
    let playerList = [];
    let lastChancellor = null
    let isChancellor = false;
    let policyCardsEnactedF = [];
    let policyCardsEnactedL = [];
    let winner = null;
    let electionTrackerCount = 0;
    let killedPlayers = [];
    let specialElection = false
    let turnCount = 0;
    let power1usable = true;
    let power2usable = true;
    let power3usable = true;
    let power4usable = true;
    let vetoPowerPresident = false;
    let vetoPowerChancellor = false;
    let playerNames = [];

    startButton.addEventListener('click', async () => {
        startButton.classList.add('noDisplay');
        const socket = io();

        socket.on('player-connection', (index) => {
            console.log(`player ${index} has joined`)
        })

        socket.on('player-number', (num) => {
            playerNum = parseInt(num);
            console.log(playerNum);
        })
        //will need to await in some way varible obtained from on

        socket.on('player-card', card => {
            playerCard = card;
            console.log(playerCard)
            playerCardDisplay.innerHTML = `<b> You Are: ${playerCard}</b>`;
            if (playerCard === 'fascist' || playerCard === 'superFascist') {
                playerCardDisplay.classList.add('orangeCard')
            } else {
                playerCardDisplay.classList.add('blueCard')
            }

        })

        //ready button
        readyButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('you are ready');
            console.log(nameInput.value);
            playerNameForm.classList.add('noDisplay');
            playerNameDislay.innerHTML = `<div>player: ${nameInput.value}</div><div>Your Player Number is ${playerNum}</div>`
            socket.emit('player-ready', playerNum, playerCard, nameInput.value)
            readyButton.classList.add('noDisplay');
            enterInfoDiv.classList.add('noDisplay');
            playerSelfInfoPlusTitleDiv.classList.toggle('noDisplay')
            gameAnnouncementsDiv.classList.toggle('noDisplay')
            playersTurnDiv.classList.toggle('noDisplay')

        })

        //check who is ready

        socket.on('ready-broadcast', (playerIndex) => {
            console.log(`player ${playerIndex} is ready`)
            infoDiv.innerHTML = `player ${playerIndex} is ready`
        })
        socket.on('everyone-ready-broadcast', (boolean) => {
            console.log('everyone is ready')
            infoDiv.innerHTML = 'everyone is ready'
        })
        socket.on('player-list', (list, playerName) => {
            playerList = list;
            playerNames = playerName;
            console.log(playerName)
            console.log(playerList);
            createPlayerButton();

        })

        const createPlayerButton = () => {
            console.log(playerList)
            const chooseChancellorTitle = document.createElement('h4')
            chooseChancellorTitle.innerHTML = 'Choose The Player For Chancellor'
            playersDiv.append(chooseChancellorTitle);
            for (let i = 0; i < playerList.length; i++) {
                if (i !== playerNum && !killedPlayers.includes(i)) {
                    const button = document.createElement('button');
                    button.classList.add(`${i}`);
                    button.innerHTML = `player:${i} name:${playerNames[i]}`;
                    //select Chancellor Buttons
                    button.addEventListener('click', () => {
                        if (i !== lastChancellor) {
                            socket.emit('chancellor', i)
                            if (isYourTurn) {
                                playersDiv.classList.toggle('noDisplay');
                            }
                        } else {
                            console.log('choose another chancellor canidate, this was the previous cahncellor')
                            infoDiv.innerHTML = 'choose another chancellor canidate, this was the previous cahncellor'
                        }
                    })
                    playersDiv.append(button);
                }
            }
        }



        //show fascist players
        socket.on('fascist-players', (fascistPlayers) => {
            if (fascistPlayers.some(player => player.playerIndex === playerNum)) {
                let superFascist = fascistPlayers.filter(player => player.playerType === 'superFascist')
                //console.log(`superFascist player is ${superFascist[0].playerIndex} `)
                const superFascistTitle = document.createElement('h4');
                superFascistTitle.classList.add('superFascistPlayer')
                superFascistTitle.innerHTML = `superFascist player is player:${superFascist[0].playerIndex} names:${playerNames[parseInt(superFascist[0].playerIndex)]} `
                playerSelfInfoPlusTitleDiv.append(superFascistTitle);
                let fascistP = fascistPlayers.filter(player => player.playerType === 'fascist')
                const fascistPIndex = fascistP.map(player => player.playerIndex);
                const fascistPNames = fascistPIndex.map(index => playerNames[index])
                //console.log(`fascist players are ${fascistP.map(player => player.playerIndex)}`)
                const fascistPlayersTitle = document.createElement('h4');
                fascistPlayersTitle.classList.add('fascistPlayer')
                fascistPlayersTitle.innerHTML = `fascist players are players: ${fascistPIndex} names:${fascistPNames}`;
                playerSelfInfoPlusTitleDiv.append(fascistPlayersTitle);
            }
        });

        //change turns


        socket.on('turn-count-change', (turnCountServer) => {
            playersTurnDiv.innerHTML = '';
            if (specialElection) {
                specialElection = false;
            } else {
                turnCount = turnCountServer
            }
            console.log(`It is turn ${turnCount} `)
            //your turn actions
            if ((turnCount) % (playerList.length) === (playerNum)) {
                if (killedPlayers.includes(playerNum)) {
                    socket.emit('next-turn', playerNum - 1);
                    isYourTurn = false;
                } else {
                    isYourTurn = true
                }
            } else {
                isYourTurn = false
            }
            //console.log(isYourTurn);
            if (isYourTurn === true) {
                //console.log(`it's your turn`)
                infoDiv.innerHTML = `it's your turn`
                playersDiv.classList.toggle('noDisplay');
                playersTurnDiv.innerHTML = `<h3>Conduct Actions For Your Turn</h3>`
            } else {
                playersTurnDiv.innerHTML = `<h3>It Is Player: ${(turnCount) % (playerList.length)}, ${playerNames[(turnCount) % (playerList.length)]}'s turn</h3>`
                infoDiv.innerHTML = `<h3>It Is Player: ${(turnCount) % (playerList.length)}, ${playerNames[(turnCount) % (playerList.length)]}'s turn</h3>`
            }
            // if (isYourTurn) {
            //     nextTurnButton.classList.toggle('noDisplay')
            // }

        });


        nextTurnButton.addEventListener('click', () => {
            socket.emit('next-turn', playerNum)
            nextTurnButton.classList.toggle('noDisplay')
        })
        //chancellor select
        socket.on('chancellor', num => {
            //console.log(`player ${num} has been selected as chancellor canidate`)
            infoDiv.innerHTML = `player ${num} has been selected as chancellor canidate`
            yesNoButtonsDiv.classList.toggle('noDisplay');
        })

        //event listeners on buttons for chancellor select
        yesChancellorButton.addEventListener('click', (e) => {
            //console.log('your selected yes')
            infoDiv.innerHTML = 'You Selected Yes';
            socket.emit('yes', playerNum);
            yesNoButtonsDiv.classList.toggle('noDisplay');
        })
        noChancellorButton.addEventListener('click', (e) => {
            //console.log('your selected no')
            infoDiv.innerHTML = 'You Selected No';
            socket.emit('no', playerNum);
            yesNoButtonsDiv.classList.toggle('noDisplay');
        })



        //on Elected
        socket.on('elected', (num, playersVotedYes, playersVotedNo) => {
            //console.log(`player ${num} is elected chancellor`)
            // console.log(`players voted yes are ${playersVotedYes}`)
            // console.log(`players voted no are ${playersVotedNo}`)
            console.log(playersVotedYes)
            console.log(playersVotedNo)
            //check if hitler is chancellor and 3 fascist cards
            if (playerNum === num) {
                isChancellor = true
            } else {
                isChancellor = false
            }
            if (policyCardsEnactedF.length >= 3) {
                if (isChancellor && playerCard === 'superFascist') {
                    winner = 'fascist'
                    console.log(winner)
                    gameOverClear()
                    socket.emit('winner')
                }
            }

            //grab and send cards
            console.log(isYourTurn)

            if (isYourTurn) {
                socket.emit('grab-policies', playerNum)
            }

            //check if chancellor
            console.log(`player num match chancellor ${playerNum === num}`)
            console.log('is chancellor', isChancellor)

            //clear election tracker count
            electionTrackerDiv.children[0].classList.remove('eTrackerRed')
            electionTrackerDiv.children[1].classList.remove('eTrackerRed')
            electionTrackerDiv.children[2].classList.remove('eTrackerRed')
            electionTrackerCount = 0

            console.log(playersVotedYes)
            console.log(playersVotedNo)

            let playerNamesVotedYes = playersVotedYes.map(player => playerNames[player])
            let playerNamesVotedNo = playersVotedNo.map(player => playerNames[player])
            if (playerNamesVotedNo.length < 1) {
                playerNamesVotedNo = 'None'
            }
            if (playerNamesVotedYes.length < 1) {
                playerNamesVotedYes = 'None'
            }
            infoDiv.innerHTML = `<div>player ${num} is elected chancellor</div>
            <div>players voted yes are ${playerNamesVotedYes}</div>
            <div>players voted no are ${playerNamesVotedNo}</div>`
            lastChancellor = num;

        })

        //get cards
        socket.on('send-cards', cards => {
            if (isYourTurn) {
                console.log(cards)

                //create cards
                pCardsDiv.classList.toggle('noDisplay')
                pCardDivTitle.classList.toggle('noDisplay')
                let cardsToChancellor = []
                for (let card of cards) {
                    const pCard = document.createElement('div');
                    pCard.innerText = card;
                    if (card === 'liberalPolicy') {
                        pCard.classList.add('blueCard')
                    } else {
                        pCard.classList.add('orangeCard')
                    }
                    const pCardEventHandler = () => {
                        if (!pCard.classList.contains('selected')) {
                            cardsToChancellor.push(card)
                        } else {
                            console.log('card already choosen')
                            infoDiv.innerHTML = 'card Already Choosen'
                        }
                        pCard.classList.add('selected')
                        setTimeout(
                            () => {
                                if (cardsToChancellor.length > 1) {
                                    console.log('send to chancellor!!!')
                                    console.log('sending to chancellor', cardsToChancellor)
                                    socket.emit('send-to-chancellor', cardsToChancellor)
                                    cardsToChancellor = [];
                                    pCardsDiv.innerHTML = ''
                                    pCardsDiv.classList.toggle('noDisplay');
                                    pCardDivTitle.classList.toggle('noDisplay')
                                }
                            }
                            , 300)
                    }
                    pCard.removeEventListener('click', pCardEventHandler, false)
                    pCard.addEventListener('click', pCardEventHandler, false)

                    pCardsDiv.append(pCard)
                }
                if (vetoPowerPresident) {
                    console.log('vetoPowerPresident active')
                    presidentVetoDiv.classList.toggle('noDisplay')
                    vetoPowerPresident = false;
                    infoDiv.innerHTML = `The President Veto-ed`
                }


            }
            if (isChancellor) {
                console.log('is chancellor')
                if (vetoPowerPresident) {
                    console.log('vetoPowerPresident active')
                    presidentVetoDiv.classList.toggle('noDisplay')
                    vetoPowerPresident = false;
                    infoDiv.innerHTML += ` The Chancellor also Veto-ed`
                }
            }
        })
        //recieve cards
        socket.on('recieve-chancellor-cards', (cards) => {
            if (isChancellor) {
                console.log('recieved cards')
                console.log(cards);
                chancellorCardsDiv.classList.toggle('noDisplay')
                const pCardChancellorDivTitle = document.createElement('h4')
                pCardChancellorDivTitle.innerHTML = 'Choose Policy Card to Enact'
                pCardsDiv.append(pCardChancellorDivTitle);
                for (let card of cards) {
                    const newCCard = document.createElement('div')
                    newCCard.innerText = card;
                    newCCard.addEventListener('click', () => {
                        console.log('clicked')
                        socket.emit('chancellor-selected-card', card)
                        chancellorCardsDiv.innerHTML = '';
                        chancellorCardsDiv.classList.toggle('noDisplay')
                        pCardChancellorDivTitle.classList.toggle('noDisplay');

                    })
                    if (card === 'liberalPolicy') {
                        newCCard.classList.add('blueCard')
                    } else {
                        newCCard.classList.add('orangeCard')
                    }
                    chancellorCardsDiv.append(newCCard)
                }
                if (vetoPowerChancellor) {
                    chancellorVetoDiv.classList.add('noDisplay');
                    vetoPowerChancellor = false;
                }

            }
            if (isYourTurn) {
                if (vetoPowerChancellor) {
                    chancellorVetoDiv.classList.add('noDisplay');
                    vetoPowerChancellor = false;
                }
            }

        })



        //create new policy enacted
        socket.on('recieve-chancellor-selected-card', (cardArr) => {
            console.log(cardArr)
            policyCardsEnactedL = cardArr[0]
            policyCardsEnactedF = cardArr[1]
            for (let i = 0; i < cardArr[0].length; i++) {
                pCardBoardsDivL.children[i].classList.add('blueCard')
                pCardBoardsDivL.children[i].innerHTML = cardArr[0][i];
            }
            for (let i = 0; i < cardArr[1].length; i++) {
                pCardBoardsDivF.children[i].classList.add('orangeCard')
                pCardBoardsDivF.children[i].innerHTML = cardArr[1][i];
            }
            if (policyCardsEnactedL.length === 5) {
                winner = 'liberals'
                console.log(winner);
                socket.emit('winner');
            }
            if (policyCardsEnactedF.length === 6) {
                winner = 'fascist'
                console.log(winner);
                gameOverClear()
                socket.emit('winner')
            }
            infoDiv.innerHTML = `A New Policy Has Been Enacted`
            //excutive powers
            if (isYourTurn) {
                //excutive power 1 investigate player
                if (policyCardsEnactedF.length === 2 && power1usable === true) {
                    // console.log(power1usable);
                    // console.log(policyCardsEnactedF.length === 2 && power1usable === true)
                    // power1usable = !power1usable;
                    // console.log(power1usable);
                    infoDiv.innerHTML = `Excutive Power 1 Has Been Enacted`
                    playerForInvestigationTitle.classList.toggle('noDisplay')
                    playerForInvestigationDiv.classList.toggle('noDisplay');
                    for (let i = 0; i < playerList.length; i++) {
                        if (!killedPlayers.includes(i)) {
                            const button = document.createElement('button');
                            button.classList.add(`${i}`);
                            button.innerHTML = `player ${i} name: ${playerNames[i]}`;
                            //select Chancellor Buttons
                            const investigationEventHandler = () => {
                                socket.emit('investigate', i)
                                playerForInvestigationDiv.classList.toggle('noDisplay');
                                playerForInvestigationDiv.innerHTML = '';
                                playerForInvestigationTitle.classList.toggle('noDisplay')
                            }
                            button.addEventListener('click', investigationEventHandler)
                            playerForInvestigationDiv.append(button);
                        }
                    }

                }

                //excutive power 2 delcare new president
                if (policyCardsEnactedF.length === 3 && power2usable) {
                    //power2usable = false;
                    playerForNewPresidentDiv.classList.toggle('noDisplay');
                    playerForNewPresidentTitle.classList.toggle('noDisplay')
                    for (let i = 0; i < playerList.length; i++) {
                        if (!killedPlayers.includes(i)) {
                            const button = document.createElement('button');
                            button.classList.add(`${i}`);
                            button.innerHTML = `player ${i} name: ${playerNames[i]}`;
                            //select Chancellor Buttons
                            const newPresidentEventHandler = () => {
                                socket.emit('new-president', i)
                                playerForNewPresidentDiv.classList.toggle('noDisplay');
                                playerForNewPresidentDiv.innerHTML = '';
                                playerForNewPresidentTitle.classList.toggle('noDisplay')
                            }
                            button.addEventListener('click', newPresidentEventHandler)
                            playerForNewPresidentDiv.append(button);
                        }
                    }

                }
                //excutive power 3 kill player
                if ((policyCardsEnactedF.length === 4 && power3usable)) {
                    playerForKillDivTitle.classList.toggle('noDisplay')
                    playerForKillDiv.classList.toggle('noDisplay');
                    for (let i = 0; i < playerList.length; i++) {
                        if (!killedPlayers.includes(i)) {
                            const button = document.createElement('button');
                            button.classList.add(`${i}`);
                            button.innerHTML = `player ${i} name: ${playerNames[i]}`;
                            //select Chancellor Buttons
                            const playerForKillEventHandler = () => {
                                socket.emit('kill-player', i)
                                playerForKillDiv.classList.toggle('noDisplay');
                                playerForKillDiv.innerHTML = '';
                                playerForKillDivTitle.classList.toggle('noDisplay')
                            }
                            button.addEventListener('click', playerForKillEventHandler)
                            playerForKillDiv.append(button);
                        }
                    }
                    power3usable = false;
                }
                //excutive power 4 kill player
                if ((policyCardsEnactedF.length === 5 && power4usable)) {
                    playerForKillDiv.classList.toggle('noDisplay');
                    playerForKillDivTitle.classList.toggle('noDisplay')
                    for (let i = 0; i < playerList.length; i++) {
                        if (!killedPlayers.includes(i)) {
                            const button = document.createElement('button');
                            button.classList.add(`${i}`);
                            button.innerHTML = `player ${i} name: ${playerNames[i]}`;
                            //select Chancellor Buttons
                            const playerForKillEventHandler = () => {
                                socket.emit('kill-player', i)
                                playerForKillDiv.classList.toggle('noDisplay');
                                playerForKillDiv.innerHTML = '';
                                playerForKillDivTitle.classList.toggle('noDisplay')
                            }
                            button.addEventListener('click', playerForKillEventHandler)
                            playerForKillDiv.append(button);
                        }
                    }
                    power4usable = false;
                }


            }
            //turn off powers
            if (policyCardsEnactedF.length === 2 && power1usable === true) {
                power1usable = false;
            }
            if (policyCardsEnactedF.length === 3 && power2usable) {
                power2usable = false;
            }
            if (policyCardsEnactedF.length === 4 && power3usable) {
                power3usable = false;
            }
            if (policyCardsEnactedF.length === 5 && power4usable) {
                power4usable = false;
            }
            //excutive power 5 veto
            if (policyCardsEnactedF.length === 5) {
                vetoPowerPresident = true
                vetoPowerChancellor = true
            }
            if (isYourTurn) {
                nextTurnButton.classList.toggle('noDisplay')
            }

        })
        //excutive power 1 recieve
        socket.on('recieve-investigate', (playerType) => {
            //console.log('recieve-investigate')
            //console.log(playerType);
            infoDiv.innerHTML = `Player Selected is a ${playerType}`
        })
        //excutive power 2 recieve
        socket.on('recieve-new-president', (playerNum) => {
            //console.log(playerNum);
            turnCount = playerNum;
            specialElection = true;
            infoDiv.innerHTML = `New President is ${playerNum}(click next Turn to Start Election)`
        })
        //excutive power 3 recieve
        socket.on('recieve-kill-player', (playerNumKilled) => {
            //console.log(`player ${playerNumKilled} has been killed`)
            killedPlayers.push(playerNumKilled)
            //create new player buttons
            playersDiv.innerHTML = '';
            createPlayerButton();
            //get rid of player display
            if (killedPlayers.includes(playerNum)) {
                gameOptionsDiv.classList.add('noDisplay')
                const newKilled = document.createElement('h2')
                newKilled.innerText = 'You have been excuted!'
                document.body.appendChild(newKilled);
            }
            infoDiv.innerHTML = `player ${playerNumKilled} has been killed`;

        })
        //excutive power veto event listeners

        //veto speceifically
        yesVetoPButton.addEventListener('click', () => {
            socket.emit('yesPVeto')
            presidentVetoDiv.classList.toggle('noDisplay')
        })
        noVetoPButton.addEventListener('click', () => {
            socket.emit('noPVeto')
            presidentVetoDiv.classList.toggle('noDisplay')
        })

        yesVetoCButton.addEventListener('click', () => {
            socket.emit('yesCVeto')
            chancellorVetoDiv.classList.toggle('noDisplay')
        })
        noVetoCButton.addEventListener('click', () => {
            socket.emit('noCVeto')
            chancellorVetoDiv.classList.toggle('noDisplay')
        })

        socket.on('president-veto-pass', () => {
            if (isYourTurn) {
                pCardsDiv.innerHTML = '';
                console.log()
                socket.emit('grab-policies', playerNum);
            }
            infoDiv.innerHTML = `President's veto passed`
        })

        socket.on('president-veto-fail', () => {
            console.log('president veto failed')
            infoDiv.innerHTML = `President's veto failed`
        })

        socket.on('chancellor-veto-pass', () => {
            if (isYourTurn) {
                console.log('move on to next turn')
                chancellorCardsDiv.innerHTML = ''
            }
            infoDiv.innerHTML = `Chancellor's veto passed`
        })

        socket.on('chancellor-veto-fail', () => {
            console.log('chancellor veto failed')
            infoDiv.innerHTML = `Chancellor's veto failed`
        })



        socket.on('not-elected', (num, playersVotedYes, playersVotedNo) => {
            // console.log('government failed to pass')
            // console.log(`players voted yes are ${playersVotedYes}`)
            // console.log(`players voted no are ${playersVotedNo}`)
            const playerNamesVotedYes = playersVotedYes.map(player => playerNames[player])
            const playerNamesVotedNo = playersVotedNo.map(player => playerNames[player])
            if (playerNamesVotedNo.length < 1) {
                playerNamesVotedNo = 'None'
            }
            if (playerNamesVotedYes.length < 1) {
                playerNamesVotedYes = 'None'
            }
            infoDiv.innerHTML = `<div>player ${num} is elected chancellor</div>
            <div>players voted yes are ${playerNamesVotedYes}</div>
            <div>players voted no are ${playerNamesVotedNo}</div>`
            lastChancellor = num;
            electionTrackerCount++
            if (electionTrackerCount === 3) {
                if (electionTrackerDiv.children[electionTrackerCount - 2]) {
                    electionTrackerDiv.children[electionTrackerCount - 2].classList.remove('eTrackerRed')
                }
                electionTrackerDiv.children[electionTrackerCount - 1].classList.add('eTrackerRed')
                setTimeout(() => {
                    electionTrackerDiv.children[2].classList.remove('eTrackerRed')
                }, 500)
                electionTrackerCount = 0
                socket.emit('election-tracker-card')
            } else {
                if (electionTrackerDiv.children[electionTrackerCount - 2]) {
                    electionTrackerDiv.children[electionTrackerCount - 2].classList.remove('eTrackerRed')
                }
                electionTrackerDiv.children[electionTrackerCount - 1].classList.add('eTrackerRed')
            }
            if (isYourTurn) {
                nextTurnButton.classList.toggle('noDisplay')
            }

        })

        socket.on('send-election-tracker-card', (cardArr) => {
            console.log(cardArr)
            policyCardsEnactedL = cardArr[0]
            policyCardsEnactedF = cardArr[1]
            for (let i = 0; i < cardArr[0].length; i++) {
                pCardBoardsDivL.children[i].classList.add('blueCard')
                pCardBoardsDivL.children[i].innerHTML = cardArr[0][i];
            }
            for (let i = 0; i < cardArr[1].length; i++) {
                pCardBoardsDivF.children[i].classList.add('orangeCard')
                pCardBoardsDivF.children[i].innerHTML = cardArr[1][i];
            }
        })

        function gameOverClear() {
            gameOptionsDiv.innerHTML = `game over! Winner is ${winner}! close the tab`
            lastChancellor = null
            isChancellor = false;
            policyCardsEnactedF = [];
            policyCardsEnactedL = [];
            winner = null;
            electionTrackerCount = 0;
            killedPlayers = [];
            specialElection = false
            turnCount = 0;
            //power1usable = true;
            //power2usable = true;
            power3usable = true;
            power4usable = true;
            vetoPowerPresident = false;
            vetoPowerChancellor = false;

            for (let i = 0; i < pCardBoardsDivL.children.length; i++) {
                pCardBoardsDivL.children[i].classList.remove('blueCard')
                pCardBoardsDivL.children[i].innerHTML = '';
            }
            for (let i = 0; i < pCardBoardsDivF.children.length; i++) {
                pCardBoardsDivF.children[i].classList.remove('orangeCard')
                pCardBoardsDivF.children[i].innerHTML = '';
            }

            playersDiv.innerHTML = '';
            yesNoButtonsDiv.innerHTML = '';
            pCardsDiv.innerHTML = '';
            chancellorCardsDiv.innerHTML = '';
            //electionTrackerDiv.innerHTML = '';
            playerForInvestigationDiv.innerHTML = '';
            playerForNewPresidentDiv.innerHTML = '';
            playerForKillDiv.innerHTML = '';
            presidentVetoDiv.innerHTML = '';
            chancellorVetoDiv.innerHTML = '';
            nameInput.value = '';
            playerNameDislay.innerHTML = '';


        }



    })



});

// //alert('hi')
// document.addEventListener('DOMContentLoaded', () => {
//     const userGrid = document.querySelector('.grid-user');
//     const computerGrid = document.querySelector('.grid-computer');
//     const displayGrid = document.querySelector('.grid-display');
//     const ships = document.querySelectorAll('.ship');
//     const destroyer = document.querySelector('.destroyer-container');
//     const submarine = document.querySelector('.submarine-container');
//     const cruiser = document.querySelector('.cruiser-container');
//     const battleship = document.querySelector('.battleship-container');
//     const carrier = document.querySelector('.carrier-container');
//     const startButton = document.querySelector('#start');
//     const rotateButton = document.querySelector('#rotate');
//     const turnDisplay = document.querySelector('#whose-go');
//     const infoDisplay = document.querySelector('#info');
//     const singlePlayerButton = document.querySelector('#singlePlayerButton');
//     const multiPlayerButton = document.querySelector('#multiPlayerButton');

//     const width = 10;
//     const userSquares = [];
//     const computerSquares = [];
//     let isHorizontal = true;
//     let isGameOver = false;
//     let currentPlayer = 'user'
//     let gameMode = "";
//     let playerNum = 0;
//     let ready = false;
//     let enemyReady = false;
//     let allShipsPlaced = false;
//     let shotFired = -1;


//     //Select Player Mode
//     singlePlayerButton.addEventListener('click', startSinglePlayer)
//     multiPlayerButton.addEventListener('click', startMultiPlayer)
//     const socket = io();
//     socket.emit('test', 'test')
//     console.log('emitted')
//     socket.on('test1', (test) => {
//         console.log(test)
//     })
//     //multiplayer
//     function startMultiPlayer() {
//         gameMode = 'mutliPlayer'

//         const socket = io();

//         // get your player number
//         socket.on('player-number', num => {
//             if (num === -1) {
//                 infoDisplay.innerHTML = "Sorry the server is full"
//             } else {
//                 playerNum = parseInt(num);
//                 if (playerNum === 1) {
//                     currentPlayer = "enemy"
//                 }
//                 console.log(playerNum)
//                 //get other player status
//                 socket.emit('check-players')
//             }
//         })

//         //another player has connected or disconnected
//         socket.on('player-connection', num => {
//             console.log(`Player Number ${num} has connected or disconnected`);
//             playerConnectedOrDisconnected(num)
//         })

//         //on enemy ready
//         socket.on('enemy-ready', num => {
//             enemyReady = true;
//             playerReady(num)
//             if (ready) playGameMulti(socket)
//         })

//         //check player status
//         socket.on('check-players', players => {
//             players.forEach((p, i) => {
//                 if (p.connected) playerConnectedOrDisconnected(i)
//                 if (p.ready) {
//                     playerReady(i)
//                     if (i !== playerReady) enemyReady = true;
//                 }
//             })
//         })

//         //On Timeout
//         socket.on('timeout', () => {
//             infoDisplay.innerHTML = 'you have reached Timeout for the 10 minute limit'
//         })

//         //ready button click
//         startButton.addEventListener('click', () => {
//             //adding in for testing
//             //playGameMulti(socket);
//             if (allShipsPlaced) playGameMulti(socket)
//             else infoDisplay.innerHTML = "please place all ships"
//         })

//         //set up event listern for firing
//         computerSquares.forEach(square => {
//             square.addEventListener('click', () => {
//                 if (currentPlayer === 'user' && ready && enemyReady) {
//                     shotFired = square.dataset.id;
//                     socket.emit('fire', shotFired)
//                 }
//             })
//         })

//         //on fire recieved
//         socket.on('fire', id => {
//             enemyGo(id)
//             const square = userSquares[id]
//             socket.emit('fire-reply', square.classList)
//             playGameMulti(socket)
//         })
//         //on fire reply recieved
//         socket.on('fire-reply', classList => {
//             revealSquare(classList);
//             playGameMulti(socket)
//             //restarts everything in the socket in server
//         })

//         function playerConnectedOrDisconnected(num) {
//             let player = `.p${parseInt(num) + 1}`
//             document.querySelector(`${player} .connected span`).classList.toggle('green')
//             if (parseInt(num) === playerNum) {
//                 document.querySelector(player).style.fontWeight = 'bold'
//             }
//         }
//     }

//     //Single Player
//     function startSinglePlayer() {
//         gameMode = "singlePlayer"
//         generate(shipArray[0])
//         generate(shipArray[1])
//         generate(shipArray[2])
//         generate(shipArray[3])
//         generate(shipArray[4])

//         startButton.addEventListener('click', playGameSingle)
//     }

//     //create boards
//     function createBoard(grid, squares) {
//         for (let i = 0; i < width * width; i++) {
//             const square = document.createElement('div');
//             square.dataset.id = i;
//             grid.appendChild(square);
//             squares.push(square);
//         }
//     }
//     createBoard(userGrid, userSquares);
//     createBoard(computerGrid, computerSquares);

//     //Ships
//     const shipArray = [
//         {
//             name: 'destroyer',
//             directions: [
//                 //these are indexes of sqare.dataset.id
//                 [0, 1],
//                 [0, width]
//             ]
//         },
//         {
//             name: 'submarine',
//             directions: [
//                 [0, 1, 2],
//                 [0, width, width * 2]
//             ]
//         },
//         {
//             name: 'cruiser',
//             directions: [
//                 [0, 1, 2],
//                 [0, width, width * 2]
//             ]
//         },
//         {
//             name: 'battleship',
//             directions: [
//                 [0, 1, 2, 3],
//                 [0, width, width * 2, width * 3]
//             ]
//         }, {
//             name: 'carrier',
//             directions: [
//                 [0, 1, 2, 3, 4],
//                 [0, width, width * 2, width * 3, width * 4]
//             ]
//         }
//     ]

//     //Draw the computer's ships in random locations
//     function generate(ship) {
//         let randomDirection = Math.floor(Math.random() * ship.directions.length);
//         let current = ship.directions[randomDirection];
//         if (randomDirection === 0) direction = 1;
//         if (randomDirection === 1) direction = 10;

//         let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)));
//         const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
//         const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
//         const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)

//         if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
//             current.forEach(index => {
//                 //console.log(computerSquares[randomStart + index]);
//                 return computerSquares[randomStart + index].classList.add('taken', ship.name)
//             })
//         } else {
//             generate(ship)
//         }
//     }



//     //rotate the ships
//     function rotate() {
//         if (isHorizontal) {
//             destroyer.classList.toggle('destroyer-container-vertical');
//             submarine.classList.toggle('submarine-container-vertical');
//             cruiser.classList.toggle('cruiser-container-vertical');
//             battleship.classList.toggle('battleship-container-vertical');
//             carrier.classList.toggle('carrier-container-vertical');
//             isHorizontal = false;
//             console.log(isHorizontal)
//             return
//         }
//         if (!isHorizontal) {
//             destroyer.classList.toggle('destroyer-container-vertical');
//             submarine.classList.toggle('submarine-container-vertical');
//             cruiser.classList.toggle('cruiser-container-vertical');
//             battleship.classList.toggle('battleship-container-vertical');
//             carrier.classList.toggle('carrier-container-vertical');
//             isHorizontal = true;
//             console.log(isHorizontal)
//             return
//         }
//     }
//     rotateButton.addEventListener('click', e => {
//         rotate();
//     })
//     //move around user shio
//     ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
//     userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
//     userSquares.forEach(square => square.addEventListener('dragover', dragOver))
//     userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
//     userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
//     userSquares.forEach(square => square.addEventListener('drop', dragDrop))
//     userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

//     let selectedShipNameWithIndex
//     let draggedShip
//     let draggedShipLength


//     ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
//         selectedShipNameWithIndex = e.target.id
//         console.log(selectedShipNameWithIndex)
//     }))

//     function dragStart(e) {
//         draggedShip = this;
//         draggedShipLength = this.children.length;
//         console.log(draggedShip)
//         console.log(this.childNodes)
//     }

//     function dragOver(e) {
//         e.preventDefault();

//     }

//     function dragEnter(e) {
//         e.preventDefault();
//     }

//     function dragLeave(e) {
//         console.log('drag Leave')
//     }

//     function dragDrop() {
//         let shipNameWithLastId = draggedShip.lastElementChild.id
//         let shipClass = shipNameWithLastId.slice(0, -2);
//         console.log(shipClass);
//         let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
//         let shipLastId = lastShipIndex + parseInt(this.dataset.id)

//         //My logic for how check if beyond grid on vertical
//         // if (isHorizontal) {
//         //     shipLastId = lastShipIndex + parseInt(this.dataset.id)
//         // } else if (!isHorizontal) {
//         //     shipLastId = lastShipIndex * width + parseInt(this.dataset.id)
//         // }

//         console.log(shipLastId)

//         selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

//         shipLastId = shipLastId - selectedShipIndex;
//         console.log(shipLastId)
//         const notAllowedHorizontal = [
//             0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
//             1, 11, 21, 31, 41, 51, 61, 71, 81, 91,
//             2, 12, 22, 32, 42, 52, 62, 72, 82, 92,
//             3, 13, 23, 33, 43, 53, 63, 73, 83, 93
//         ]
//         const notAllowedVertical = [
//             99, 98, 97, 96, 95, 94, 93, 92, 91, 90,
//             89, 88, 87, 86, 85, 84, 83, 82, 81, 80,
//             79, 78, 77, 76, 75, 74, 73, 72, 71, 70,
//             69, 68, 67, 66, 65, 64, 63, 62, 61, 60
//         ]
//         let newNotAllowedHorizontal = notAllowedHorizontal.slice(0, 10 * lastShipIndex)
//         let newNotAllowedVertical = notAllowedVertical.slice(0, 10 * lastShipIndex)

//         if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
//             for (let i = 0; i < draggedShipLength; i++) {
//                 userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass)
//             }
//             //My logic for how to check if beyond grid
//             // } else if (!isHorizontal && !(shipLastId > 99)) {
//             //     for (let i = 0; i < draggedShipLength; i++) {
//             //         userSquares[parseInt(this.dataset.id) - selectedShipIndex + (i * width)].classList.add('taken', shipClass)
//             //     }
//             //&& !newNotAllowedVertical.includes(shipLastId)
//         } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
//             console.log('ship class')
//             for (let i = 0; i < draggedShipLength; i++) {
//                 userSquares[parseInt(this.dataset.id) - selectedShipIndex + (i * width)].classList.add('taken', shipClass)
//             }
//         } else {
//             return
//         }

//         displayGrid.removeChild(draggedShip)
//         if (!displayGrid.querySelector('.ship')) {
//             allShipsPlaced = true;
//         }
//     }

//     function dragEnd() {
//         console.log('dragend')
//     }
//     //Game Logic for MultiPlayer
//     function playGameMulti(socket) {
//         if (isGameOver) return
//         if (!ready) {
//             socket.emit('player-ready')
//             ready = true
//             playerReady(playerNum)
//         }
//         if (enemyReady) {
//             if (currentPlayer === 'user') {
//                 turnDisplay.innerHTML = 'your Go'
//             }
//             if (currentPlayer === 'enemy') {
//                 turnDisplay.innerHTML = "Enemy's go"
//             }
//         }
//     }

//     function playerReady(num) {
//         let player = `.p${parseInt(num) + 1}`
//         document.querySelector(`${player} .ready span`).classList.toggle('green')
//     }

//     //GAME LOGIC FOR SINGLE PLAYER
//     function playGameSingle() {
//         if (isGameOver) return
//         if (currentPlayer === 'user') {
//             turnDisplay.innerHTML = 'Your Go'
//             computerSquares.forEach(square => square.addEventListener('click', function (e) {
//                 shotFired = square.dataset.id;
//                 revealSquare(square.classList)
//             }))
//         }
//         if (currentPlayer === 'enemy') {
//             turnDisplay.innerHTML = "enemy's go"
//             //function enemyGo
//             setTimeout(enemyGo, 1000)
//         }
//     }


//     let destroyerCount = 0;
//     let submarineCount = 0;
//     let cruiserCount = 0;
//     let battleshipCount = 0;
//     let carrierCount = 0;


//     function revealSquare(classList) {
//         const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
//         const obj = Object.values(classList)
//         if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
//             if (obj.includes('destroyer')) destroyerCount++
//             if (obj.includes('submarine')) submarineCount++
//             if (obj.includes('cruiser')) cruiserCount++
//             if (obj.includes('battleship')) battleshipCount++
//             if (obj.includes('carrier')) carrierCount++
//         }
//         if (obj.includes('taken')) {
//             enemySquare.classList.add('boom')
//         } else {
//             enemySquare.classList.add('miss')
//         }
//         checkForWins()
//         currentPlayer = 'computer'
//         if (gameMode === 'singlePlayer') playGameSingle();
//     }

//     let cpuDestroyerCount = 0;
//     let cpuSubmarineCount = 0;
//     let cpuCruiserCount = 0;
//     let cpuBattleshipCount = 0;
//     let cpuCarrierCount = 0;

//     function enemyGo(square) {
//         if (gameMode === "singlePlayer") {
//             square = Math.floor(Math.random() * userSquares.length)
//         }
//         if (!userSquares[square].classList.contains('boom')) {
//             if (userSquares[square].classList.contains('taken')) {
//                 if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
//                 if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
//                 if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
//                 if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
//                 if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
//             }
//             userSquares[square].classList.add('boom');
//         } else if (gameMode === 'singlePlayer') {
//             enemyGo()
//         }
//         checkForWins()
//         currentPlayer = 'user';
//         turnDisplay.innerHTML = 'Enemy Go'

//     }

//     function checkForWins() {
//         let enemy = 'computer'
//         if (gameMode = 'multiPlayer') enemy = 'enemy'
//         if (destroyerCount === 2) {
//             infoDisplay.innerHTML = `you sunk the ${enemy}'s destoryer`
//             destroyerCount = 10
//         }
//         if (submarineCount === 3) {
//             infoDisplay.innerHTML = `you sunk the ${enemy}'s submarine`
//             submarineCount = 10
//         }
//         if (cruiserCount === 3) {
//             infoDisplay.innerHTML = `you sunk the ${enemy}'s cruiser`
//             cruiserCount = 10
//         }
//         if (battleshipCount === 4) {
//             infoDisplay.innerHTML = `you sunk the ${enemy}'s battleship`
//             battleshipCount = 10
//         }
//         if (carrierCount === 5) {
//             infoDisplay.innerHTML = `you sunk the ${enemy}'s carrier`
//             carrierCount = 10
//         }
//         if (cpuDestroyerCount === 2) {
//             infoDisplay.innerHTML = `${enemy} sunk your destroyer `
//             cpuDestroyerCount = 10
//         }
//         if (cpuSubmarineCount === 3) {
//             infoDisplay.innerHTML = `${enemy} sunk your submarine `
//             cpuSubmarineCount = 10
//         }
//         if (cpuCruiserCount === 3) {
//             infoDisplay.innerHTML = `${enemy} sunk your cruiser ${enemy} sunk your`
//             cpuCruiserCount = 10
//         }
//         if (cpuBattleshipCount === 4) {
//             infoDisplay.innerHTML = `${enemy} sunk your battleship`
//             cpuBattleshipCount = 10
//         }
//         if (cpuCarrierCount === 5) {
//             infoDisplay.innerHTML = `${enemy} sunk your carrier`
//             cpuCarrierCount = 10
//         }
//         if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
//             infoDisplay.innerHTML = 'YOU WIN';
//             gameOver();
//         }
//         if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
//             infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`;
//             gameOver();
//         }
//     }
//     function gameOver() {
//         isGameOver = startButton.removeEventListener('click', playGameSingle)
//     }

// })
