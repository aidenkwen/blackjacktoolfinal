// src/components/pages/RegistrationPage.jsx - Updated for Power Automate
import React, { useState } from 'react';
import { normalizeAccount, amountsMatch, UC } from '../../utils/formatting';
import { callPowerAutomate, POWER_AUTOMATE_FLOWS } from '../../config/powerAutomate';
import SearchBar from '../common/SearchBar';
import NewPlayerForm from '../forms/NewPlayerForm';
import PaymentCard from '../cards/PaymentCard';
import MulliganCard from '../cards/MulliganCard';
import PlayerInfoCard from '../cards/PlayerInfoCard';
import LastPlayerCard from '../cards/LastPlayerCard';

const RegistrationPage = ({
  selectedEvent,
  employee,
  tournaments,
  masterData,
  setMasterData,
  registrations,
  setRegistrations,
  setCurrentPage
}) => {
  const [activeTab, setActiveTab] = useState('registration');
  const [searchAccount, setSearchAccount] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);

  // Main payment state
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');

  // Mulligan payment state
  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState('100');
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');

  const [comments, setComments] = useState('');
  const [host, setHost] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [showLastPlayer, setShowLastPlayer] = useState(true);

  // Filter registrations for current tournament only
  const currentTournamentRegistrations = registrations.filter(r => r.eventName === selectedEvent);

  // Get tournament costs
  const getCurrentTournament = () => {
    const defaultTournament = { entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    const customTournament = tournaments.find(t => t.name === selectedEvent);
    return customTournament || defaultTournament;
  };

  const currentTournament = getCurrentTournament();

  const rounds = [
    { key: 'round1', name: 'Round 1', isRebuy: false },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true },
    { key: 'round2', name: 'Round 2', isRebuy: false },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false }
  ];

  // Helper function to get player's most recent entry type from registrations
  const getPlayerEntryType = (playerAccountNumber) => {
    const playerRegistrations = currentTournamentRegistrations
      .filter(r => normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber))
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    
    if (playerRegistrations.length > 0) {
      const mostRecent = playerRegistrations[0];
      // Check if eventType indicates COMP
      return mostRecent.eventType === 'COMP' || mostRecent.eventType.includes('COMP') ? 'COMP' : 'PAY';
    }
    
    // Fall back to master data if no registrations found
    const player = masterData.find(p => 
      normalizeAccount(p.PlayerAccountNumber) === normalizeAccount(playerAccountNumber)
    );
    
    if (player && player.EntryType === 'COMP') {
      return 'COMP';
    }
    
    return 'PAY'; // Default if no registrations found and not COMP in master data
  };

  // Helper functions
  const shouldShowPaymentCard = () => {
    return activeTab === 'registration' || 
           (activeTab === 'post-registration' && 
            selectedRound !== 'round1' && 
            rounds.find(r => r.key === selectedRound)?.isRebuy);
  };

  const isRegisteredRound1 = acct => {
    const normalizedAcct = normalizeAccount(acct);
    return currentTournamentRegistrations.some(
      r => normalizeAccount(r.playerAccountNumber) === normalizedAcct && r.round === 'round1'
    );
  };

  const isRegisteredRebuy1 = acct => {
    const normalizedAcct = normalizeAccount(acct);
    return currentTournamentRegistrations.some(
      r => normalizeAccount(r.playerAccountNumber) === normalizedAcct && r.round === 'rebuy1'
    );
  };

  const getPaymentTypes = () => {
    const baseTypes = ['Cash', 'Credit', 'Chips'];
    if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
      return ['Cash', 'Credit', 'Chips', 'Comp'];
    }
    return baseTypes;
  };

  const canAddNewPlayers = () => {
    return activeTab === 'registration';
  };

  const fmtTypes = (t1, t2) => (t2 ? `${t1}+${t2}` : t1);

  const getLastRegisteredPlayer = () => {
    let contextRegistrations = [];
    let roundContext = '';
    
    if (activeTab === 'registration') {
      contextRegistrations = currentTournamentRegistrations.filter(r => r.round === 'round1');
      roundContext = 'Round 1';
    } else if (selectedRound) {
      contextRegistrations = currentTournamentRegistrations.filter(r => r.round === selectedRound);
      const roundInfo = rounds.find(r => r.key === selectedRound);
      roundContext = roundInfo ? roundInfo.name : selectedRound;
    }
    
    if (contextRegistrations.length === 0) return null;
    
    const lastReg = contextRegistrations[contextRegistrations.length - 1];
    const playerTransactions = contextRegistrations.filter(r => 
      r.playerAccountNumber === lastReg.playerAccountNumber
    );
    
    const purchases = [];
    playerTransactions.forEach(t => {
      let purchaseDesc = '';
      if (t.isRebuy) {
        purchaseDesc = `Rebuy (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else if (t.isMulligan) {
        purchaseDesc = `Mulligan (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else if (!t.isRebuy && !t.isMulligan && activeTab === 'registration') {
        purchaseDesc = `Registration (${fmtTypes(t.paymentType, t.paymentType2)})`;
      }

      if (purchaseDesc) purchases.push(purchaseDesc);
    });
    
    return {
      accountNumber: lastReg.playerAccountNumber,
      name: `${lastReg.firstName} ${lastReg.lastName}`,
      purchases: purchases.length > 0 ? purchases.join(', ') : 'Registration',
      roundContext: roundContext
    };
  };

  const clearForm = () => {
    setPaymentType('');
    setPaymentAmount('');
    setSplitPayment(false);
    setPaymentType2('');
    setPaymentAmount2('');
    setAddMulligan(false);
    setMulliganPaymentType('');
    setMulliganAmount(currentTournament.mulliganCost.toString());
    setSplitMulliganPayment(false);
    setMulliganPaymentType2('');
    setMulliganAmount2('');
    setComments('');
    setHost('');
  };

  // Helper function to check for 0 amounts in split payments
  const checkForZeroAmounts = (amount1, amount2, paymentDescription) => {
    const amt1 = parseInt(amount1) || 0;
    const amt2 = parseInt(amount2) || 0;
    
    if (amt1 === 0 || amt2 === 0) {
      alert(`Both payment amounts must be greater than 0 for split ${paymentDescription} payments.`);
      return false;
    }
    return true;
  };

  const searchPlayer = () => {
    const accountNum = searchAccount.trim();
    if (!accountNum) return;

    // Hide last player card when searching
    setShowLastPlayer(false);

    // Clear form first
    clearForm();

    // Validate the input before normalizing
    if (!/^\d+$/.test(accountNum)) {
      alert('Player account number must contain only numbers.');
      return;
    }

    if (accountNum.length === 1) {
      alert('Player account number cannot be just 1 digit. Please enter the full 14-digit account number.');
      return;
    }

    if (accountNum.length !== 14) {
      alert(`Player account number must be exactly 14 digits. You entered ${accountNum.length} digits.`);
      return;
    }

    const normalizedInput = normalizeAccount(accountNum);

    if (activeTab === 'post-registration' && selectedRound === '') {
      alert('Please select a round first.');
      return;
    }

    const player = masterData.find((p) => {
      const potentialFields = [
        p.PlayerAccountNumber,
        p['Player Account Number'],
        p.playerAccountNumber,
        p.AccountNumber
      ];
      return potentialFields.some((field) => 
        normalizeAccount(field) === normalizedInput
      );
    });

    if (player) {
      // Check if player needs to be registered for Round 1 first (for non-Round 1 rounds)
      if (
        activeTab === 'post-registration' &&
        selectedRound !== 'round1' &&
        !isRegisteredRound1(player.PlayerAccountNumber)
      ) {
        alert(
          'That player is not registered in ROUND 1 yet. Register them first before adding rebuys or mulligans.'
        );
        return;
      }

      // Check if player needs to be registered for Rebuy 1 before Rebuy 2
      if (
        activeTab === 'post-registration' &&
        selectedRound === 'rebuy2' &&
        !isRegisteredRebuy1(player.PlayerAccountNumber)
      ) {
        alert(
          'That player is not registered in REBUY 1 yet. Register them for Rebuy 1 first before adding Rebuy 2.'
        );
        return;
      }

      // Player found and passed validation - set up the player
      setCurrentPlayer(player);
      setShowNewPlayerForm(false);
      setHost(player.Host || '');
      
      // Get entry type from registrations instead of masterData
      const playerEntryType = getPlayerEntryType(player.PlayerAccountNumber);
      
      // Pre-populate with their last payment type, but allow changes
      if (playerEntryType === 'COMP' && (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1'))) {
        setPaymentType('Comp');
        setPaymentAmount('0');
      } else {
        setPaymentType('');
        if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
          setPaymentAmount(currentTournament.entryCost.toString());
        } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
          setPaymentAmount(currentTournament.rebuyCost.toString());
        }
      }
      setMulliganAmount(currentTournament.mulliganCost.toString());
    } else {
      // Player not found
      if (canAddNewPlayers()) {
        setCurrentPlayer(null);
        setShowNewPlayerForm(true);
        setHost('');
      } else {
        alert(`Player not found. \nNew players can only be added in the Registration tab.`);
        setCurrentPlayer(null);
        setShowNewPlayerForm(false);
      }
    }
  };

  const handleNewPlayerSave = async (newPlayer, registerForRound1, registrationData) => {
    if (
      masterData.some(
        p =>
          normalizeAccount(p.PlayerAccountNumber) ===
          normalizeAccount(newPlayer.PlayerAccountNumber)
      )
    ) {
      alert('That account is already in your master list.');
      return;
    }

    try {
      // Add player to SharePoint List via Power Automate
      const addPlayerResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.uploadPlayers, {
        action: 'add_single_player',
        eventName: selectedEvent,
        player: newPlayer
      });

      if (!addPlayerResult.success) {
        throw new Error(addPlayerResult.error || 'Failed to add player');
      }

      setMasterData([...masterData, newPlayer]);
      
      if (registerForRound1) {
        let required = currentTournament.entryCost;
        if (registrationData.paymentType === 'Comp') required = 0;

        // Check for 0 amounts in split payment
        if (registrationData.splitPayment) {
          if (!checkForZeroAmounts(registrationData.paymentAmount, registrationData.paymentAmount2, 'registration')) {
            return;
          }
        }

        const totalPayment = registrationData.splitPayment 
          ? (parseInt(registrationData.paymentAmount) || 0) + (parseInt(registrationData.paymentAmount2) || 0)
          : (parseInt(registrationData.paymentAmount) || 0);

        if (!amountsMatch(required, totalPayment)) {
          alert(`Round-1 payment must add up to $${required}.`);
          return;
        }

        if (registrationData.addMulligan) {
          const need = currentTournament.mulliganCost;
          
          // Check for 0 amounts in split mulligan payment
          if (registrationData.splitMulliganPayment) {
            if (!checkForZeroAmounts(registrationData.mulliganAmount, registrationData.mulliganAmount2, 'mulligan')) {
              return;
            }
          }

          const totalMulliganPayment = registrationData.splitMulliganPayment
            ? (parseInt(registrationData.mulliganAmount) || 0) + (parseInt(registrationData.mulliganAmount2) || 0)
            : (parseInt(registrationData.mulliganAmount) || 0);
          
          if (!amountsMatch(need, totalMulliganPayment)) {
            alert(`Mulligan payment must be exactly ${need}.`);
            return;
          }
        }

        // Filter existing registrations for this tournament and player
        const filteredRegistrations = registrations.filter(r => 
          !(r.playerAccountNumber === newPlayer.PlayerAccountNumber && r.round === 'round1' && r.eventName === selectedEvent)
        );

        const newRegs = [];
        
        // Determine event type format
        let eventType;
        if (registrationData.paymentType === 'Comp') {
          eventType = 'COMP $0';
        } else {
          const totalAmount = registrationData.splitPayment 
            ? (parseInt(registrationData.paymentAmount) || 0) + (parseInt(registrationData.paymentAmount2) || 0)
            : (parseInt(registrationData.paymentAmount) || 0);
          eventType = `PAY ${totalAmount}`;
        }
        
        const registration = {
          id: Date.now(),
          playerAccountNumber: newPlayer.PlayerAccountNumber,
          firstName: newPlayer.FirstName,
          lastName: newPlayer.LastName,
          eventName: selectedEvent,
          eventType: eventType,
          paymentType: registrationData.paymentType,
          paymentAmount: parseInt(registrationData.paymentAmount) || 0,
          paymentType2: registrationData.splitPayment ? registrationData.paymentType2 : null,
          paymentAmount2: registrationData.splitPayment ? (parseInt(registrationData.paymentAmount2) || 0) : null,
          registrationDate: new Date().toISOString(),
          host: registrationData.host,
          comment: registrationData.comments,
          round: 'round1',
          employee: employee,
          isRebuy: false,
          isMulligan: false
        };
        
        // Send registration to Power Automate
        const regResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
          action: 'add_registration',
          registration: registration
        });

        if (regResult.success) {
          newRegs.push(registration);
        } else {
          throw new Error(regResult.error || 'Failed to add registration');
        }

        if (registrationData.addMulligan) {
          const mulliganReg = {
            id: Date.now() + 1,
            playerAccountNumber: newPlayer.PlayerAccountNumber,
            firstName: newPlayer.FirstName,
            lastName: newPlayer.LastName,
            eventName: selectedEvent,
            eventType: 'MULLIGAN',
            paymentType: registrationData.mulliganPaymentType,
            paymentAmount: parseInt(registrationData.mulliganAmount) || 0,
            paymentType2: registrationData.splitMulliganPayment ? registrationData.mulliganPaymentType2 : null,
            paymentAmount2: registrationData.splitMulliganPayment ? (parseInt(registrationData.mulliganAmount2) || 0) : null,
            registrationDate: new Date().toISOString(),
            host: registrationData.host,
            comment: registrationData.comments,
            round: 'round1',
            employee: employee,
            isRebuy: false,
            isMulligan: true
          };
          
          // Send mulligan registration to Power Automate
          const mulliganResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
            action: 'add_registration',
            registration: mulliganReg
          });

          if (mulliganResult.success) {
            newRegs.push(mulliganReg);
          } else {
            throw new Error(mulliganResult.error || 'Failed to add mulligan registration');
          }
        }
        
        setRegistrations([...filteredRegistrations, ...newRegs]);
      }

      setSearchAccount('');
      setShowNewPlayerForm(false);
      setCurrentPlayer(null);
      
      // Only show last player card if they registered for Round 1
      if (registerForRound1) {
        setShowLastPlayer(true);
      }

    } catch (error) {
      console.error('Error saving new player:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleNewPlayerCancel = () => {
    setShowNewPlayerForm(false);
    setSearchAccount('');
  };

  const handlePaymentTypeChange = (newPaymentType) => {
    setPaymentType(newPaymentType);
    
    if (newPaymentType === 'Comp') {
      setPaymentAmount('0');
    } else if (paymentType === 'Comp' || paymentAmount === '0') {
      if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
        setPaymentAmount(currentTournament.entryCost.toString());
      } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
        setPaymentAmount(currentTournament.rebuyCost.toString());
      }
    }
  };

  const handleRegistration = async () => {
    if (!currentPlayer) return;

    const roundKey = activeTab === 'registration' ? 'round1' : selectedRound;
    const alreadyBaseReg = currentTournamentRegistrations.some(
      r =>
        r.playerAccountNumber === currentPlayer.PlayerAccountNumber &&
        r.round === roundKey &&
        !r.isRebuy &&
        !r.isMulligan
    );

    // Allow reregistrations on Round 1 - no alert, just overwrite
    if (alreadyBaseReg && activeTab === 'post-registration' && selectedRound === 'round1' && !addMulligan) {
      alert('That player already has a Round 1 registration. You can only add mulligans.');
      return;
    }

    if (
      activeTab === 'post-registration' &&
      !isRegisteredRound1(currentPlayer.PlayerAccountNumber)
    ) {
      alert('Player must be registered in ROUND 1 before any Post-Registration actions.');
      return;
    }

    // Check if player needs to be registered for Rebuy 1 before Rebuy 2
    if (
      activeTab === 'post-registration' &&
      selectedRound === 'rebuy2' &&
      !isRegisteredRebuy1(currentPlayer.PlayerAccountNumber)
    ) {
      alert('That player is not registered in REBUY 1 yet. Register them for Rebuy 1 first before adding Rebuy 2.');
      return;
    }

    const currentRoundInfo =
      activeTab === 'registration'
        ? { key: 'round1', isRebuy: false }
        : rounds.find(r => r.key === selectedRound);
    const isRebuyRound = currentRoundInfo?.isRebuy || false;

    // Validations
    if (activeTab === 'registration') {
      if (!paymentType) {
        alert('Please select a payment type for registration.');
        return;
      }
      if (paymentType !== 'Comp' && !paymentAmount) {
        alert('Please enter the registration amount.');
        return;
      }
      if (splitPayment && (!paymentType2 || (paymentType2 !== 'Comp' && !paymentAmount2))) {
        alert('Please complete both parts of the split payment.');
        return;
      }
      // Check for 0 amounts in split payment
      if (splitPayment && !checkForZeroAmounts(paymentAmount, paymentAmount2, 'registration')) {
        return;
      }
    } else if (activeTab === 'post-registration' && selectedRound === 'round1' && !addMulligan) {
      alert('Please select "Include Mulligan" to add a mulligan for this player.');
      return;
    }

    if (
      activeTab === 'post-registration' &&
      selectedRound !== 'round1' &&
      isRebuyRound
    ) {
      if (!paymentType) {
        alert('Please select a payment type for the rebuy.');
        return;
      }
      if (!paymentAmount) {
        alert('Please enter the rebuy amount.');
        return;
      }
      if (splitPayment && (!paymentType2 || !paymentAmount2)) {
        alert('Please complete both parts of the split rebuy payment.');
        return;
      }
      // Check for 0 amounts in split rebuy payment
      if (splitPayment && !checkForZeroAmounts(paymentAmount, paymentAmount2, 'rebuy')) {
        return;
      }
    }

    if (addMulligan) {
      if (!mulliganPaymentType) {
        alert('Please select a payment type for the mulligan.');
        return;
      }
      if (!mulliganAmount) {
        alert('Please enter an amount for the mulligan.');
        return;
      }
      if (splitMulliganPayment && (!mulliganPaymentType2 || !mulliganAmount2)) {
        alert('Please complete both parts of the split mulligan payment.');
        return;
      }
      // Check for 0 amounts in split mulligan payment
      if (splitMulliganPayment && !checkForZeroAmounts(mulliganAmount, mulliganAmount2, 'mulligan')) {
        return;
      }
    }

    // Payment validation
    const needsMainPayment = (
      (activeTab === 'registration') ||
      (activeTab === 'post-registration' && selectedRound !== 'round1' && rounds.find(r => r.key === selectedRound)?.isRebuy)
    );

    if (needsMainPayment) {
      let required = 0;
      if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
        required = currentTournament.entryCost;
      } else if (rounds.find(r => r.key === selectedRound)?.isRebuy) {
        required = currentTournament.rebuyCost;
      }
      // Only set required to 0 if payment type is actually 'Comp'
      if (paymentType === 'Comp') required = 0;

      if (!amountsMatch(required, paymentAmount, splitPayment ? paymentAmount2 : 0)) {
        alert(`Payments must add up to ${required}.`);
        return;
      }
    } else if (activeTab === 'post-registration' && !addMulligan) {
      alert('Please select either a mulligan or go to a rebuy round to make a registration.');
      return;
    }

    if (addMulligan) {
      const need = currentTournament.mulliganCost;
      if (!amountsMatch(need, mulliganAmount, splitMulliganPayment ? mulliganAmount2 : 0)) {
        alert(`Mulligan payments must add up to ${need}.`);
        return;
      }
    }

    try {
      // Filter existing registrations - only remove from current tournament
      const filteredRegistrations = registrations.filter(r => {
        // Keep all registrations from other tournaments
        if (r.eventName !== selectedEvent) {
          return true;
        }
        
        // For current tournament, apply existing filtering logic
        if (r.playerAccountNumber !== currentPlayer.PlayerAccountNumber || r.round !== roundKey) {
          return true;
        }
        
        if (!r.isRebuy && !r.isMulligan && activeTab === 'registration') {
          return false;
        }
        
        if (r.isRebuy && !r.isMulligan && 
            activeTab === 'post-registration' && 
            selectedRound !== 'round1' && 
            rounds.find(round => round.key === selectedRound)?.isRebuy) {
          return false;
        }
        
        if (r.isMulligan && addMulligan) {
          return false;
        }
        
        return true;
      });

      const newRegs = [];

      // Build registration objects
      if (activeTab === 'registration') {
        // Determine event type format
        let eventType;
        if (paymentType === 'Comp') {
          eventType = 'COMP $0';
        } else {
          const totalAmount = splitPayment 
            ? (parseInt(paymentAmount) || 0) + (parseInt(paymentAmount2) || 0)
            : (parseInt(paymentAmount) || 0);
          eventType = `PAY ${totalAmount}`;
        }

        const baseReg = {
          id: Date.now(),
          playerAccountNumber: currentPlayer.PlayerAccountNumber,
          firstName: currentPlayer.FirstName,
          lastName: currentPlayer.LastName,
          eventName: selectedEvent,
          eventType: eventType,
          paymentType,
          paymentAmount: parseInt(paymentAmount) || 0,
          paymentType2: splitPayment ? paymentType2 : null,
          paymentAmount2: splitPayment ? parseInt(paymentAmount2) || 0 : null,
          registrationDate: new Date().toISOString(),
          host: host,
          comment: comments,
          round: 'round1',
          employee,
          isRebuy: false,
          isMulligan: false,
        };
        
        // Send to Power Automate
        const regResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
          action: 'add_registration',
          registration: baseReg
        });

        if (regResult.success) {
          newRegs.push(baseReg);
        } else {
          throw new Error(regResult.error || 'Failed to add registration');
        }
      }

      if (
        activeTab === 'post-registration' &&
        selectedRound !== 'round1' &&
        isRebuyRound
      ) {
        const totalAmount = splitPayment 
          ? (parseInt(paymentAmount) || 0) + (parseInt(paymentAmount2) || 0)
          : (parseInt(paymentAmount) || 0);

        const rebuyReg = {
          id: Date.now(),
          playerAccountNumber: currentPlayer.PlayerAccountNumber,
          firstName: currentPlayer.FirstName,
          lastName: currentPlayer.LastName,
          eventName: selectedEvent,
          eventType: `REBUY ${totalAmount}`,
          paymentType: paymentType,
          paymentAmount: parseInt(paymentAmount) || 0,
          paymentType2: splitPayment ? paymentType2 : null,
          paymentAmount2: splitPayment ? parseInt(paymentAmount2) || 0 : null,
          registrationDate: new Date().toISOString(),
          host: host,
          comment: comments,
          round: selectedRound,
          employee: employee,
          isRebuy: true,
          isMulligan: false
        };
        
        // Send to Power Automate
        const rebuyResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
          action: 'add_registration',
          registration: rebuyReg
        });

        if (rebuyResult.success) {
          newRegs.push(rebuyReg);
        } else {
          throw new Error(rebuyResult.error || 'Failed to add rebuy registration');
        }
      }

      if (addMulligan) {
        const mulliganReg = {
          id: Date.now() + 1,
          playerAccountNumber: currentPlayer.PlayerAccountNumber,
          firstName: currentPlayer.FirstName,
          lastName: currentPlayer.LastName,
          eventName: selectedEvent,
          eventType: 'MULLIGAN',
          paymentType: mulliganPaymentType,
          paymentAmount: parseInt(mulliganAmount) || 0,
          paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null,
          paymentAmount2: splitMulliganPayment ? parseInt(mulliganAmount2) || 0 : null,
          registrationDate: new Date().toISOString(),
          host: host,
          comment: comments,
          round: roundKey,
          employee: employee,
          isRebuy: activeTab === 'post-registration' && selectedRound !== 'round1' && isRebuyRound,
          isMulligan: true
        };
        
        // Send to Power Automate
        const mulliganResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
          action: 'add_registration',
          registration: mulliganReg
        });

        if (mulliganResult.success) {
          newRegs.push(mulliganReg);
        } else {
          throw new Error(mulliganResult.error || 'Failed to add mulligan registration');
        }
      }

      setRegistrations([...filteredRegistrations, ...newRegs]);

      // Reset form
      setSearchAccount('');
      setCurrentPlayer(null);
      clearForm();
      setShowLastPlayer(true); // Show last player card again after successful registration

    } catch (error) {
      console.error('Error during registration:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const lastPlayer = getLastRegisteredPlayer();

  return (
    <div className="container">
      <button
        onClick={() => setCurrentPage(0)}
        className="link-back link-back-block"
      >
        {'<'} Back to Event Selection
      </button>

      {/* Updated Event Title & Employee Layout */}
      <div className="title-with-inline">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className="page-title">{selectedEvent}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p className="subheading">
                {(() => {
                  const registrationCount = currentTournamentRegistrations.filter(r => r.round === 'round1' && !r.isMulligan).length;
                  return `${registrationCount} total registration${registrationCount === 1 ? '' : 's'}`;
                })()}, Employee: {employee}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage(3)}
            className="btn btn-primary"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'registration' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('registration');
            setSearchAccount('');
            setCurrentPlayer(null);
            setShowNewPlayerForm(false);
            setShowLastPlayer(true);
          }}
        >
          Registration
        </div>
        <div
          className={`tab ${activeTab === 'post-registration' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('post-registration');
            setSearchAccount('');
            setCurrentPlayer(null);
            setShowNewPlayerForm(false);
            setShowLastPlayer(true);
          }}
        >
          Post-Registration
        </div>
      </div>

      {/* Select Round */}
      {activeTab === 'post-registration' && (
        <div className="form-group">
          <label className="mb-2">Select Round</label>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="select-field"
          >
            <option value="">-- Select Round --</option>
            {rounds.map((round) => (
              <option key={round.key} value={round.key}>
                {round.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <SearchBar
        searchValue={searchAccount}
        onSearchChange={setSearchAccount}
        onSearch={searchPlayer}
        placeholder="Enter 14-digit Player Account Number"
      />

      {showLastPlayer && <LastPlayerCard lastPlayer={lastPlayer} />}

      {/* New Player Form */}
      {showNewPlayerForm && (
        <NewPlayerForm
          accountNumber={searchAccount}
          currentTournament={currentTournament}
          onSave={handleNewPlayerSave}
          onCancel={handleNewPlayerCancel}
          selectedEvent={selectedEvent}
          employee={employee}
          host={host}
          setHost={setHost}
          comments={comments}
          setComments={setComments}
          canRegisterForRound1={canAddNewPlayers()}
        />
      )}

      {/* Player Found - Show Forms */}
      {currentPlayer && (
        <div>
          <PlayerInfoCard 
            currentPlayer={currentPlayer} 
            activeTab={activeTab} 
            selectedRound={selectedRound} 
          />

          {shouldShowPaymentCard() && (
            <PaymentCard
              activeTab={activeTab}
              selectedRound={selectedRound}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              splitPayment={splitPayment}
              setSplitPayment={setSplitPayment}
              paymentType2={paymentType2}
              setPaymentType2={setPaymentType2}
              paymentAmount2={paymentAmount2}
              setPaymentAmount2={setPaymentAmount2}
              currentPlayer={null} // Don't pass player to avoid COMP restrictions
              currentTournament={currentTournament}
              getPaymentTypes={getPaymentTypes}
              handlePaymentTypeChange={handlePaymentTypeChange}
            />
          )}

          <MulliganCard
            addMulligan={addMulligan}
            setAddMulligan={setAddMulligan}
            mulliganPaymentType={mulliganPaymentType}
            setMulliganPaymentType={setMulliganPaymentType}
            mulliganAmount={mulliganAmount}
            setMulliganAmount={setMulliganAmount}
            splitMulliganPayment={splitMulliganPayment}
            setSplitMulliganPayment={setSplitMulliganPayment}
            mulliganPaymentType2={mulliganPaymentType2}
            setMulliganPaymentType2={setMulliganPaymentType2}
            mulliganAmount2={mulliganAmount2}
            setMulliganAmount2={setMulliganAmount2}
            currentTournament={currentTournament}
          />

          {/* Host & Comments */}
          {activeTab === 'registration' && (
            <div className="form-group">
              <label className="mb-2">Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(UC(e.target.value))}
                className="input-field"
                placeholder="Enter host name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="mb-2">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(UC(e.target.value))}
              className="textarea-field"
              rows="3"
            />
          </div>

          <button
            onClick={handleRegistration}
            className="btn btn-success"
          >
            {(() => {
              if (activeTab === 'registration') {
                return addMulligan ? 'Register Player and Add Mulligan' : 'Register Player';
              }
              
              const currentRoundInfo = rounds.find(r => r.key === selectedRound);
              const isRebuyRound = currentRoundInfo?.isRebuy || false;
              
              if (isRebuyRound) {
                return addMulligan ? 'Add Rebuy and Mulligan' : 'Add Rebuy';
              } else {
                return 'Add Mulligan';
              }
            })()}
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;