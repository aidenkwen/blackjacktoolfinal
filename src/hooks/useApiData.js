// src/hooks/useApiData.js - Updated for Power Automate
import { useState, useEffect } from 'react';
import { POWER_AUTOMATE_FLOWS, callPowerAutomate, uploadToSharePoint } from '../config/powerAutomate';

// Custom hook to replace useLocalStorage for tournaments
export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await callPowerAutomate(POWER_AUTOMATE_FLOWS.getTournaments, {
        action: 'get_tournaments'
      });
      
      setTournaments(data.tournaments || []);
      return data.tournaments || [];
    } catch (err) {
      setError(err.message);
      console.error('Error loading tournaments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addTournament = async (tournament) => {
    try {
      setError(null);
      
      const result = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addTournament, {
        action: 'add_tournament',
        tournament: {
          name: tournament.name,
          entryCost: parseInt(tournament.entryCost) || 500,
          rebuyCost: parseInt(tournament.rebuyCost) || 500,
          mulliganCost: parseInt(tournament.mulliganCost) || 100
        }
      });
      
      if (result.success) {
        const newTournament = result.tournament;
        setTournaments(prev => [newTournament, ...prev]);
        return newTournament;
      } else {
        throw new Error(result.error || 'Failed to add tournament');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTournament = async (tournamentId) => {
    try {
      setError(null);
      
      const result = await callPowerAutomate(POWER_AUTOMATE_FLOWS.deleteTournament, {
        action: 'delete_tournament',
        tournamentId: tournamentId
      });
      
      if (result.success) {
        setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      } else {
        throw new Error(result.error || 'Failed to delete tournament');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  return {
    tournaments,
    setTournaments,
    loading,
    error,
    loadTournaments,
    addTournament,
    deleteTournament
  };
};

// Custom hook to replace useLocalStorage for tournament players
export const useTournamentPlayers = (selectedEvent) => {
  const [tournamentPlayers, setTournamentPlayers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlayers = async (eventName) => {
    if (!eventName) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await callPowerAutomate(POWER_AUTOMATE_FLOWS.getPlayers, {
        action: 'get_players',
        eventName: eventName
      });
      
      const players = data.players || [];
      
      setTournamentPlayers(prev => ({
        ...prev,
        [eventName]: players
      }));
      
      return players;
    } catch (err) {
      setError(err.message);
      console.error('Error loading players:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTournamentPlayers = () => {
    return selectedEvent ? tournamentPlayers[selectedEvent] || [] : [];
  };

  const setCurrentTournamentPlayers = (players) => {
    if (selectedEvent) {
      setTournamentPlayers(prev => ({
        ...prev,
        [selectedEvent]: players
      }));
    }
  };

  const uploadPlayersFile = async (eventName, file) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📁 Starting upload for ${eventName}...`);
      
      // Use SharePoint upload helper
      const result = await uploadToSharePoint(file, eventName);
      
      // Reload players after successful upload
      await loadPlayers(eventName);
      
      console.log(`✅ Upload completed: ${result.recordsInserted} records`);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load players when selectedEvent changes
  useEffect(() => {
    if (selectedEvent && !tournamentPlayers[selectedEvent]) {
      loadPlayers(selectedEvent);
    }
}, [selectedEvent, tournamentPlayers]);

  return {
    tournamentPlayers,
    setTournamentPlayers,
    getCurrentTournamentPlayers,
    setCurrentTournamentPlayers,
    uploadPlayersFile,
    loading,
    error
  };
};

// Custom hook to replace useLocalStorage for registrations
export const useRegistrations = (selectedEvent) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRegistrations = async (eventName) => {
    if (!eventName) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await callPowerAutomate(POWER_AUTOMATE_FLOWS.getRegistrations, {
        action: 'get_registrations',
        eventName: eventName
      });
      
      const regs = data.registrations || [];
      setRegistrations(regs);
      return regs;
    } catch (err) {
      setError(err.message);
      console.error('Error loading registrations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addRegistration = async (registration) => {
    try {
      setError(null);
      
      const result = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addRegistration, {
        action: 'add_registration',
        registration: {
          ...registration,
          id: Date.now(), // Generate client-side ID
          registrationDate: new Date().toISOString()
        }
      });
      
      if (result.success) {
        const newRegistration = result.registration;
        setRegistrations(prev => [...prev, newRegistration]);
        return newRegistration;
      } else {
        throw new Error(result.error || 'Failed to add registration');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Load registrations when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      loadRegistrations(selectedEvent);
    }
  }, [selectedEvent]);

  return {
    registrations,
    setRegistrations,
    loading,
    error,
    loadRegistrations,
    addRegistration
  };
};