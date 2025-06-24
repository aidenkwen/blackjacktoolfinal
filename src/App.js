// src/App.js - Updated for Power Automate
import React, { useState } from 'react';
import './Blackjack.css';
import { useTournaments, useTournamentPlayers, useRegistrations } from './hooks/useApiData';
import EventSelectionPage from './components/pages/EventSelectionPage';
import AddTournamentPage from './components/pages/AddTournamentPage';
import ManageTournamentsPage from './components/pages/ManageTournamentsPage';
import RegistrationPage from './components/pages/RegistrationPage';
import ExportPage from './components/pages/ExportPage';

const BlackjackRegistrationTool = () => {
  // Page navigation (0 = EventSelectionPage, 0.5 = AddTournamentPage, 1 = RegistrationPage, 3 = ExportPage)
  const [currentPage, setCurrentPage] = useState(0);

  // Global state
  const [selectedEvent, setSelectedEvent] = useState('');
  const [employee, setEmployee] = useState('');

  // Power Automate hooks (replacing database calls)
  const { 
    tournaments, 
    loading: tournamentsLoading, 
    error: tournamentsError, 
    addTournament, 
    deleteTournament 
  } = useTournaments();

  const { 
    tournamentPlayers, 
    setTournamentPlayers,
    getCurrentTournamentPlayers, 
    setCurrentTournamentPlayers,
    uploadPlayersFile,
    loading: playersLoading,
    error: playersError 
  } = useTournamentPlayers(selectedEvent);

  const { 
    registrations, 
    setRegistrations,
    addRegistration,
    loading: registrationsLoading,
    error: registrationsError 
  } = useRegistrations(selectedEvent);

  // Export backup functionality (will export to CSV/Excel instead of SQL)
  const exportBackup = () => {
    // Create a comprehensive export of all data
    const allData = {
      tournaments,
      players: tournamentPlayers,
      registrations,
      exportDate: new Date().toISOString(),
      employee: employee
    };
    
    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackjack_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('Backup exported successfully! This JSON file contains all your tournament data.');
  };

  // Import backup functionality
  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        const confirmed = window.confirm(
          'This will restore data from a backup file. Some current data may be overwritten. Continue?'
        );
        
        if (confirmed) {
          // Note: In a real implementation, you'd send this to Power Automate flows
          // to restore the data to SharePoint Lists
          alert('Import functionality: Would send data to Power Automate flows to restore to SharePoint Lists');
          console.log('Backup data to restore:', backupData);
        }
      } catch (error) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Clear all data functionality
  const clearAllData = () => {
    const confirmed = window.confirm(
      'This will delete ALL tournaments, players, and registrations from SharePoint. This cannot be undone. Are you sure?'
    );
    
    if (confirmed) {
      alert('Clear all data: Would send commands to Power Automate flows to clear all SharePoint Lists');
      // Note: In a real implementation, you'd call Power Automate flows to clear the lists
    }
  };

  // Handle any Power Automate errors
  if (tournamentsError || playersError || registrationsError) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h3>Power Automate Connection Error</h3>
          <p>{tournamentsError || playersError || registrationsError}</p>
          <p>Please check:</p>
          <ul>
            <li>Your Power Automate flow URLs are correct in config/powerAutomate.js</li>
            <li>The flows are turned on and accessible</li>
            <li>Your SharePoint Lists are properly configured</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentPage === 0 && (
        <EventSelectionPage
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          employee={employee}
          setEmployee={setEmployee}
          tournaments={tournaments}
          loading={tournamentsLoading}
          onContinue={() => setCurrentPage(1)}
          onAddTournament={() => setCurrentPage(0.5)}
          onManageTournaments={() => setCurrentPage(0.6)}
          onExportBackup={exportBackup}
          onImportBackup={importBackup}
          onClearAllData={clearAllData}
        />
      )}
      
      {currentPage === 0.5 && (
        <AddTournamentPage
          tournaments={tournaments}
          addTournament={addTournament}
          masterData={getCurrentTournamentPlayers()}
          setMasterData={setCurrentTournamentPlayers}
          tournamentPlayers={tournamentPlayers}
          setTournamentPlayers={setTournamentPlayers}
          uploadPlayersFile={uploadPlayersFile}
          loading={playersLoading}
          onBack={() => setCurrentPage(0)}
        />
      )}
      
      {currentPage === 0.6 && (
        <ManageTournamentsPage
          tournaments={tournaments}
          deleteTournament={deleteTournament}
          selectedEvent={selectedEvent}
          onBack={() => setCurrentPage(0)}
        />
      )}
      
      {currentPage === 1 && (
        <RegistrationPage
          selectedEvent={selectedEvent}
          employee={employee}
          tournaments={tournaments}
          masterData={getCurrentTournamentPlayers()}
          setMasterData={setCurrentTournamentPlayers}
          registrations={registrations}
          setRegistrations={setRegistrations}
          addRegistration={addRegistration}
          setCurrentPage={setCurrentPage}
          loading={registrationsLoading}
        />
      )}
      
      {currentPage === 3 && (
        <ExportPage
          selectedEvent={selectedEvent}
          employee={employee}
          masterData={getCurrentTournamentPlayers()}
          registrations={registrations}
          setCurrentPage={setCurrentPage}
        />
      )}
    </>
  );
};

export default BlackjackRegistrationTool;